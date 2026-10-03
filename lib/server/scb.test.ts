import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isPlaceholderError, RegistryInputError, RegistryTransportError } from "@/core/errors";
import {
  fetchCompanies,
  fetchCompanyCount,
  fetchIndustryName,
  fromAfrSni,
  resetScbStateForTests,
  searchIndustries,
  toAfrSni,
} from "./scb";

const saved = { ...process.env };
const fetchMock = vi.fn();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const codeTable = [
  { kod: "43210", klartext: "Elinstallationer", avdelningKod: "F", avdelningText: "Byggverksamhet" },
  { kod: "69201", klartext: "Redovisning och bokföring; skatterådgivning", avdelningKod: "N", avdelningText: "" },
  { kod: "96021", klartext: "Hårvård", avdelningKod: "S", avdelningText: "" },
  { kod: 62100, klartext: "Dataprogrammering", avdelningKod: "J", avdelningText: "" },
];

beforeEach(() => {
  process.env.SCB_AFR_API_KEY = "test-nyckel";
  delete process.env.SCB_AFR_API_BASE_URL;
  resetScbStateForTests();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  process.env = { ...saved };
  vi.unstubAllGlobals();
});

describe("SNI-formen", () => {
  it("appens form blir AFR:s fem siffror och tillbaka", () => {
    expect(toAfrSni("69.201")).toBe("69201");
    expect(toAfrSni("69201")).toBe("69201");
    expect(fromAfrSni("69201")).toBe("69.201");
  });

  it("nekar allt annat, innan något anrop", () => {
    for (const bad of ["6920", "69.2011", "69201; drop", "../x", ""]) {
      expect(() => toAfrSni(bad)).toThrow(RegistryInputError);
    }
  });
});

describe("fetchCompanyCount", () => {
  it("anropar /count för branschen med nyckeln i X-API-Key och returnerar antalet", async () => {
    fetchMock.mockResolvedValue(json({ count: 25791, path: "/v1/juridiskaenheter/naringsgren/69201/count" }));
    await expect(fetchCompanyCount("69.201")).resolves.toBe(25791);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://apiafr.scb.se/v1/juridiskaenheter/naringsgren/69201/count");
    expect((init.headers as Record<string, string>)["X-API-Key"]).toBe("test-nyckel");
  });

  it("en okänd bransch (404) ger 0, aldrig ett fel", async () => {
    fetchMock.mockResolvedValue(json({ title: "Not Found" }, 404));
    await expect(fetchCompanyCount("99.999")).resolves.toBe(0);
  });

  it("fel från SCB blir våra egna texter, utan SCB:s detail", async () => {
    fetchMock.mockResolvedValue(json({ title: "x", detail: "hemlig intern text" }, 503));
    const error = await fetchCompanyCount("69.201").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(RegistryTransportError);
    expect((error as Error).message).toMatch(/uppdateras/);
    expect((error as Error).message).not.toMatch(/hemlig/);
  });

  it("ett svar i fel form avvisas", async () => {
    fetchMock.mockResolvedValue(json({ count: "många" }));
    await expect(fetchCompanyCount("69.201")).rejects.toBeInstanceOf(RegistryTransportError);
  });

  it("utan nyckel görs inget anrop", async () => {
    delete process.env.SCB_AFR_API_KEY;
    await expect(fetchCompanyCount("69.201")).rejects.toBeInstanceOf(RegistryTransportError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bas-URL:en måste vara exakt https://apiafr.scb.se", async () => {
    for (const bad of ["http://apiafr.scb.se", "https://evil.example", "https://apiafr.scb.se.evil.example", "https://apiafr.scb.se/v1"]) {
      process.env.SCB_AFR_API_BASE_URL = bad;
      await expect(fetchCompanyCount("69.201")).rejects.toBeInstanceOf(RegistryTransportError);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("branscherna ur kodtabellen", () => {
  it("söker på alla ord i namnet, oavsett skiftläge", async () => {
    fetchMock.mockResolvedValue(json(codeTable));
    expect(await searchIndustries("ELINSTALL")).toEqual([{ code: "43210", name: "Elinstallationer" }]);
    expect(await searchIndustries("redovisning skatt")).toEqual([{ code: "69201", name: "Redovisning och bokföring; skatterådgivning" }]);
  });

  it("siffror söker på kodens början; koder som tal tas emot", async () => {
    fetchMock.mockResolvedValue(json({ naringsgrenkoder: codeTable }));
    expect((await searchIndustries("62")).map((hit) => hit.code)).toEqual(["62100"]);
  });

  it("hämtar kodtabellen en gång och svarar sedan ur minnet", async () => {
    fetchMock.mockResolvedValue(json(codeTable));
    await searchIndustries("hår");
    await fetchIndustryName("96.021");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await fetchIndustryName("96.021")).toBe("Hårvård");
    expect(await fetchIndustryName("11.111")).toBeNull();
  });

  it("för kort sökning ger inga träffar och inget anrop", async () => {
    expect(await searchIndustries(" e ")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("fetchCompanies", () => {
  it("hela bolagslistan är inte byggd: ett platshållarfel, aldrig en tom lista, och inget anrop", async () => {
    const error = await fetchCompanies({ sniCode: "69.201" }).catch((caught: unknown) => caught);
    expect(isPlaceholderError(error)).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
