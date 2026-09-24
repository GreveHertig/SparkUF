import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegistryInputError, RegistryLockedError, RegistryTransportError, isPlaceholderError } from "@/core/errors";

const assertAllowed = vi.fn();
vi.mock("@/lib/server/registryAccess", () => ({ assertRegistryAccessAllowed: () => assertAllowed() }));

import {
  BOLAGSVERKET_TOKEN_URL,
  fetchDocumentList,
  lookupOrganisation,
  resetBolagsverketState,
} from "./bolagsverket";

const BASE = "https://gw.api.bolagsverket.se/vardefulla-datamangder/v1";
const ERICSSON = "5560160680";

/** Ericssons svar från steg A 2026-09-23 (docs/dataspiken.md), beskrivningen avkortad. */
function ericsson(over: Record<string, unknown> = {}) {
  return {
    avregistreradOrganisation: null,
    avregistreringsorsak: null,
    juridiskForm: { kod: "49", klartext: "Övriga aktiebolag", dataproducent: "SCB", fel: null },
    namnskyddslopnummer: null,
    naringsgrenOrganisation: {
      sni: [
        { kod: "70100", klartext: "Verksamheter som utövas av huvudkontor" },
        { kod: "62201", klartext: "Datakonsultverksamhet" },
        { kod: "     ", klartext: "" },
        { kod: "     ", klartext: "" },
        { kod: "     ", klartext: "" },
      ],
      dataproducent: "SCB",
      fel: null,
    },
    organisationsdatum: { registreringsdatum: "1918-08-19", dataproducent: "Bolagsverket", fel: null, infortHosScb: "1972-01-01" },
    organisationsform: { kod: "AB", klartext: "Aktiebolag", dataproducent: "Bolagsverket", fel: null },
    organisationsidentitet: { identitetsbeteckning: ERICSSON, typ: { kod: "ORGNR", klartext: "Organisationsnummer" } },
    organisationsnamn: {
      dataproducent: "Bolagsverket",
      fel: null,
      organisationsnamnLista: [
        {
          namn: "Telefonaktiebolaget LM Ericsson",
          organisationsnamntyp: { kod: "FORETAGSNAMN", klartext: "Företagsnamn" },
          registreringsdatum: "2015-11-19",
          verksamhetsbeskrivningSarskiltForetagsnamn: null,
        },
      ],
    },
    pagaendeAvvecklingsEllerOmstruktureringsforfarande: null,
    postadressOrganisation: {
      postadress: { postnummer: "16483", coAdress: null, land: null, postort: "STOCKHOLM", utdelningsadress: null },
      dataproducent: "Bolagsverket",
      fel: null,
    },
    registreringsland: { kod: "SE-LAND", klartext: "Sverige" },
    reklamsparr: null,
    verksamOrganisation: { kod: "JA", dataproducent: "SCB", fel: null },
    verksamhetsbeskrivning: {
      beskrivning: "Bolaget har till föremål för sin verksamhet att utveckla telekommunikation.",
      dataproducent: "Bolagsverket",
      fel: null,
    },
    ...over,
  };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const tokenReply = (token = "tok-1", expires_in = 3600) =>
  json({ access_token: token, scope: "vardefulla-datamangder:read", token_type: "Bearer", expires_in });

const fetchMock = vi.fn();
const saved = { ...process.env };

beforeEach(() => {
  vi.resetAllMocks();
  resetBolagsverketState();
  assertAllowed.mockResolvedValue(undefined);
  vi.stubGlobal("fetch", fetchMock);
  process.env.BOLAGSVERKET_CLIENT_ID = "test-id";
  process.env.BOLAGSVERKET_CLIENT_SECRET = "test-secret";
  process.env.BOLAGSVERKET_API_BASE_URL = BASE;
});
afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...saved };
});

describe("grind och indata", () => {
  it("nekad grind => RegistryLockedError och inga nätverksanrop", async () => {
    assertAllowed.mockRejectedValue(new RegistryLockedError());
    await expect(lookupOrganisation(ERICSSON)).rejects.toBeInstanceOf(RegistryLockedError);
    await expect(fetchDocumentList(ERICSSON)).rejects.toBeInstanceOf(RegistryLockedError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("grinden kontrolleras före indatavalideringen", async () => {
    assertAllowed.mockRejectedValue(new RegistryLockedError());
    await expect(lookupOrganisation("abc")).rejects.toBeInstanceOf(RegistryLockedError);
  });

  it.each([
    ["fel form", "abc"],
    ["bindestreck", "556016-0680"],
    ["kontrollsiffra (samma som API:et nekade i steg A)", "5599999999"],
    ["personnummer (tredje siffran < 2)", "8001011234"],
  ])("avvisar org.nr med %s före nätverksanrop", async (_label, orgNr) => {
    await expect(lookupOrganisation(orgNr)).rejects.toBeInstanceOf(RegistryInputError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("konfiguration", () => {
  it("saknade nycklar => RegistryTransportError som nämner variabeln, utan nätverksanrop", async () => {
    delete process.env.BOLAGSVERKET_CLIENT_SECRET;
    await expect(lookupOrganisation(ERICSSON)).rejects.toThrow(/BOLAGSVERKET_CLIENT_SECRET/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    "http://gw.api.bolagsverket.se/v1",
    "https://evil.example/v1",
    "https://gw.api.bolagsverket.se.evil.example/v1",
    "https://user:pw@gw.api.bolagsverket.se/v1",
    "https://gw.api.bolagsverket.se:8443/v1",
    "https://gw.api.bolagsverket.se/v1?x=1",
    "inte en url",
  ])("nekar bas-URL:en %s (SSRF)", async (url) => {
    process.env.BOLAGSVERKET_API_BASE_URL = url;
    const err = await lookupOrganisation(ERICSSON).catch((e) => e);
    expect(err).toBeInstanceOf(RegistryTransportError);
    expect(isPlaceholderError(err)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("lookupOrganisation", () => {
  it("hämtar token med client credentials och anropar /organisationer med bearer", async () => {
    fetchMock.mockResolvedValueOnce(tokenReply()).mockResolvedValueOnce(json({ organisationer: [ericsson()] }));
    await lookupOrganisation(ERICSSON);

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0];
    expect(tokenUrl).toBe(BOLAGSVERKET_TOKEN_URL);
    const form = new URLSearchParams(tokenInit.body);
    expect(form.get("grant_type")).toBe("client_credentials");
    expect(form.get("scope")).toBe("vardefulla-datamangder:read");

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(`${BASE}/organisationer`);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok-1");
    expect(JSON.parse(init.body)).toEqual({ identitetsbeteckning: ERICSSON });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("mappar det verifierade svaret till en platt form", async () => {
    fetchMock.mockResolvedValueOnce(tokenReply()).mockResolvedValueOnce(json({ organisationer: [ericsson()] }));
    const [org] = await lookupOrganisation(ERICSSON);
    expect(org).toEqual({
      orgNr: ERICSSON,
      name: "Telefonaktiebolaget LM Ericsson",
      legalForm: "AB",
      sniCodes: ["70100", "62201"],
      active: true,
      deregistered: false,
      inLiquidationOrRestructuring: false,
      advertisingBlock: null,
      postalCode: "16483",
      postTown: "STOCKHOLM",
      description: "Bolaget har till föremål för sin verksamhet att utveckla telekommunikation.",
      fetchedAt: new Date().toISOString().slice(0, 10),
    });
  });

  it("reklamspärr: null är okänt, en ifylld spärr i okänd form räknas som spärr", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenReply())
      .mockResolvedValueOnce(json({ organisationer: [ericsson({ reklamsparr: { kod: "JA" } })] }))
      .mockResolvedValueOnce(json({ organisationer: [ericsson({ reklamsparr: { kod: "NEJ" } })] }))
      .mockResolvedValueOnce(json({ organisationer: [ericsson({ reklamsparr: "något nytt" })] }));
    expect((await lookupOrganisation(ERICSSON))[0].advertisingBlock).toBe(true);
    expect((await lookupOrganisation(ERICSSON))[0].advertisingBlock).toBe(false);
    expect((await lookupOrganisation(ERICSSON))[0].advertisingBlock).toBe(true);
  });

  it("ifyllt fel, avregistrering och avveckling syns, och okända fält släpps inte igenom", async () => {
    fetchMock.mockResolvedValueOnce(tokenReply()).mockResolvedValueOnce(
      json({
        organisationer: [
          ericsson({
            organisationsnamn: { fel: { kod: "X" }, organisationsnamnLista: [{ namn: "Fel namn" }] },
            verksamOrganisation: { kod: "NEJ", fel: null },
            avregistreradOrganisation: { datum: "2020-01-01" },
            pagaendeAvvecklingsEllerOmstruktureringsforfarande: [{ kod: "LI" }],
            hemligtNyttFalt: "x",
          }),
        ],
      }),
    );
    const [org] = await lookupOrganisation(ERICSSON);
    expect(org.name).toBeNull();
    expect(org.active).toBe(false);
    expect(org.deregistered).toBe(true);
    expect(org.inLiquidationOrRestructuring).toBe(true);
    expect(org).not.toHaveProperty("hemligtNyttFalt");
  });

  it("tom lista, 404 och svar för ett annat org.nr ger []", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenReply())
      .mockResolvedValueOnce(json({ organisationer: [] }))
      .mockResolvedValueOnce(json({ status: 404 }, 404))
      .mockResolvedValueOnce(
        json({ organisationer: [ericsson({ organisationsidentitet: { identitetsbeteckning: "5560125790" } })] }),
      );
    expect(await lookupOrganisation(ERICSSON)).toEqual([]);
    expect(await lookupOrganisation(ERICSSON)).toEqual([]);
    expect(await lookupOrganisation(ERICSSON)).toEqual([]);
  });

  it("återanvänder token tills den går ut", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenReply())
      .mockResolvedValueOnce(json({ organisationer: [ericsson()] }))
      .mockResolvedValueOnce(json({ organisationer: [ericsson()] }));
    await lookupOrganisation(ERICSSON);
    await lookupOrganisation(ERICSSON);
    expect(fetchMock.mock.calls.filter(([u]) => u === BOLAGSVERKET_TOKEN_URL)).toHaveLength(1);
  });

  it("vid 401 hämtas en ny token och anropet görs om exakt en gång", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenReply("gammal"))
      .mockResolvedValueOnce(json({ code: "900902" }, 401))
      .mockResolvedValueOnce(tokenReply("ny"))
      .mockResolvedValueOnce(json({ organisationer: [ericsson()] }));
    const orgs = await lookupOrganisation(ERICSSON);
    expect(orgs).toHaveLength(1);
    expect(fetchMock.mock.calls[3][1].headers.Authorization).toBe("Bearer ny");

    fetchMock
      .mockResolvedValueOnce(json({ code: "900902" }, 401))
      .mockResolvedValueOnce(tokenReply("tredje"))
      .mockResolvedValueOnce(json({ code: "900902" }, 401));
    await expect(lookupOrganisation(ERICSSON)).rejects.toThrow(/HTTP 401/);
  });

  it("felsvar blir RegistryTransportError utan request-id, detail eller cause", async () => {
    const problem = {
      type: "about:blank",
      instance: "client.error",
      status: 400,
      title: "Bad Request",
      detail: "Identitetsbeteckning har ogiltig kontrollsiffra.",
      requestId: "hemligt-request-id",
      timestamp: null,
    };
    fetchMock.mockResolvedValueOnce(tokenReply()).mockResolvedValueOnce(json(problem, 400));
    const err = await lookupOrganisation(ERICSSON).catch((e) => e);
    expect(err).toBeInstanceOf(RegistryTransportError);
    expect(isPlaceholderError(err)).toBe(false);
    expect(err.message).toMatch(/HTTP 400/);
    expect(err.message).not.toMatch(/hemligt-request-id|kontrollsiffra/);
    expect(err.cause).toBeUndefined();
  });

  it("nätverksfel, ogiltig JSON och oväntad form blir RegistryTransportError", async () => {
    fetchMock.mockResolvedValueOnce(tokenReply()).mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(lookupOrganisation(ERICSSON)).rejects.toThrow(/nätverk eller timeout/);

    fetchMock.mockResolvedValueOnce(new Response("<html>", { status: 200 }));
    await expect(lookupOrganisation(ERICSSON)).rejects.toThrow(/giltig JSON/);

    fetchMock.mockResolvedValueOnce(json({ organisationer: [{ namn: "saknar identitet" }] }));
    const err = await lookupOrganisation(ERICSSON).catch((e) => e);
    expect(err).toBeInstanceOf(RegistryTransportError);
    expect(err.cause).toBeUndefined();
  });

  it("token som nekas eller har fel form ger RegistryTransportError utan att hemligheten syns", async () => {
    fetchMock.mockResolvedValueOnce(json({ error: "invalid_client" }, 401));
    const err = await lookupOrganisation(ERICSSON).catch((e) => e);
    expect(err).toBeInstanceOf(RegistryTransportError);
    expect(err.message).toMatch(/token/);
    expect(err.message).not.toMatch(/test-secret/);

    fetchMock.mockResolvedValueOnce(json({ access_token: "x", token_type: "Bearer" }));
    await expect(lookupOrganisation(ERICSSON)).rejects.toThrow(/token.*oväntat svar/);
  });
});

describe("fetchDocumentList", () => {
  it("anropar /dokumentlista och returnerar listan (tom i steg A)", async () => {
    fetchMock.mockResolvedValueOnce(tokenReply()).mockResolvedValueOnce(json({ dokument: [] }));
    expect(await fetchDocumentList(ERICSSON)).toEqual([]);
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(`${BASE}/dokumentlista`);
    expect(JSON.parse(init.body)).toEqual({ identitetsbeteckning: ERICSSON });
  });

  it("oväntad form blir RegistryTransportError", async () => {
    fetchMock.mockResolvedValueOnce(tokenReply()).mockResolvedValueOnce(json({ dokument: "nej" }));
    await expect(fetchDocumentList(ERICSSON)).rejects.toBeInstanceOf(RegistryTransportError);
  });
});
