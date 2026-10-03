import type { Locale } from "@/i18n/context";
import type { ProfileSummary, TraceEvent } from "@/ports/MemoryRepository";
import type { Project } from "@/ports/ProjectRepository";
import { isPlaceholderError } from "@/core/errors";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { liveMemoryRepository } from "@/adapters/live/MemoryRepository";
import { liveProjectRepository } from "@/adapters/live/ProjectRepository";

/** Så många av de senaste posterna i Spåret följer med. */
const TRACE_LIMIT = 10;

export type CofounderStep = {
  number: number;
  title: string;
  oneLiner: string;
  why: string;
  doneItems: string[];
};

/**
 * Det som redan är känt om grundaren, läst via de andra modulernas portar
 * (docs/moduler/medgrundaren.md). `null` betyder att delen inte finns än
 * (en platshållare i den porten), inte ett fel.
 */
export type CofounderContext = {
  step: CofounderStep | null;
  profile: Partial<ProfileSummary> | null;
  brainNotes: string | null;
  /** De senaste posterna i Spåret, äldst först. */
  trace: TraceEvent[] | null;
  project: Project | null;
};

/** Ett platshållarfel (stubbe, tomt konto) blir `null`. Ett riktigt fel kastas. */
function orNull<T>(promise: Promise<T>): Promise<T | null> {
  return promise.catch((error) => {
    if (isPlaceholderError(error)) return null;
    throw error;
  });
}

async function loadStep(locale: Locale): Promise<CofounderStep | null> {
  const steps = await orNull(liveJourneyRepository.getSteps(locale));
  if (!steps || steps.length === 0) return null;
  // Aktuellt steg. Är alla klara gäller det sista.
  const current = steps.find((step) => step.status === "current") ?? steps[steps.length - 1];
  const detail = await orNull(liveJourneyRepository.getStepDetail(current.stepNumber, locale));
  return {
    number: current.stepNumber,
    title: current.title,
    oneLiner: current.oneLiner,
    why: detail?.why ?? "",
    doneItems: detail?.doneItems ?? [],
  };
}

async function loadProfile(): Promise<Partial<ProfileSummary> | null> {
  if (!liveMemoryRepository.getKnownProfile) return null;
  const profile = await orNull(liveMemoryRepository.getKnownProfile());
  return profile && Object.keys(profile).length > 0 ? profile : null;
}

/**
 * Läser Resan, Profilen, Minnet och projektet var för sig. En del som saknas
 * stoppar inte de andra. Används både av Medgrundarens liveadapter (prompten)
 * och av /app/medgrundaren ("Sedan tidigare"), så att båda ser samma sak.
 */
export async function loadCofounderContext(locale: Locale): Promise<CofounderContext> {
  const [step, profile, brainNotes, trace, project] = await Promise.all([
    loadStep(locale),
    loadProfile(),
    orNull(liveMemoryRepository.getBrainNotes()),
    orNull(liveMemoryRepository.getTraceEvents(locale)),
    orNull(liveProjectRepository.getProject()),
  ]);
  return {
    step,
    profile,
    brainNotes: brainNotes?.trim() ? brainNotes.trim() : null,
    trace: trace && trace.length > 0 ? trace.slice(-TRACE_LIMIT) : null,
    project,
  };
}
