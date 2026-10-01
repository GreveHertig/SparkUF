import type {
  JourneyRepository,
  JourneyStepDetail,
  JourneyStepView,
  JourneySummary,
} from "@/ports/JourneyRepository";
import type { Locale } from "@/i18n/context";
import type { OnboardingEntry } from "@/core/domain";
import { deriveCurrentStepNumber, deriveStepStatus, JOURNEY_STEP_META } from "@/core/journey";
import { requireSupabaseUser } from "@/lib/server/session";
import { getActiveProjectId } from "@/lib/server/activeProject";
import { readOnboardingStatus } from "@/lib/server/onboardingStatus";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fill } from "@/i18n/fill";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";

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

/** Steg 2 heter olika per ingång (beslut 2026-09-30): ingång B genomlyser
 * sin egen idé, ingång A letar möjligheter. Innan onboardingen är klar finns
 * ingen ingång, och då gäller Möjligheter. */
function journeyStepText(
  stepNumber: number,
  locale: Locale,
  entry: OnboardingEntry | null,
): { title: string; oneLiner: string } {
  const steps = dictionaries[locale].journeySteps;
  if (stepNumber === 2 && entry === "hasIdea") return steps.step2Idea;
  return steps[STEP_TEXT_KEYS[stepNumber - 1]];
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

/** Allt som avgör var användaren står: aktivt projekt, onboardingen och
 * aktuellt steg. Steg 1 är klart enligt profilen, resten enligt journey_steps. */
async function readProgress(supabase: SupabaseClient, userId: string) {
  const [projectId, onboarding] = await Promise.all([
    getActiveProjectId(supabase, userId),
    readOnboardingStatus(supabase, userId),
  ]);
  const completed = projectId ? await getCompletedStepNumbers(supabase, userId, projectId) : [];
  return {
    projectId,
    entry: onboarding.entry,
    currentStepNumber: deriveCurrentStepNumber(completed, onboarding.completed),
  };
}

export const liveJourneyRepository: JourneyRepository = {
  async getSteps(locale: Locale): Promise<JourneyStepView[]> {
    const { supabase, userId } = await requireSupabaseUser();
    const { entry, currentStepNumber } = await readProgress(supabase, userId);

    return JOURNEY_STEP_META.map((meta) => {
      const text = journeyStepText(meta.stepNumber, locale, entry);
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
    const { projectId, entry, currentStepNumber } = await readProgress(supabase, userId);
    const text = journeyStepText(stepNumber, locale, entry);

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
      // Djup-momenten (poängförklaring, upplåsning, domen, simulering) är
      // demo-specifikt innehåll byggt i den här sessionen (uppdrag 9.1) —
      // plattformen får samma fält när Resan-modulen byggs vidare, se
      // docs/moduler/resan.md. Plattformen har än så länge bara ett läge per
      // steg (inget före/körning/efter-flöde), så momentKind är alltid "after".
      momentKind: "after",
      scoreDelta: null,
      newlyUnlockedParts: [],
      verdict: null,
      simulation: null,
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

  // Handlingskortet på Hem: det aktuella steget, med stegets egen text ur
  // journey_steps när den finns och annars stegets ingress ur i18n.
  // Tidsåtgång finns ingen källa för, så den är tom och döljs av skärmen.
  // "Sedan sist" kräver Utskick och svar (inte byggd, och "opened" är en
  // olöst GDPR-fråga i docs/moduler/utskick-och-svar.md) och är null tills dess.
  async getHomeSummary(locale: Locale): Promise<JourneySummary> {
    const { supabase, userId } = await requireSupabaseUser();
    const { projectId, entry, currentStepNumber } = await readProgress(supabase, userId);
    const meta = JOURNEY_STEP_META[currentStepNumber - 1];
    const text = journeyStepText(currentStepNumber, locale, entry);
    const row = projectId ? await getJourneyStepRow(supabase, userId, projectId, currentStepNumber) : null;
    const copy = dictionaries[locale].journeyPage;
    const step = String(currentStepNumber).padStart(2, "0");

    return {
      todayIso: new Date().toISOString().slice(0, 10),
      nextStep: {
        eyebrow: fill(copy.nextStepEyebrowTemplate, { step, title: text.title.toLocaleUpperCase(locale) }),
        title: text.title,
        why: row?.why || text.oneLiner,
        maxPoints: meta.maxPoints,
        estimatedTime: "",
        doneItems: row?.done_items ?? [],
        actionLabel: row?.action_label || fill(copy.openStepTemplate, { step }),
      },
      sinceLastTime: null,
    };
  },
};
