import type { Locale } from "@/i18n/context";
import type { NextStep, SinceLastTime } from "@/core/domain";
import type { Simulation } from "@/ports/SimulationProvider";

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

/** Poängändringen som hör till det senast nådda momentet av ett steg
 * (uppdrag 9.1, "efter": animerad poängändring och förklaring). `null` om
 * steget är låst eller inget ännu hänt. */
export type JourneyStepScoreDelta = {
  total: number;
  delta: number;
  deltaReason: string;
};

/** Domen (steg 06): kör/förfina/pivotera + motivering. `null` för övriga steg. */
export type JourneyStepVerdict = {
  headline: string;
  reasoning: string;
};

/** Stegets arbetsyta (/app/resan/[steg]). `why`/`doneItems`/`highlights` är
 * tomma för ett steg som fortfarande är låst — se `status`. */
export type JourneyStepDetail = JourneyStepView & {
  why: string;
  doneItems: string[];
  highlights: string[];
  actionLabel: string;
  /** Vilket av de tre klickbara momenten (uppdrag 9.1) som visas — styr en
   * liten pill på stegets arbetsyta. Alltid "after" för ett redan klart steg. */
  momentKind: "before" | "running" | "after";
  scoreDelta: JourneyStepScoreDelta | null;
  /** Delar som blev upplåsta av det här steget (avsnitt 9.1, "vad som
   * låstes upp") — kod-härlett ur poängens låsta delar, aldrig hårdkodat. */
  newlyUnlockedParts: string[];
  verdict: JourneyStepVerdict | null;
  /** Simulering kopplad till steget (avsnitt 2.2, steg 03/04/06). */
  simulation: Simulation | null;
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
