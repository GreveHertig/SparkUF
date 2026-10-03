// Fejkad complete_onboarding för adapter- och kontraktstester utan Postgres.
// Samma regler som funktionen i
// supabase/migrations/20261002150000_steg1_onboarding.sql, som prövas mot
// Postgres i supabase/migrations/onboardingWrite.pg.test.ts. Testkod.
import { PROFILE_QUESTIONS_BY_ENTRY, isOnboardingEntry, isValidProfileAnswer, type ProfileQuestionId } from "@/core/onboarding";
import type { FakeRpcHandlers, FakeTables } from "./supabaseFake";

const COLUMN: Record<ProfileQuestionId, string> = {
  role: "role",
  bio: "bio",
  frustrations: "frustrations",
  customer: "customer_guess",
  time: "time_available",
  money: "money_available",
  risk: "risk_appetite",
};

function fail(message: string, code: string): never {
  throw Object.assign(new Error(message), { code });
}

export function onboardingRpcFake(userId: string): FakeRpcHandlers {
  return {
    complete_onboarding(args: Record<string, unknown>, store: FakeTables) {
      const entry = args.p_entry;
      const answers = args.p_answers as Record<string, unknown> | null;
      if (!isOnboardingEntry(entry)) fail("Okänd ingång.", "22023");
      const questions = PROFILE_QUESTIONS_BY_ENTRY[entry];
      const keys = Object.keys(answers ?? {}).sort();
      if (keys.join() !== [...questions].sort().join()) fail("Svaren ska vara exakt ingångens frågor.", "22023");
      for (const id of questions) {
        const answer = answers![id];
        if (typeof answer !== "string" || !isValidProfileAnswer(answer)) fail(`Svaret på ${id} är fel.`, "22023");
      }
      const row = (store.profiles ?? []).find((profile) => profile.user_id === userId);
      if (!row) fail("Profilraden saknas.", "P0002");
      if (row.onboarding_completed_at != null) fail("Onboardingen är redan klar.", "55000");
      for (const id of questions) row[COLUMN[id]] = (answers![id] as string).trim();
      row.onboarding_entry = entry;
      row.onboarding_completed_at = new Date().toISOString();
      return row.onboarding_completed_at;
    },
  };
}
