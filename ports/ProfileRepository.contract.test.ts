import { afterEach, beforeEach, expect, vi } from "vitest";
import type { ProfileRepository } from "./ProfileRepository";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { describeContract, contractIt } from "./testContract";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";
import { useDemoStore } from "@/adapters/demo/demoStore";

// Alla metoder är byggda i båda adaptrarna (docs/moduler/profil.md).
// Supabase mockas bort så CI inte behöver nätverk (samma mönster som
// ports/LegalAdvisor.contract.test.ts mockar Gemini). Fejken skapas om före
// varje test och delas inom testet, så att completeOnboarding och
// getOnboardingStatus ser samma rad.
const fake = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: async () => ({ supabase: fake.current, userId: "contract-test-user" }),
}));

beforeEach(() => {
  fake.current = makeSupabaseFake({
    profiles: [
      {
        user_id: "contract-test-user",
        name: "Testanvändare",
        initials: "TA",
        onboarding_entry: null,
        onboarding_completed_at: null,
      },
    ],
  });
});

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
