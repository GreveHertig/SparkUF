import { expect, vi } from "vitest";
import type { ProfileRepository } from "./ProfileRepository";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { describeContract, contractIt } from "./testContract";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

// getProfile() är klar (docs/moduler/profil.md) — kontraktet prövas nu på
// riktigt mot liveadaptern också, Supabase mockad bort så CI inte behöver
// nätverk (samma mönster som ports/LegalAdvisor.contract.test.ts mockar
// Gemini). getOnboardingScript är fortfarande en medveten stub, se
// ports/stubStatus.test.ts's PARTIELLA_STUBBAR — inte kontraktstestad än.
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: async () => ({
    supabase: makeSupabaseFake({
      profiles: [{ user_id: "contract-test-user", name: "Testanvändare", initials: "TA" }],
    }),
    userId: "contract-test-user",
  }),
}));

describeContract<ProfileRepository>(
  "ProfileRepository",
  { demo: demoProfileRepository, live: liveProfileRepository },
  (profile) => {
    contractIt("getProfile returnerar namn och initialer", async () => {
      const result = await profile.getProfile();
      expect(result.name).toBeTruthy();
      expect(result.initials).toBeTruthy();
    });
  },
);
