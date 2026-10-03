import { expect, vi } from "vitest";
import type { VerdictProvider } from "./VerdictProvider";
import { demoVerdictProvider } from "@/adapters/demo/VerdictProvider";
import { liveVerdictProvider } from "@/adapters/live/VerdictProvider";
import { describeContract, contractIt } from "./testContract";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

// Liveadaptern läser samtalsloggen (public.validation_contacts) för det aktiva
// projektet: tre loggade svar, ett kontaktat bolag utan svar.
const USER = "contract-test-user";
const PROJECT = "00000000-0000-4000-8000-0000000000aa";
const row = (i: number, overrides: Record<string, unknown>) => ({
  id: `00000000-0000-4000-8000-00000000000${i}`,
  user_id: USER,
  project_id: PROJECT,
  company_name: `Bolag ${i} AB`,
  size_class: "tenToNineteen",
  channel: "phone",
  status: "responded",
  contacted_on: "2026-09-28",
  responded_on: "2026-09-30",
  problem_stance: "confirms",
  price_stance: "accepts",
  price_tested_kr: 990,
  counter_offer_kr: null,
  quote: "Vi lägger flera timmar i veckan på det här.",
  created_at: `2026-09-27T10:00:0${i}Z`,
  ...overrides,
});
const fake = makeSupabaseFake({
  projects: [{ id: PROJECT, user_id: USER, is_active: true }],
  validation_contacts: [
    row(1, {}),
    row(2, { problem_stance: "rejects", price_stance: "declines", counter_offer_kr: 300 }),
    row(3, { problem_stance: "partial", price_stance: "undecided" }),
    row(4, { status: "contacted", responded_on: null, problem_stance: null, price_stance: null, quote: null }),
  ],
});
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: async () => ({ supabase: fake, userId: USER }),
}));

describeContract<VerdictProvider>(
  "VerdictProvider",
  { demo: demoVerdictProvider, live: liveVerdictProvider },
  (provider) => {
    contractIt("getVerdictInput är null eller ett underlag med svar som bär källa", async () => {
      const input = await provider.getVerdictInput("sv");
      if (input === null) return;
      expect(input.contacted).toBeGreaterThanOrEqual(input.responses.length);
      for (const r of input.responses) {
        expect(r.source.namn).toBeTruthy();
        expect(r.source.hämtad).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    contractIt("getVerdictReport är null eller en dom med text, siffror och citat med källa", async () => {
      const report = await provider.getVerdictReport("sv");
      if (report === null) return;
      expect(["run", "refine", "pivot", "insufficient"]).toContain(report.verdict.decision);
      expect(report.presentation.headline).toBeTruthy();
      expect(report.presentation.reasoning).toBeTruthy();
      for (const q of report.quotes) {
        expect(q.source.namn).toBeTruthy();
        expect(q.quote).toBeTruthy();
      }
      // En pivot ger en Spår-post, annars ingen.
      expect(report.pivotTraceEvent !== null).toBe(report.verdict.decision === "pivot");
    });

    contractIt("getVerdictReport svarar på båda språken utan att kasta", async () => {
      await provider.getVerdictReport("sv");
      await provider.getVerdictReport("en");
    });

    contractIt("rapporten innehåller inga poängfält", async () => {
      const report = await provider.getVerdictReport("sv");
      if (report === null) return;
      expect(JSON.stringify(report)).not.toMatch(/"(score|points|poäng|delta)"/i);
    });
  },
);
