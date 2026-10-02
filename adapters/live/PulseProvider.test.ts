import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyStateError, NotImplementedError, OutreachTransportError, PulseWatchError } from "@/core/errors";
import { makePulseSupabaseFake, type PulseFakeTables } from "@/test/stubs/pulseSupabaseFake";

const requireSupabaseUser = vi.fn();
const search = vi.fn();
vi.mock("@/lib/server/session", () => ({ requireSupabaseUser: () => requireSupabaseUser() }));
vi.mock("@/lib/server/tavily", () => ({ search: (...a: unknown[]) => search(...a) }));

import {
  livePulseProvider as pulse,
  classify,
  classifyOpportunity,
  cleanWatchTerm,
  classifyRisk,
  extractKeywords,
  favoriteInsight,
  learnPreferences,
  preferenceScore,
  pickRelevant,
  pickThemed,
  themeFor,
  stem,
} from "./PulseProvider";
import { PULSE_OPPORTUNITY_AREAS, PULSE_RISK_AREAS } from "@/core/domain";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";

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
function setup(extra: PulseFakeTables = {}, failOn: string[] = [], missingTables: string[] = []) {
  tables = { projects: [project], pulse_fetches: [], pulse_signals: [], ...extra };
  requireSupabaseUser.mockResolvedValue({
    supabase: makePulseSupabaseFake(tables, { today: TODAY, failOn, missingTables }),
    userId: USER,
  });
}
const fetchRow = () => tables.pulse_fetches[0];
/** En hämtning = en nyhetssökning (och en risksökning när nyheterna gick bra). Dagscachen räknar hämtningar. */
const queries = () => search.mock.calls.map((call) => (call[0] as { query: string }).query);
const fetches = () => queries().filter((query) => query.startsWith("svenska näringslivsnyheter")).length;
const riskSearches = () => queries().filter((query) => !query.startsWith("svenska näringslivsnyheter")).length;

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
    expect(fetches()).toBe(1);
    expect(riskSearches()).toBe(1);
    expect(signals).toHaveLength(3);
    expect(fetchRow()).toMatchObject({ fetch_date: TODAY, status: "done" });
    expect(fetchRow().fetched_at).not.toBeNull();
  });

  it("andra anropet samma dag söker inte igen", async () => {
    await pulse.getSignals("sv");
    await pulse.getSignals("sv");
    await pulse.getTodaysSignal("sv");
    expect(fetches()).toBe(1);
  });

  it("två samtidiga anrop ger ett enda Tavily-anrop", async () => {
    await Promise.all([pulse.getSignals("sv"), pulse.getSignals("sv")]);
    expect(fetches()).toBe(1);
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
    expect(fetches()).toBe(1);
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
    expect(fetches()).toBe(1);
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
    expect(fetches()).toBe(4); // första försöket + 3 omförsök
  });

  it("nästa dag får en ny rad och en ny sökning", async () => {
    setup({ pulse_fetches: [{ user_id: USER, fetch_date: "2026-09-24", status: "done", claimed_at: ago(30 * HOUR), fetched_at: ago(30 * HOUR) }] });
    await pulse.getSignals("sv");
    expect(fetches()).toBe(1);
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

/** Svarar olika på nyhetssökningen och risksökningen. */
function searchReturns(news: unknown[] | Error, risk: unknown[] | Error) {
  search.mockImplementation(async ({ query }: { query: string }) => {
    const answer = query.startsWith("svenska näringslivsnyheter") ? news : risk;
    if (answer instanceof Error) throw answer;
    return answer;
  });
}
const riskHit = (n: number, title: string, content = "") =>
  hit(n, { title, content, url: `https://www.ekonomi.se/r-${n}` });

describe("risksignaler", () => {
  it("varje hämtning gör en risksökning med dagens tema och projektets nyckelord", async () => {
    await pulse.getSignals("sv");
    const riskQuery = queries().find((query) => !query.startsWith("svenska näringslivsnyheter"))!;
    expect(riskQuery).toContain("kvittojakten kvittohantering redovisningsbyråer");
    // 2026-09-25 ger ett bestämt tema; temats fasta ord står först.
    expect(riskQuery.startsWith(themeQueryStart(themeFor(TODAY)))).toBe(true);
  });

  it("en risk sparas med sitt område och visas med område, förklaring och förslag", async () => {
    searchReturns([hit(1)], [riskHit(5, "Elpriset stiger kraftigt i vinter", "Högre energipris för företag")]);
    const signals = await pulse.getSignals("sv");
    const risk = signals.find((signal) => signal.risk)!;
    expect(risk.risk!.area).toBe("costs");
    expect(risk.category).toBe(`Risk · ${sv.pulsePage.riskAreas.costs.name}`);
    expect(risk.whyItMatters).toContain("Kvittojakten");
    expect(risk.risk!.actions).toEqual(sv.pulsePage.riskAreas.costs.actions);
    // Källan är artikeln, som för alla signaler.
    expect(risk.source).toMatchObject({ namn: "ekonomi.se", hämtad: TODAY, url: "https://www.ekonomi.se/r-5" });
    expect(tables.pulse_signals.find((row) => row.source_url === "https://www.ekonomi.se/r-5")!.category).toBe("risk:costs");
    // En vanlig nyhet har ingen risk.
    expect(signals.find((signal) => signal.headline === "Redovisningsbyråer växer 1")!.risk).toBeUndefined();
  });

  it("en nyhet som själv handlar om en risk blir en risk", async () => {
    searchReturns([hit(1, { title: "Räntan höjs för redovisningsbyråer" })], []);
    const [signal] = await pulse.getSignals("sv");
    expect(signal.risk?.area).toBe("finance");
  });

  it("en träff från risksökningen utan riskord sparas inte", async () => {
    searchReturns([hit(1)], [riskHit(5, "Ny kafékedja öppnar i Malmö", "Kaffe och bullar")]);
    const signals = await pulse.getSignals("sv");
    expect(signals.map((signal) => signal.headline)).toEqual(["Redovisningsbyråer växer 1"]);
  });

  it("samma artikel från båda sökningarna sparas en gång", async () => {
    const shared = hit(1, { title: "Redovisningsbyråer möter ny konkurrent" });
    searchReturns([shared], [shared]);
    await pulse.getSignals("sv");
    expect(tables.pulse_signals).toHaveLength(1);
    expect(tables.pulse_signals[0].category).toBe("risk:competition");
  });

  it("ett nätverksfel i risksökningen stoppar inte dagens nyheter", async () => {
    searchReturns([hit(1), hit(2), hit(3)], new OutreachTransportError("nere"));
    const signals = await pulse.getSignals("sv");
    expect(signals).toHaveLength(3);
    expect(fetchRow().status).toBe("done");
  });

  it("ett konfigurationsfel i risksökningen syns och sätter error", async () => {
    searchReturns([hit(1)], new Error("TAVILY_API_KEY saknas"));
    await expect(pulse.getSignals("sv")).rejects.toThrow("TAVILY_API_KEY saknas");
    expect(fetchRow().status).toBe("error");
  });

  it("högst 3 risker, och risker trängs inte undan av många nyheter", async () => {
    searchReturns(
      [1, 2, 3, 4, 5].map((n) => hit(n)),
      [5, 6, 7, 8].map((n) => riskHit(n, `Konkurrent lanserar tjänst ${n}`)),
    );
    const signals = await pulse.getSignals("sv");
    expect(signals).toHaveLength(5);
    expect(signals.filter((signal) => signal.risk)).toHaveLength(3);
    expect(signals.filter((signal) => !signal.risk)).toHaveLength(2);
  });

  it("äldre rader med kategorin Branschnyhet läses som nyheter", async () => {
    setup({
      pulse_fetches: [{ user_id: USER, fetch_date: TODAY, status: "done", claimed_at: ago(HOUR), fetched_at: ago(HOUR) }],
      pulse_signals: [
        {
          user_id: USER,
          project_id: "p1",
          category: "Branschnyhet",
          headline: "Gammal nyhet",
          why_it_matters: "x",
          signal_at: ago(HOUR),
          source_name: "nyheter.se",
          source_url: "https://www.nyheter.se/gammal",
          fetched_at: TODAY,
        },
      ],
    });
    const [signal] = await pulse.getSignals("sv");
    expect(signal.risk).toBeUndefined();
    expect(signal.category).toBe(sv.pulsePage.liveCategory);
  });

  it("följer språket, även förslagen", async () => {
    searchReturns([], [riskHit(5, "Ny lagändring skärper kraven", "Regelverk för företag")]);
    const [signal] = await pulse.getSignals("en");
    expect(signal.risk!.area).toBe("regulation");
    expect(signal.category).toBe(`Risk · ${en.pulsePage.riskAreas.regulation.name}`);
    expect(signal.risk!.actions).toEqual(en.pulsePage.riskAreas.regulation.actions);
  });
});

describe("riskklassningen", () => {
  it("hittar rätt område, rubriken väger tyngst", () => {
    expect(classifyRisk({ title: "Elpriset stiger igen", content: "" })).toBe("costs");
    expect(classifyRisk({ title: "Riksbanken höjer räntan", content: "" })).toBe("finance");
    expect(classifyRisk({ title: "Lagförslag om nya krav", content: "" })).toBe("regulation");
    expect(classifyRisk({ title: "Varsel i handeln", content: "" })).toBe("demand");
    expect(classifyRisk({ title: "Strejk i hamnen stoppar leveranser", content: "" })).toBe("supply");
    expect(classifyRisk({ title: "Varsel i handeln", content: "konkurrent konkurrent" })).toBe("demand");
  });

  it("en vanlig nyhet är ingen risk", () => {
    expect(classifyRisk({ title: "Redovisningsbyråer växer", content: "Nyheter om redovisning" })).toBeNull();
    expect(classifyRisk({ title: "Intressant intervju med en grundare", content: "" })).toBeNull();
  });

  it("pickThemed kräver rubrik och ett risk- eller möjlighetsord", () => {
    const picked = pickThemed([
      riskHit(1, "Inflationen biter"),
      riskHit(2, "  "),
      riskHit(3, "Sol i helgen"),
      riskHit(4, "Ny upphandling av redovisningstjänster"),
    ]);
    expect(picked.map(({ insight }) => insight)).toEqual([
      { kind: "risk", area: "costs" },
      { kind: "opportunity", area: "procurement" },
    ]);
  });

  it("dagens tema roterar genom alla åtta teman på åtta dagar", () => {
    const days = Array.from({ length: 8 }, (_, i) => `2026-09-${String(20 + i).padStart(2, "0")}`);
    const themes = days.map((day) => JSON.stringify(themeFor(day)));
    expect(new Set(themes).size).toBe(PULSE_RISK_AREAS.length + PULSE_OPPORTUNITY_AREAS.length);
    expect(themeFor("2026-09-28")).toEqual(themeFor("2026-09-20"));
  });
});

describe("möjligheter", () => {
  it("klassas till rätt område", () => {
    expect(classifyOpportunity({ title: "Vinnova öppnar ny utlysning för småföretag", content: "" })).toBe("funding");
    expect(classifyOpportunity({ title: "Kommunen upphandlar redovisningstjänster", content: "" })).toBe("procurement");
    expect(classifyOpportunity({ title: "Redovisningsbyråer växer", content: "" })).toBeNull();
  });

  it("vid lika poäng vinner risken", () => {
    expect(classify({ title: "Bidrag och inflation", content: "" })).toEqual({ kind: "risk", area: "costs" });
  });

  it("en möjlighet sparas och visas med område, förklaring och förslag", async () => {
    searchReturns([hit(1)], [riskHit(5, "Almi lanserar nytt startstöd", "Bidrag till nya företag")]);
    const signals = await pulse.getSignals("sv");
    const opportunity = signals.find((signal) => signal.opportunity)!;
    expect(opportunity.opportunity!.area).toBe("funding");
    expect(opportunity.risk).toBeUndefined();
    expect(opportunity.category).toBe(`${sv.pulsePage.opportunityLabel} · ${sv.pulsePage.opportunityAreas.funding.name}`);
    expect(opportunity.whyItMatters).toContain("Kvittojakten");
    expect(opportunity.opportunity!.actions).toEqual(sv.pulsePage.opportunityAreas.funding.actions);
    expect(tables.pulse_signals.find((row) => row.source_url === "https://www.ekonomi.se/r-5")!.category).toBe(
      "opportunity:funding",
    );
  });

  it("högst 2 möjligheter, risker först, totalt högst 5", async () => {
    searchReturns(
      [1, 2, 3, 4, 5].map((n) => hit(n)),
      [
        riskHit(5, "Konkurrent lanserar tjänst"),
        riskHit(6, "Konkurrent köper upp byrå", "uppköp"),
        riskHit(7, "Ny upphandling av redovisning"),
        riskHit(8, "Kommunen upphandlar bokföring"),
        riskHit(9, "Region upphandlar ekonomitjänster"),
      ],
    );
    const signals = await pulse.getSignals("sv");
    expect(signals).toHaveLength(5);
    expect(signals.filter((signal) => signal.risk)).toHaveLength(2);
    expect(signals.filter((signal) => signal.opportunity)).toHaveLength(2);
    expect(signals.filter((signal) => !signal.risk && !signal.opportunity)).toHaveLength(1);
  });

  it("en okänd kategori i databasen läses som nyhet (vitlistan)", async () => {
    setup({
      pulse_fetches: [{ user_id: USER, fetch_date: TODAY, status: "done", claimed_at: ago(HOUR), fetched_at: ago(HOUR) }],
      pulse_signals: ["risk:påhittat", "opportunity:<script>", "opportunity:funding"].map((category, n) => ({
        user_id: USER,
        project_id: "p1",
        category,
        headline: `Rad ${n}`,
        why_it_matters: "x",
        signal_at: ago(HOUR * (n + 1)),
        source_name: "nyheter.se",
        source_url: `https://www.nyheter.se/rad-${n}`,
        fetched_at: TODAY,
      })),
    });
    const signals = await pulse.getSignals("sv");
    expect(signals.map((signal) => [signal.headline, signal.risk?.area ?? signal.opportunity?.area ?? null])).toEqual([
      ["Rad 0", null],
      ["Rad 1", null],
      ["Rad 2", "funding"],
    ]);
  });

  it("följer språket", async () => {
    searchReturns([], [riskHit(5, "New public tender: upphandling of accounting")]);
    const [signal] = await pulse.getSignals("en");
    expect(signal.category).toBe(`${en.pulsePage.opportunityLabel} · ${en.pulsePage.opportunityAreas.procurement.name}`);
    expect(signal.opportunity!.actions).toEqual(en.pulsePage.opportunityAreas.procurement.actions);
  });
});

/** Temasökningens fasta ord, som de står först i frågan. */
function themeQueryStart(theme: { kind: string; area: string }): string {
  const prefixes: Record<string, string> = {
    "risk:costs": "stigande priser",
    "risk:finance": "räntan Riksbanken",
    "risk:regulation": "nya regler",
    "risk:competition": "konkurrent lanserar",
    "risk:demand": "konjunktur efterfrågan",
    "risk:supply": "leveransproblem brist",
    "opportunity:funding": "bidrag företagsstöd",
    "opportunity:procurement": "offentlig upphandling",
  };
  return prefixes[`${theme.kind}:${theme.area}`];
}

describe("omdöme", () => {
  it("varje signal har sitt id, och Inte relevant döljer den", async () => {
    const signals = await pulse.getSignals("sv");
    expect(signals.every((signal) => typeof signal.id === "string")).toBe(true);
    const hidden = signals[0];
    await pulse.setFeedback!(hidden.id!, "not_relevant");
    const after = await pulse.getSignals("sv");
    expect(after.map((signal) => signal.id)).not.toContain(hidden.id);
    expect(after).toHaveLength(signals.length - 1);
  });

  it("Relevant döljer ingenting, och ett nytt omdöme skriver över det gamla", async () => {
    const [signal] = await pulse.getSignals("sv");
    await pulse.setFeedback!(signal.id!, "not_relevant");
    await pulse.setFeedback!(signal.id!, "relevant");
    expect(tables.pulse_feedback).toHaveLength(1);
    expect((await pulse.getSignals("sv")).map((s) => s.id)).toContain(signal.id);
  });

  it("ogiltigt id eller omdöme avvisas innan databasen", async () => {
    await expect(pulse.setFeedback!("inte-ett-id", "relevant")).rejects.toThrow("ogiltigt signal-id");
    const [signal] = await pulse.getSignals("sv");
    await expect(pulse.setFeedback!(signal.id!, "kanske" as never)).rejects.toThrow("ogiltigt omdöme");
  });

  it("utan tabellen (migreringen inte körd): signalerna visas som vanligt, omdömet ger NotImplementedError", async () => {
    setup({}, [], ["pulse_feedback", "pulse_watches"]);
    const signals = await pulse.getSignals("sv");
    expect(signals).toHaveLength(3);
    await expect(pulse.setFeedback!(signals[0].id!, "relevant")).rejects.toBeInstanceOf(NotImplementedError);
  });
});

describe("bevakningar", () => {
  it("läggs till, läses och tas bort", async () => {
    await pulse.addWatch!("competitor", "  ByråFlöde  ");
    await pulse.addWatch!("keyword", "kvittoskanning");
    const watches = await pulse.getWatches!();
    expect(watches.map((w) => [w.kind, w.term])).toEqual([
      ["competitor", "ByråFlöde"],
      ["keyword", "kvittoskanning"],
    ]);
    await pulse.removeWatch!(watches[0].id);
    expect((await pulse.getWatches!()).map((w) => w.term)).toEqual(["kvittoskanning"]);
  });

  it("samma ord två gånger ignoreras, oavsett stora och små bokstäver", async () => {
    await pulse.addWatch!("keyword", "Kvitto");
    await pulse.addWatch!("keyword", "kvitto");
    expect(await pulse.getWatches!()).toHaveLength(1);
  });

  it("för kort, för många och utan projekt ger PulseWatchError med skäl", async () => {
    await expect(pulse.addWatch!("keyword", " x ")).rejects.toMatchObject({ reason: "too_short" });
    for (let n = 0; n < 10; n++) await pulse.addWatch!("keyword", `ord${n}`);
    await expect(pulse.addWatch!("keyword", "ett till")).rejects.toMatchObject({ reason: "too_many" });
    setup({ projects: [] });
    await expect(pulse.addWatch!("keyword", "ord")).rejects.toBeInstanceOf(PulseWatchError);
  });

  it("bevakningarna ingår i sökningen och i relevansfiltret", async () => {
    await pulse.addWatch!("competitor", "ByråFlöde");
    searchReturns([hit(1, { title: "ByråFlöde öppnar kontor i Malmö", content: "" })], []);
    const signals = await pulse.getSignals("sv");
    expect(queries()[0]).toContain("byråflöde");
    // Nämner en bevakad konkurrent och inget annat riskord: en konkurrensrisk.
    expect(signals[0].risk?.area).toBe("competition");
  });

  it("utan nyckelord men med bevakningar söks det ändå", async () => {
    setup({ projects: [{ ...project, name: "X", one_liner: "app" }] });
    expect(await pulse.getSignals("sv")).toEqual([]);
    expect(search).not.toHaveBeenCalled();
    // Ingen hämtning gjordes utan sökord, så bevakningen ger träffar direkt samma dag.
    expect(tables.pulse_fetches).toHaveLength(0);
    await pulse.addWatch!("keyword", "padelhallar");
    searchReturns([hit(1, { title: "Padelhallar går bra", content: "" })], []);
    expect((await pulse.getSignals("sv")).map((s) => s.headline)).toEqual(["Padelhallar går bra"]);
    expect(queries()[0]).toBe("svenska näringslivsnyheter padelhallar");
  });

  it("utan tabellen: getWatches och addWatch ger NotImplementedError, sökningen går som vanligt", async () => {
    setup({}, [], ["pulse_watches"]);
    await expect(pulse.getWatches!()).rejects.toBeInstanceOf(NotImplementedError);
    await expect(pulse.addWatch!("keyword", "ord")).rejects.toBeInstanceOf(NotImplementedError);
    expect(await pulse.getSignals("sv")).toHaveLength(3);
  });

  it("cleanWatchTerm tar bort styrtecken, slår ihop blanksteg och kapar", () => {
    expect(cleanWatchTerm("  Byrå\u0007   Flöde\n ")).toBe("Byrå Flöde");
    expect(Array.from(cleanWatchTerm("x".repeat(100)))).toHaveLength(60);
  });
});

/** Dagnumret som themeFor räknar med, för att välja en jämn eller udda dag. */
const dayNumber = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / (24 * 60 * 60 * 1000));
const signalRow = (n: number, category: string, headline: string, hoursAgo = n) => ({
  id: `00000000-0000-4000-8000-00000000000${n}`,
  user_id: USER,
  project_id: "p1",
  category,
  headline,
  why_it_matters: "x",
  signal_at: ago(HOUR * hoursAgo),
  source_name: "nyheter.se",
  source_url: `https://www.nyheter.se/l-${n}`,
  fetched_at: TODAY,
});
const doneToday = () => [{ user_id: USER, fetch_date: TODAY, status: "done", claimed_at: ago(HOUR), fetched_at: ago(HOUR) }];
const doneYesterday = () => [
  { user_id: USER, fetch_date: "2026-09-24", status: "done", claimed_at: ago(30 * HOUR), fetched_at: ago(30 * HOUR) },
];

describe("inlärning ur Relevant", () => {
  it("learnPreferences räknar sorter och tar bara ord som står i minst två gillade rubriker", () => {
    const preferences = learnPreferences([
      { category: "risk:costs", headline: "Elpriset pressar kaféer i Göteborg" },
      { category: "risk:costs", headline: "Kaféer höjer priserna efter elpriset, 40 miljoner" },
      { category: "Branschnyhet", headline: "Kafé i Malmö satsar 40 miljoner" },
    ]);
    expect(preferences.areaLikes.get("risk:costs")).toBe(2);
    expect(preferences.areaLikes.get("news")).toBe(1);
    // "elpriset" och "kaféer" står i två rubriker. Siffror och nyhetsord ("miljoner", "satsar") lärs aldrig.
    expect(preferences.terms).toEqual(expect.arrayContaining(["elpris", "kafé"]));
    expect(preferences.terms).not.toContain("miljon");
    expect(preferences.terms.every((term) => !/\d/.test(term))).toBe(true);
  });

  it("learnPreferences hoppar över ord som redan söks och tar högst tre", () => {
    const headlines = ["alfa beta gamma delta epsilon", "alfa beta gamma delta epsilon"].map((headline) => ({
      category: "Branschnyhet",
      headline,
    }));
    const preferences = learnPreferences(headlines, ["alfa"]);
    expect(preferences.terms).not.toContain("alfa");
    expect(preferences.terms).toHaveLength(3);
  });

  it("inga omdömen ger inga preferenser och poängen noll", () => {
    const preferences = learnPreferences([]);
    expect(preferences.terms).toEqual([]);
    expect(favoriteInsight(preferences)).toBeNull();
    expect(preferenceScore({ category: "risk:costs", headline: "Elpriset stiger" }, preferences)).toBe(0);
  });

  it("favoritområdet är risken eller möjligheten med flest gillade, aldrig en vanlig nyhet", () => {
    const preferences = learnPreferences([
      { category: "Branschnyhet", headline: "a" },
      { category: "Branschnyhet", headline: "b" },
      { category: "Branschnyhet", headline: "c" },
      { category: "opportunity:funding", headline: "d" },
    ]);
    expect(favoriteInsight(preferences)).toEqual({ kind: "opportunity", area: "funding" });
  });

  it("med ett favoritområde blir varannan dag favoriten och de andra dagarna roterar genom alla åtta", () => {
    const favorite = { kind: "risk" as const, area: "costs" as const };
    const start = Date.parse("2026-09-01T00:00:00Z");
    const days = Array.from({ length: 32 }, (_, i) => new Date(start + i * 24 * HOUR).toISOString().slice(0, 10));
    const odd = days.filter((day) => dayNumber(day) % 2 !== 0);
    const even = days.filter((day) => dayNumber(day) % 2 === 0);
    expect(odd.every((day) => JSON.stringify(themeFor(day, favorite)) === JSON.stringify(favorite))).toBe(true);
    expect(new Set(even.map((day) => JSON.stringify(themeFor(day, favorite)))).size).toBe(
      PULSE_RISK_AREAS.length + PULSE_OPPORTUNITY_AREAS.length,
    );
  });

  it("det som liknar en gillad signal visas först", async () => {
    setup({
      pulse_fetches: doneToday(),
      pulse_signals: [
        signalRow(1, "Branschnyhet", "Redovisningsbyråer växer"),
        signalRow(2, "risk:finance", "Räntan höjs igen", 2),
        signalRow(3, "risk:costs", "Elpriset stiger i vinter", 3),
        signalRow(4, "risk:costs", "Dyrare frakt för småföretag", 4),
      ],
    });
    expect((await pulse.getSignals("sv"))[0].headline).toBe("Redovisningsbyråer växer");
    await pulse.setFeedback!(signalRow(3, "", "").id, "relevant");
    const after = await pulse.getSignals("sv");
    // Båda kostnadsriskerna före de andra, den gillade av dem först (lika poäng: nyast först).
    expect(after.map((signal) => signal.headline).slice(0, 2)).toEqual([
      "Elpriset stiger i vinter",
      "Dyrare frakt för småföretag",
    ]);
    expect(after).toHaveLength(4);
  });

  it("nästa dags sökning tar med inlärda ord och, en udda dag, favoritområdet som tema", async () => {
    setup({
      pulse_fetches: doneYesterday(),
      pulse_signals: [
        signalRow(1, "risk:costs", "Elpriset slår mot kaféer"),
        signalRow(2, "risk:costs", "Kaféer höjer priserna när elpriset stiger"),
      ],
    });
    await pulse.setFeedback!(signalRow(1, "", "").id, "relevant");
    await pulse.setFeedback!(signalRow(2, "", "").id, "relevant");
    await pulse.getSignals("sv");
    const [news, theme] = queries();
    expect(news).toContain("elpris");
    expect(news).toContain("kafé");
    // Projektets egna ord står kvar först.
    expect(news.startsWith("svenska näringslivsnyheter kvittojakten")).toBe(true);
    // TODAY är en udda dag, så temat är favoriten: kostnader.
    expect(dayNumber(TODAY) % 2).toBe(1);
    expect(theme.startsWith(themeQueryStart({ kind: "risk", area: "costs" }))).toBe(true);
  });

  it("ett enda gillande lär inga sökord, bara ordningen", async () => {
    setup({ pulse_fetches: doneYesterday(), pulse_signals: [signalRow(1, "Branschnyhet", "Kaféer i Malmö går bra")] });
    await pulse.setFeedback!(signalRow(1, "", "").id, "relevant");
    await pulse.getSignals("sv");
    expect(queries()[0]).not.toContain("kafé");
  });

  it("gillade signaler i ett annat projekt räknas inte", async () => {
    setup({
      pulse_fetches: doneYesterday(),
      pulse_signals: [
        { ...signalRow(1, "risk:costs", "Elpriset slår mot kaféer"), project_id: "annat" },
        { ...signalRow(2, "risk:costs", "Kaféer och elpriset"), project_id: "annat" },
      ],
      pulse_feedback: [1, 2].map((n) => ({ user_id: USER, signal_id: signalRow(n, "", "").id, verdict: "relevant" })),
    });
    await pulse.getSignals("sv");
    expect(queries()[0]).not.toContain("elpris");
  });

  it("utan tabellen lärs ingenting och sidan fungerar som förut", async () => {
    setup({ pulse_fetches: doneToday(), pulse_signals: [signalRow(1, "Branschnyhet", "Redovisningsbyråer växer")] }, [], [
      "pulse_feedback",
    ]);
    expect(await pulse.getSignals("sv")).toHaveLength(1);
  });
});
