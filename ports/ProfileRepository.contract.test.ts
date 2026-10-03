import { afterEach, beforeEach, expect, vi } from "vitest";
import type { ProfileRepository } from "./ProfileRepository";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { describeContract, contractIt } from "./testContract";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";
import { onboardingRpcFake } from "@/test/stubs/onboardingRpcFake";
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
  }, onboardingRpcFake("contract-test-user"));
});

const ENTRIES = ["noIdea", "hasIdea"] as const;

function withActiveProject() {
  (fake.current as { tables: Record<string, unknown[]> }).tables.projects = [
    { user_id: "contract-test-user", is_active: true },
  ];
}

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
        // Ingång B har alltid ett aktivt projekt före profilsamtalet
        // (/start/ide). Plattformen härleder ingången ur det.
        if (entry === "hasIdea") withActiveProject();
        const script = await profile.getOnboardingScript(entry, "sv");
        await profile.completeOnboarding({
          entry,
          // Ett val besvaras med sitt id (spec v4), fritext med text.
          answers: script.questions.map((q) => ({ questionId: q.id, answer: q.choices?.[0]?.id ?? "Ett svar." })),
        });
        expect(await profile.getOnboardingStatus()).toEqual({ entry, completed: true });
      });

      contractIt(`getOnboardingScript (${entry}): en valfråga har val med unika id:n och etiketter`, async () => {
        const script = await profile.getOnboardingScript(entry, "sv");
        for (const question of script.questions.filter((q) => q.kind === "choice")) {
          expect(question.choices?.length).toBeGreaterThan(1);
          expect(new Set(question.choices!.map((c) => c.id)).size).toBe(question.choices!.length);
          for (const choice of question.choices!) expect(choice.label).toBeTruthy();
        }
      });
    }

    contractIt("saveOnboardingAnswer (valfri) sparar ett svar som getOnboardingAnswers sedan ger", async () => {
      if (!profile.saveOnboardingAnswer || !profile.getOnboardingAnswers) return;
      const [question] = (await profile.getOnboardingScript("noIdea", "sv")).questions;
      const answer = question.choices?.[0]?.id ?? "Ett svar.";
      await profile.saveOnboardingAnswer({ questionId: question.id, answer });
      expect(await profile.getOnboardingAnswers()).toMatchObject({ [question.id]: answer });
    });
  },
);
