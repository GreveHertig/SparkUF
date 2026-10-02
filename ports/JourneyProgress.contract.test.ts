import { expect, vi } from "vitest";
import type { JourneyProgress } from "./JourneyProgress";
import { demoJourneyProgress } from "@/adapters/demo/JourneyProgress";
import { liveJourneyProgress } from "@/adapters/live/JourneyProgress";
import { describeContract, contractIt } from "./testContract";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";
import { journeyRpcFake } from "@/test/stubs/journeyRpcFake";

const USER = "00000000-0000-4000-8000-0000000000f1";
const PROJECT = "00000000-0000-4000-8000-0000000000f2";
const TODAY = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());

let fake: ReturnType<typeof makeSupabaseFake> | null = null;
function sharedFake() {
  fake ??= makeSupabaseFake(
    { projects: [{ id: PROJECT, user_id: USER, name: "Testprojekt", one_liner: "En testidé.", is_active: true }] },
    journeyRpcFake(USER, PROJECT, TODAY),
  );
  return fake;
}

vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: async () => ({ supabase: sharedFake(), userId: USER }),
}));
vi.mock("@/lib/server/scoreSnapshots", () => ({ writeScoreSnapshot: vi.fn(async () => undefined) }));

describeContract<JourneyProgress>("JourneyProgress", { demo: demoJourneyProgress, live: liveJourneyProgress }, (progress) => {
  contractIt("getStepCompletion ger en status för varje steg, och saknade krav bara vid 'missing'", async () => {
    for (let step = 1; step <= 12; step += 1) {
      const view = await progress.getStepCompletion(step, "sv");
      expect(view.stepNumber).toBe(step);
      expect(["done", "previousNotDone", "noRequirementYet", "missing", "completable"]).toContain(view.status);
      if (view.status !== "missing") expect(view.missing).toEqual([]);
      else expect(view.missing.length).toBeGreaterThan(0);
    }
  });

  contractIt("completeStep på ett steg som går att markera ger en poäng inom 1–100", async () => {
    for (let step = 1; step <= 12; step += 1) {
      if ((await progress.getStepCompletion(step, "sv")).status !== "completable") continue;
      const result = await progress.completeStep(step, "sv");
      expect(result.snapshot.total).toBeGreaterThanOrEqual(1);
      expect(result.snapshot.total).toBeLessThanOrEqual(100);
      return;
    }
  });

  contractIt("ett steg som väntar på föregående steg kan inte markeras klart", async () => {
    const waiting = await progress.getStepCompletion(12, "sv");
    expect(waiting.status).not.toBe("completable");
  });
});
