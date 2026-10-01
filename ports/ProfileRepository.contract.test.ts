import { afterEach, expect, vi } from "vitest";
import type { ProfileRepository } from "./ProfileRepository";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { describeContract, contractIt } from "./testContract";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";
import { useDemoStore } from "@/adapters/demo/demoStore";

// getProfile() är klar (docs/moduler/profil.md) — kontraktet prövas nu på
// riktigt mot liveadaptern också, Supabase mockad bort så CI inte behöver
// nätverk (samma mönster som ports/LegalAdvisor.contract.test.ts mockar
// Gemini). getOnboardingScript är fortfarande en medveten stub, se
// ports/stubStatus.test.ts's PARTIELLA_STUBBAR. Samma gäller
// getOnboardingStatus/completeOnboarding tills PR 2 av onboardingen —
// contractIt skippar dem mot live så länge.
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: async () => ({
    supabase: makeSupabaseFake({
      profiles: [{ user_id: "contract-test-user", name: "Testanvändare", initials: "TA" }],
    }),
    userId: "contract-test-user",
  }),
}));

const ENTRIES = ["noIdea", "hasIdea"] as const;

// Demoadaptern skriver onboardingstatusen till demoStore.
afterEach(() => {
  useDemoStore.getState().reset();
});

describeContract<ProfileRepository>(
  "ProfileRepository",
  { demo: demoProfileRepository, live: liveProfileRepository },
  (profile) => {
    contractIt("getProfile returnerar namn och initialer", async () => {
      const result = await profile.getProfile();
      expect(result.name).toBeTruthy();
      expect(result.initials).toBeTruthy();
    });

    for (const entry of ENTRIES) {
      contractIt(`getOnboardingScript (${entry}) har minst en fråga, unika id:n och en avslutande replik`, async () => {
        const script = await profile.getOnboardingScript(entry, "sv");
        expect(script.questions.length).toBeGreaterThan(0);
        expect(new Set(script.questions.map((q) => q.id)).size).toBe(script.questions.length);
        for (const question of script.questions) expect(question.cofounderText).toBeTruthy();
        expect(script.closingMessage).toBeTruthy();
      });

      contractIt(`completeOnboarding (${entry}) med svar på samtalets frågor markerar onboardingen klar`, async () => {
        const script = await profile.getOnboardingScript(entry, "sv");
        await profile.completeOnboarding({
          entry,
          answers: script.questions.map((q) => ({ questionId: q.id, answer: "Ett svar." })),
        });
        expect(await profile.getOnboardingStatus()).toEqual({ entry, completed: true });
      });
    }
  },
);
