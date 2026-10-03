// Fejkade public.save_onboarding_answer och public.complete_onboarding för
// adapter- och kontraktstester utan Postgres. Samma regler som funktionerna i
// supabase/migrations/20261003150000_onboarding_v4.sql, som prövas mot
// Postgres i supabase/migrations/onboardingWrite.pg.test.ts. Testkod.
import {
  ONBOARDING_QUESTIONS_BY_ENTRY,
  isOnboardingEntry,
  isOnboardingQuestionFor,
  isValidOnboardingAnswer,
  isChoiceQuestion,
} from "@/core/onboarding";
import type { OnboardingEntry } from "@/core/domain";
import type { FakeRpcHandlers, FakeTables } from "./supabaseFake";

function fail(message: string, code: string): never {
  throw Object.assign(new Error(message), { code });
}

/** Som public.onboarding_v4_entry: ett aktivt projekt betyder ingång B. */
function derivedEntry(store: FakeTables, userId: string): OnboardingEntry {
  const active = (store.projects ?? []).some((project) => project.user_id === userId && project.is_active !== false);
  return active ? "hasIdea" : "noIdea";
}

/** Som public.onboarding_v4_clean_answer. */
function cleanAnswer(entry: OnboardingEntry, questionId: string, answer: unknown): string {
  if (!isOnboardingQuestionFor(entry, questionId)) fail("Frågan hör inte till ingången.", "22023");
  if (typeof answer !== "string" || !isValidOnboardingAnswer(questionId, answer)) fail(`Svaret på ${questionId} är fel.`, "22023");
  return isChoiceQuestion(questionId) ? answer : answer.trim();
}

export function onboardingRpcFake(userId: string): FakeRpcHandlers {
  function profileRow(store: FakeTables) {
    const row = (store.profiles ?? []).find((profile) => profile.user_id === userId);
    if (!row) fail("Profilraden saknas.", "P0002");
    return row;
  }

  return {
    save_onboarding_answer(args: Record<string, unknown>, store: FakeTables) {
      const row = profileRow(store);
      const completed = row.onboarding_completed_at != null;
      const entry = completed && isOnboardingEntry(row.onboarding_entry) ? row.onboarding_entry : derivedEntry(store, userId);
      const questionId = String(args.p_question);
      const answer = cleanAnswer(entry, questionId, args.p_answer);
      const answers = { ...((row.onboarding_answers as Record<string, string> | undefined) ?? {}) };
      if (completed && questionId in answers) fail("Frågan är redan besvarad.", "55000");
      row.onboarding_answers = { ...answers, [questionId]: answer };
      return null;
    },

    complete_onboarding(args: Record<string, unknown>, store: FakeTables) {
      if (!isOnboardingEntry(args.p_entry)) fail("Okänd ingång.", "22023");
      const row = profileRow(store);
      if (row.onboarding_completed_at != null) fail("Onboardingen är redan klar.", "55000");
      const entry = derivedEntry(store, userId);
      if (args.p_entry !== entry) fail("Ingången stämmer inte.", "22023");
      const given = args.p_answers;
      if (!given || typeof given !== "object" || Array.isArray(given)) fail("Svaren saknas.", "22023");
      const answers = { ...((row.onboarding_answers as Record<string, string> | undefined) ?? {}) };
      for (const [questionId, answer] of Object.entries(given as Record<string, unknown>)) {
        answers[questionId] = cleanAnswer(entry, questionId, answer);
      }
      if (!ONBOARDING_QUESTIONS_BY_ENTRY[entry].core.every((id) => answers[id])) {
        fail("Alla kärnfrågor är inte besvarade.", "22023");
      }
      row.onboarding_answers = answers;
      row.onboarding_entry = entry;
      row.onboarding_version = 2;
      row.onboarding_completed_at = new Date().toISOString();
      return row.onboarding_completed_at;
    },
  };
}
