import type { Locale } from "@/i18n/context";
import type { NextStep, SinceLastTime } from "@/core/domain";

export type JourneySummary = {
  todayIso: string;
  nextStep: NextStep;
  sinceLastTime: SinceLastTime;
};

export type JourneyStepStatus = "done" | "current" | "locked";

/** Uppdrag 6: /app/resan — 12 steg i 4 faser med klar/aktuell/låst. */
export type JourneyStepView = {
  stepNumber: number;
  journeyPhase: "discover" | "tryPhase" | "launch" | "grow";
  title: string;
  oneLiner: string;
  maxPoints: number;
  status: JourneyStepStatus;
};

/** Stegets arbetsyta (/app/resan/[steg]). `why`/`doneItems`/`highlights` är
 * tomma för ett steg som fortfarande är låst — se `status`. */
export type JourneyStepDetail = JourneyStepView & {
  why: string;
  doneItems: string[];
  highlights: string[];
  actionLabel: string;
};

/**
 * Modul: Resan (avsnitt 14.3). Liveadapter bygger på Supabase.
 * `locale` styr vilket språk den fritext som ingår (t.ex. "why") kommer på.
 */
export interface JourneyRepository {
  getHomeSummary(locale: Locale): Promise<JourneySummary>;
  getSteps(locale: Locale): Promise<JourneyStepView[]>;
  getStepDetail(stepNumber: number, locale: Locale): Promise<JourneyStepDetail | null>;
}
