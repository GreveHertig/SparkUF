// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegistryInputError, RegistryLockedError, RegistryTransportError, isPlaceholderError } from "@/core/errors";

const assertAllowed = vi.fn();
vi.mock("@/lib/server/registryAccess", () => ({ assertRegistryAccessAllowed: () => assertAllowed() }));

import { MAX_UNITS_PER_SNI, fetchLegalUnitsBySni, resetScbState, toAfrSni } from "./scb";

const BASE = "https://apiafr.scb.se";

/** En rad i AFR:s form (docs/dataspiken.md, "Fälten i JE-listan"), med syntetiska värden. */
function je(over: Record<string, unknown> = {}) {
  return {
    peOrgNr: "165560000001",
    orgNr: "5560000001",
    namn: "Testbolag Ett AB",
    postAdress: { gatuAdress: "Gatan 1", coAdress: "", postNr: "11122", postOrt: "STOCKHOLM" },
    primarNaringsgren: { rangordning: 1, naringsgren: "69201", andelProcent: 100, avdelningsKod: "N" },
    kommunSate: "0180",
    lanSate: "01",
    anstKl: "3",
    ftgStat: "1",
    jurform: "49",
    reklamSparrTyp: 1,
    telefonSparrTyp: 1,
    epostSparrTyp: 1,
    ...over,
  };
}

const page = (rows: unknown[], hasMore: boolean, nextCursorId: number | null = null) => ({
  jes: rows,
  pagination: { nextCursorId, limit: 1000, hasMore },
});

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetScbState();
  assertAllowed.mockResolvedValue(undefined);
  process.env.SCB_AFR_API_KEY = "test-nyckel";
  process.env.SCB_AFR_API_BASE_URL = BASE;
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete process.env.SCB_AFR_API_KEY;
  delete process.env.SCB_AFR_API_BASE_URL;
});

describe("toAfrSni", () => {
  it("godtar 69.201 och 69201, och nekar allt annat", () => {
    expect(toAfrSni("69.201")).toBe("69201");
    expect(toAfrSni("69201")).toBe("69201");
    for (const bad of ["6920", "69.2011", "../x", "69 201", "", "6.9201", "692.01"]) {
      expect(() => toAfrSni(bad)).toThrow(RegistryInputError);
    }
  });
});

describe("fetchLegalUnitsBySni", () => {
  it("frågar grinden först och gör inget anrop när den är stängd", async () => {
    assertAllowed.mockRejectedValue(new RegistryLockedError());
    await expect(fetchLegalUnitsBySni("69.201")).rejects.toBeInstanceOf(RegistryLockedError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("räknar, går igenom alla sidor med cursor och skickar nyckeln bara i X-API-Key", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ count: 3, path: "x" }))
      .mockResolvedValueOnce(json(page([je()], true, 33779)))
      .mockResolvedValueOnce(json(page([je({ orgNr: "5560000002", namn: "Testbolag Två AB" })], false)));

    const listing = await fetchLegalUnitsBySni("69.201");

    expect(listing.registeredTotal).toBe(3);
    expect(listing.units.map((unit) => unit.orgNr)).toEqual(["5560000001", "5560000002"]);
    expect(listing.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const urls = fetchMock.mock.calls.map(([url]) => url);
    expect(urls).toEqual([
      `${BASE}/v1/juridiskaenheter/naringsgren/69201/count`,
      `${BASE}/v1/juridiskaenheter/naringsgren/69201?limit=1000`,
      `${BASE}/v1/juridiskaenheter/naringsgren/69201?limit=1000&cursorId=33779`,
    ]);
    for (const [url, init] of fetchMock.mock.calls) {
      expect(url).not.toContain("test-nyckel");
      expect((init as RequestInit).headers).toMatchObject({ "X-API-Key": "test-nyckel" });
      // Nyckeln följer aldrig med en omdirigering.
      expect((init as RequestInit).redirect).toBe("error");
    }
  });

  it("mappar fälten och tar aldrig med fysiska personer eller dödsbon", async () => {
    fetchMock.mockResolvedValueOnce(json({ count: 5 })).mockResolvedValueOnce(
      json(
        page(
          [
            je(),
            je({ orgNr: "5560000002", jurform: "10", namn: "Anna Andersson" }),
            je({ orgNr: "5560000003", jurform: "91", namn: "Dödsbo" }),
            je({ orgNr: "5560000004", anstKl: "0", lanSate: "99", ftgStat: "9", reklamSparrTyp: 2 }),
            je({ orgNr: "5560000005", jurform: "31", lanSate: "00", reklamSparrTyp: null }),
            // Okänd juridisk form kan vara en person: lämnar aldrig transporten.
            je({ orgNr: "5560000006", jurform: "", namn: "Okänd Form" }),
            je({ orgNr: "5560000007", jurform: null, namn: "Ingen Form" }),
          ],
          false,
        ),
      ),
    );

    const { units } = await fetchLegalUnitsBySni("69201");

    expect(units.map((unit) => unit.orgNr)).toEqual(["5560000001", "5560000004", "5560000005"]);
    expect(JSON.stringify(units)).not.toMatch(/Anna|Dödsbo|Okänd Form|Ingen Form/);
    expect(units[0]).toEqual({
      orgNr: "5560000001",
      name: "Testbolag Ett AB",
      sniCode: "69201",
      legalFormCode: "49",
      employeeClass: "3",
      active: true,
      receivesAdvertising: true,
      countyCode: "01",
    });
    expect(units[1]).toMatchObject({ employeeClass: null, countyCode: null, active: false, receivesAdvertising: false });
    // Okänd reklamspärr räknas som spärr.
    expect(units[2]).toMatchObject({ countyCode: null, receivesAdvertising: false });
    // Fält vi inte behöver lämnar aldrig transporten.
    expect(JSON.stringify(units)).not.toMatch(/Gatan|postAdress|telefonSparrTyp/);
  });

  it("två samtidiga anrop för samma bransch delar på en genomgång", async () => {
    fetchMock.mockResolvedValueOnce(json({ count: 1 })).mockResolvedValueOnce(json(page([je()], false)));
    const [a, b] = await Promise.all([fetchLegalUnitsBySni("69201"), fetchLegalUnitsBySni("69.201")]);
    expect(a).toBe(b);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("en bransch över taket gås inte igenom", async () => {
    fetchMock.mockResolvedValueOnce(json({ count: MAX_UNITS_PER_SNI + 1 }));
    await expect(fetchLegalUnitsBySni("69201")).rejects.toThrow(/smalare SNI-kod/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("en trasig rad eller sida ger ett fel som inte bär registervärden", async () => {
    fetchMock.mockResolvedValueOnce(json({ count: 1 })).mockResolvedValueOnce(json(page([je({ orgNr: "hemligt-värde" })], false)));
    const error = await fetchLegalUnitsBySni("69201").catch((e) => e);
    expect(error).toBeInstanceOf(RegistryTransportError);
    expect(error.message).toContain("orgNr");
    expect(error.message).not.toContain("hemligt-värde");
    expect(error.cause).toBeUndefined();
    expect(isPlaceholderError(error)).toBe(false);

    resetScbState();
    fetchMock.mockResolvedValueOnce(json({ count: 1 })).mockResolvedValueOnce(json({ companies: [] }));
    await expect(fetchLegalUnitsBySni("69201")).rejects.toThrow(/jes eller pagination/);
  });

  it("en paginering som inte går framåt ger ett fel i stället för en evig loop", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ count: 2 }))
      .mockResolvedValueOnce(json(page([je()], true, 5)))
      .mockResolvedValueOnce(json(page([je()], true, 5)));
    await expect(fetchLegalUnitsBySni("69201")).rejects.toThrow(/nästa sida/);
  });

  it("problem+json-fel ger bara statuskoden, aldrig detail eller instance", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ type: "x", title: "Bad", status: 400, detail: "hemlig detalj", instance: "/req/123" }, 400),
    );
    const error = await fetchLegalUnitsBySni("69201").catch((e) => e);
    expect(error).toBeInstanceOf(RegistryTransportError);
    expect(error.message).toBe("SCB (antal): HTTP 400.");
  });

  it("429 med kort Retry-After får en ny chans", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ title: "Too many" }, 429, { "Retry-After": "0" }))
      .mockResolvedValueOnce(json({ count: 1 }))
      .mockResolvedValueOnce(json(page([je()], false)));
    const { units } = await fetchLegalUnitsBySni("69201");
    expect(units).toHaveLength(1);
  });

  it("ett för stort svar och ogiltig JSON avvisas", async () => {
    fetchMock.mockResolvedValueOnce(new Response("x".repeat(1_500_001), { status: 200 }));
    await expect(fetchLegalUnitsBySni("69201")).rejects.toThrow(/orimligt stort/);
    resetScbState();
    fetchMock.mockResolvedValueOnce(new Response("inte json", { status: 200 }));
    await expect(fetchLegalUnitsBySni("69201")).rejects.toThrow(/giltig JSON/);
  });

  it("nyckel och bas-URL krävs, och bas-URL:en måste vara https mot apiafr.scb.se", async () => {
    delete process.env.SCB_AFR_API_KEY;
    await expect(fetchLegalUnitsBySni("69201")).rejects.toThrow(/SCB_AFR_API_KEY/);
    process.env.SCB_AFR_API_KEY = "k";
    for (const bad of [
      "http://apiafr.scb.se",
      "https://evil.example",
      "https://apiafr.scb.se.evil.example",
      "https://user:pw@apiafr.scb.se",
      "https://apiafr.scb.se:8443",
      "https://apiafr.scb.se/v1",
    ]) {
      process.env.SCB_AFR_API_BASE_URL = bad;
      await expect(fetchLegalUnitsBySni("69201")).rejects.toBeInstanceOf(RegistryTransportError);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ett nätverksfel blir ett RegistryTransportError", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(fetchLegalUnitsBySni("69201")).rejects.toThrow(/nätverk eller timeout/);
  });
});
