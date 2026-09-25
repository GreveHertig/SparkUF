import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyStateError, OutreachTransportError } from "@/core/errors";
import { makePulseSupabaseFake, type PulseFakeTables } from "@/test/stubs/pulseSupabaseFake";

const requireSupabaseUser = vi.fn();
const search = vi.fn();
vi.mock("@/lib/server/session", () => ({ requireSupabaseUser: () => requireSupabaseUser() }));
vi.mock("@/lib/server/tavily", () => ({ search: (...a: unknown[]) => search(...a) }));

import { livePulseProvider as pulse, extractKeywords, pickRelevant, stem } from "./PulseProvider";

const USER = "user-1";
const TODAY = "2026-09-25";
const NOW = new Date("2026-09-25T12:00:00Z");
const HOUR = 60 * 60 * 1000;
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

const project = { id: "p1", user_id: USER, name: "Kvittojakten", one_liner: "Kvittohantering för redovisningsbyråer", is_active: true };

function hit(n: number, extra: Partial<{ title: string; url: string; content: string; publishedDate: string }> = {}) {
  return {
    title: `Redovisningsbyråer växer ${n}`,
    url: `https://www.nyheter.se/a-${n}`,
    content: "Nyheter om redovisning.",
    publishedDate: `2026-09-2${n}T08:00:00Z`,
    ...extra,
  };
}

let tables: PulseFakeTables;
function setup(extra: PulseFakeTables = {}, failOn: string[] = []) {
  tables = { projects: [project], pulse_fetches: [], pulse_signals: [], ...extra };
  requireSupabaseUser.mockResolvedValue({ supabase: makePulseSupabaseFake(tables, { today: TODAY, failOn }), userId: USER });
}
const fetchRow = () => tables.pulse_fetches[0];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  requireSupabaseUser.mockReset();
  search.mockReset().mockResolvedValue([hit(1), hit(2), hit(3)]);
  setup();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("dagscachen", () => {
  it("första anropet tar dagens rad, söker en gång och sätter done", async () => {
    const signals = await pulse.getSignals("sv");
    expect(search).toHaveBeenCalledTimes(1);
    expect(signals).toHaveLength(3);
    expect(fetchRow()).toMatchObject({ fetch_date: TODAY, status: "done" });
    expect(fetchRow().fetched_at).not.toBeNull();
  });

  it("andra anropet samma dag söker inte igen", async () => {
    await pulse.getSignals("sv");
    await pulse.getSignals("sv");
    await pulse.getTodaysSignal("sv");
    expect(search).toHaveBeenCalledTimes(1);
  });

  it("två samtidiga anrop ger ett enda Tavily-anrop", async () => {
    await Promise.all([pulse.getSignals("sv"), pulse.getSignals("sv")]);
    expect(search).toHaveBeenCalledTimes(1);
  });

  it.each(["done", "empty"])("status %s söker inte", async (status) => {
    setup({ pulse_fetches: [{ user_id: USER, fetch_date: TODAY, status, claimed_at: ago(HOUR), fetched_at: ago(HOUR) }] });
    await pulse.getSignals("sv");
    expect(search).not.toHaveBeenCalled();
  });

  it("färsk pending (en annan förfrågan söker) söker inte", async () => {
    setup({ pulse_fetches: [{ user_id: USER, fetch_date: TODAY, status: "pending", claimed_at: ago(60_000), fetched_at: null }] });
    await pulse.getSignals("sv");
    expect(search).not.toHaveBeenCalled();
    expect(fetchRow().status).toBe("pending");
  });

  it("övergiven pending (äldre än 5 min) tas över och söks", async () => {
    setup({ pulse_fetches: [{ user_id: USER, fetch_date: TODAY, status: "pending", claimed_at: ago(6 * 60_000), fetched_at: null }] });
    await pulse.getSignals("sv");
    expect(search).toHaveBeenCalledTimes(1);
    expect(fetchRow().status).toBe("done");
  });

  it("error yngre än 6 timmar försöks inte igen", async () => {
    setup({ pulse_fetches: [{ user_id: USER, fetch_date: TODAY, status: "error", claimed_at: ago(6 * HOUR), fetched_at: ago(5 * HOUR) }] });
    await pulse.getSignals("sv");
    expect(search).not.toHaveBeenCalled();
    expect(fetchRow().status).toBe("error");
  });

  it("error äldre än 6 timmar försöks igen, av bara en förfrågan", async () => {
    setup({ pulse_fetches: [{ user_id: USER, fetch_date: TODAY, status: "error", claimed_at: ago(8 * HOUR), fetched_at: ago(7 * HOUR) }] });
    await Promise.all([pulse.getSignals("sv"), pulse.getSignals("sv")]);
    expect(search).toHaveBeenCalledTimes(1);
    expect(fetchRow().status).toBe("done");
  });

  it("taket: högst 3 omförsök under en dag där Tavily hela tiden fallerar", async () => {
    search.mockRejectedValue(new OutreachTransportError("nere"));
    setup();
    const start = new Date("2026-09-25T00:00:30+02:00").getTime();
    // Ett anrop var tionde minut hela dagen (svensk tid).
    for (let t = start; t < start + 24 * HOUR - 60_000; t += 10 * 60_000) {
      vi.setSystemTime(t);
      await pulse.getSignals("sv");
    }
    expect(search).toHaveBeenCalledTimes(4); // första försöket + 3 omförsök
  });

  it("nästa dag får en ny rad och en ny sökning", async () => {
    setup({ pulse_fetches: [{ user_id: USER, fetch_date: "2026-09-24", status: "done", claimed_at: ago(30 * HOUR), fetched_at: ago(30 * HOUR) }] });
    await pulse.getSignals("sv");
    expect(search).toHaveBeenCalledTimes(1);
    expect(tables.pulse_fetches).toHaveLength(2);
  });
});

describe("fel", () => {
  it("Tavily-fel ger status error med fetched_at satt och ett tomt svar", async () => {
    search.mockRejectedValue(new OutreachTransportError("nere"));
    expect(await pulse.getSignals("sv")).toEqual([]);
    expect(fetchRow().status).toBe("error");
    expect(fetchRow().fetched_at).not.toBeNull();
  });

  it("konfigurationsfel (t.ex. saknad nyckel) sätter error men syns", async () => {
    search.mockRejectedValue(new Error("TAVILY_API_KEY saknas."));
    await expect(pulse.getSignals("sv")).rejects.toThrow("TAVILY_API_KEY");
    expect(fetchRow().status).toBe("error");
  });

  it("fel när signalerna sparas sätter error", async () => {
    setup({}, ["pulse_signals:insert"]);
    await expect(pulse.getSignals("sv")).rejects.toThrow("kunde inte spara");
    expect(fetchRow().status).toBe("error");
  });

  it("inga relevanta träffar ger status empty", async () => {
    search.mockResolvedValue([hit(1, { title: "Fotboll i helgen", content: "Matchen slutade 2–1." })]);
    expect(await pulse.getSignals("sv")).toEqual([]);
    expect(fetchRow().status).toBe("empty");
  });

  it("getTodaysSignal utan signaler kastar EmptyStateError", async () => {
    search.mockResolvedValue([]);
    await expect(pulse.getTodaysSignal("sv")).rejects.toBeInstanceOf(EmptyStateError);
  });

  it("utan aktivt projekt: tom lista, ingen sökning", async () => {
    setup({ projects: [] });
    expect(await pulse.getSignals("sv")).toEqual([]);
    expect(search).not.toHaveBeenCalled();
  });
});

describe("signalerna", () => {
  it("varje signal har källa, hämtdatum och url, nyast först", async () => {
    const signals = await pulse.getSignals("sv");
    expect(signals.map((s) => s.headline)).toEqual([
      "Redovisningsbyråer växer 3",
      "Redovisningsbyråer växer 2",
      "Redovisningsbyråer växer 1",
    ]);
    for (const s of signals) {
      expect(s.source).toMatchObject({ namn: "nyheter.se", hämtad: TODAY });
      expect(s.source.url).toMatch(/^https:\/\/www\.nyheter\.se\//);
      expect(s.whyItMatters).toContain("Kvittojakten");
    }
  });

  it("följer språket", async () => {
    const [signal] = await pulse.getSignals("en");
    expect(signal.category).toBe("Industry news");
    expect(signal.whyItMatters).toContain("Kvittojakten");
  });

  it("högst 5 signaler, och samma artikel sparas inte två gånger", async () => {
    search.mockResolvedValue([hit(1), hit(1), hit(2), hit(3), hit(4), hit(5)]);
    await pulse.getSignals("sv");
    vi.setSystemTime(new Date("2026-09-26T12:00:00Z"));
    tables.pulse_fetches.length = 0;
    search.mockResolvedValue([hit(1), hit(6)]);
    const signals = await pulse.getSignals("sv");
    expect(signals).toHaveLength(5);
    expect(tables.pulse_signals).toHaveLength(6);
  });

  it("sökfrågan innehåller bara nyckelord, inte grundarens hela text", async () => {
    await pulse.getSignals("sv");
    expect(search).toHaveBeenCalledWith({
      query: "svenska näringslivsnyheter kvittojakten kvittohantering redovisningsbyråer",
      maxResults: 5,
    });
  });

  it("rubriken rensas från styrtecken och kapas", async () => {
    search.mockResolvedValue([hit(1, { title: `Redovisningsbyråer\u0000‮ ${"x".repeat(400)}` })]);
    const [signal] = await pulse.getSignals("sv");
    expect(signal.headline).not.toMatch(/[\u0000‮]/);
    expect(Array.from(signal.headline).length).toBeLessThanOrEqual(200);
  });

  it("publiceringsdatum i framtiden ersätts med nu", async () => {
    search.mockResolvedValue([hit(1, { publishedDate: "2030-01-01T00:00:00Z" })]);
    await pulse.getSignals("sv");
    expect(tables.pulse_signals[0].signal_at).toBe(NOW.toISOString());
  });
});

describe("hjälpfunktioner", () => {
  it("extractKeywords tar bort korta ord, stoppord och dubbletter", () => {
    expect(extractKeywords("Appen för redovisning och Redovisning till byråer")).toEqual(["appen", "redovisning", "byråer"]);
    expect(extractKeywords("en app")).toEqual([]);
  });

  it("stem tar bort böjningsändelser men lämnar minst fyra tecken", () => {
    expect(stem("redovisningsbyråer")).toBe("redovisningsbyrå");
    expect(stem("byråerna")).toBe("byrå");
    expect(stem("appen")).toBe("appen");
  });

  it("pickRelevant hittar böjda former", () => {
    const kept = pickRelevant([hit(1, { title: "Ny redovisningsbyrå i Malmö", content: "" })], ["redovisningsbyråer"]);
    expect(kept).toHaveLength(1);
  });

  it("pickRelevant kräver rubrik och ett nyckelord", () => {
    const kept = pickRelevant(
      [hit(1), hit(2, { title: "  " }), hit(3, { title: "Väder", content: "Sol" })],
      ["redovisning"],
    );
    expect(kept.map((r) => r.url)).toEqual(["https://www.nyheter.se/a-1"]);
  });
});
