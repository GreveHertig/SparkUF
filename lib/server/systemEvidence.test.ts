// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

const fake = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => fake.client }));

import { recordSystemEvidence, validateSystemEvidenceWrite, type SystemEvidenceWrite } from "./systemEvidence";

const USER = "00000000-0000-4000-8000-00000000000a";
const PROJECT = "00000000-0000-4000-8000-0000000000a1";

const write = (over: Partial<SystemEvidenceWrite> = {}): SystemEvidenceWrite => ({
  userId: USER,
  projectId: PROJECT,
  kind: "registerMarketCount",
  subjectRef: "sni:69201:antal",
  sourceName: "SCB:s företagsregister och Bolagsverket",
  sourceUrl: null,
  fetchedAt: "2026-10-04",
  quote: "812 verksamma aktiebolag med SNI 69.201 som huvudbransch",
  stepNumber: 3,
  ...over,
});

type Row = Record<string, unknown>;

/** En fejkad klient med `rows` i evidence. `peek` visar tabellen som den är nu. */
function useRows(rows: Row[] = []) {
  const client = makeSupabaseFake({ evidence: rows }, { peek: (_args, store) => store.evidence }, { generatedIds: ["evidence"] });
  fake.client = client;
  return async () => (await client.rpc("peek")).data as Row[];
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
});

afterEach(() => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe("validateSystemEvidenceWrite", () => {
  it("godtar bara systemets registersorter", () => {
    expect(() => validateSystemEvidenceWrite(write())).not.toThrow();
    expect(() => validateSystemEvidenceWrite(write({ kind: "registerCompetitorSet" }))).not.toThrow();
    for (const kind of ["customerProblemConfirmed", "profileFitAnswer", "payingCustomer"] as const) {
      expect(() => validateSystemEvidenceWrite(write({ kind }))).toThrow(/sorten/);
    }
  });

  it("nekar ogiltiga id:n, frågor, källor, länkar, datum, citat och steg", () => {
    expect(() => validateSystemEvidenceWrite(write({ userId: "x" }))).toThrow();
    expect(() => validateSystemEvidenceWrite(write({ subjectRef: "sni 69201" }))).toThrow();
    expect(() => validateSystemEvidenceWrite(write({ sourceName: "spark:profile" }))).toThrow();
    expect(() => validateSystemEvidenceWrite(write({ sourceUrl: "javascript:alert(1)" }))).toThrow();
    expect(() => validateSystemEvidenceWrite(write({ fetchedAt: "4 okt" }))).toThrow();
    expect(() => validateSystemEvidenceWrite(write({ quote: " " }))).toThrow();
    expect(() => validateSystemEvidenceWrite(write({ stepNumber: 13 }))).toThrow();
  });
});

describe("recordSystemEvidence", () => {
  it("sparar som system, och samma fråga samma dag är en dubblett", async () => {
    const peek = useRows();
    expect(await recordSystemEvidence(write())).toBe("recorded");
    const rows = await peek();
    expect(rows[0]).toMatchObject({
      user_id: USER,
      project_id: PROJECT,
      kind: "registerMarketCount",
      entered_by: "system",
      module: "Registret",
      step_number: 3,
    });
    rows[0].retracted_at = null;
    expect(await recordSystemEvidence(write())).toBe("duplicate");
    expect(await peek()).toHaveLength(1);
  });

  it("en nyare hämtning återkallar den gamla med en anledning och sparar den nya", async () => {
    const peek = useRows([{
      id: "00000000-0000-4000-8000-000000000001",
      user_id: USER,
      project_id: PROJECT,
      kind: "registerMarketCount",
      subject_ref: "sni:69201:antal",
      fetched_at: "2026-09-01",
      retracted_at: null,
    }]);
    expect(await recordSystemEvidence(write())).toBe("replaced");
    const rows = await peek();
    expect(rows[0].retracted_at).toBeTruthy();
    expect(rows[0].retracted_reason).toMatch(/nyare hämtning/);
    expect(rows).toHaveLength(2);
  });

  it("utan service role-nyckel skrivs ingenting", async () => {
    const peek = useRows();
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    await expect(recordSystemEvidence(write())).rejects.toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(await peek()).toEqual([]);
  });
});
