import type { JourneyRepository, JourneyStepDetail, JourneyStepView } from "@/ports/JourneyRepository";
import type { Locale } from "@/i18n/context";
import { deriveCurrentStepNumber, deriveStepStatus, JOURNEY_STEP_META } from "@/core/journey";
import { NotImplementedError } from "@/core/errors";
import { requireSupabaseUser } from "@/lib/server/session";
import { getActiveProjectId } from "@/lib/server/activeProject";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";

const DOC = "docs/moduler/resan.md";
const dictionaries = { sv, en };

const STEP_TEXT_KEYS = [
  "step1",
  "step2",
  "step3",
  "step4",
  "step5",
  "step6",
  "step7",
  "step8",
  "step9",
  "step10",
  "step11",
  "step12",
] as const;

function journeyStepText(stepNumber: number, locale: Locale): { title: string; oneLiner: string } {
  return dictionaries[locale].journeySteps[STEP_TEXT_KEYS[stepNumber - 1]];
}

async function getCompletedStepNumbers(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<number[]> {
  const { data, error } = await supabase
    .from("journey_steps")
    .select("step_number, completed_at")
    .eq("user_id", userId)
    .eq("project_id", projectId);
  if (error) throw new Error(`Resan: kunde inte läsa framsteget (${error.message}).`);
  return ((data ?? []) as { step_number: number; completed_at: string | null }[])
    .filter((row) => row.completed_at !== null)
    .map((row) => row.step_number);
}

type JourneyStepRow = {
  why: string | null;
  done_items: string[] | null;
  highlights: string[] | null;
  action_label: string | null;
};

async function getJourneyStepRow(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  stepNumber: number,
): Promise<JourneyStepRow | null> {
  const { data, error } = await supabase
    .from("journey_steps")
    .select("why, done_items, highlights, action_label")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("step_number", stepNumber)
    .maybeSingle();
  if (error) throw new Error(`Resan: kunde inte läsa steget (${error.message}).`);
  return data as JourneyStepRow | null;
}

async function currentStepNumberFor(supabase: SupabaseClient, userId: string, projectId: string | null) {
  if (!projectId) return 1;
  return deriveCurrentStepNumber(await getCompletedStepNumbers(supabase, userId, projectId));
}

export const liveJourneyRepository: JourneyRepository = {
  async getSteps(locale: Locale): Promise<JourneyStepView[]> {
    const { supabase, userId } = await requireSupabaseUser();
    const projectId = await getActiveProjectId(supabase, userId);
    const currentStepNumber = await currentStepNumberFor(supabase, userId, projectId);

    return JOURNEY_STEP_META.map((meta) => {
      const text = journeyStepText(meta.stepNumber, locale);
      return {
        stepNumber: meta.stepNumber,
        journeyPhase: meta.journeyPhase,
        title: text.title,
        oneLiner: text.oneLiner,
        maxPoints: meta.maxPoints,
        status: deriveStepStatus(meta.stepNumber, currentStepNumber),
      };
    });
  },

  async getStepDetail(stepNumber: number, locale: Locale): Promise<JourneyStepDetail | null> {
    const meta = JOURNEY_STEP_META.find((step) => step.stepNumber === stepNumber);
    if (!meta) return null;

    const { supabase, userId } = await requireSupabaseUser();
    const projectId = await getActiveProjectId(supabase, userId);
    const currentStepNumber = await currentStepNumberFor(supabase, userId, projectId);
    const text = journeyStepText(stepNumber, locale);

    const base: JourneyStepDetail = {
      stepNumber: meta.stepNumber,
      journeyPhase: meta.journeyPhase,
      title: text.title,
      oneLiner: text.oneLiner,
      maxPoints: meta.maxPoints,
      status: deriveStepStatus(stepNumber, currentStepNumber),
      why: "",
      doneItems: [],
      highlights: [],
      actionLabel: "",
    };
    if (!projectId) return base;

    const row = await getJourneyStepRow(supabase, userId, projectId, stepNumber);
    if (!row) return base;

    return {
      ...base,
      why: row.why ?? "",
      doneItems: row.done_items ?? [],
      highlights: row.highlights ?? [],
      actionLabel: row.action_label ?? "",
    };
  },

  // JourneySummary.sinceLastTime är obligatorisk och kräver riktiga
  // utskicksdata (Utskick och svar-modulen, inte byggd i P1 — och "opened"
  // som mätvärde är en olöst GDPR-fråga, flaggad i
  // docs/moduler/utskick-och-svar.md, som den här sessionen INTE ska
  // föregripa genom att gissa en tolkning). Medvetet kvar som stub tills
  // den modulen finns. Se ports/stubStatus.test.ts's PARTIELLA_STUBBAR.
  async getHomeSummary() {
    throw new NotImplementedError("Resan", DOC);
  },
};
