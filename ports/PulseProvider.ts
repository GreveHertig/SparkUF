import type { Locale } from "@/i18n/context";
import type { PulseSignal } from "@/core/domain";

/** Modul: Pulsen (avsnitt 14.3), delar dokument med ResearchProvider. Liveadapter bygger på Tavily. */
export interface PulseProvider {
  getTodaysSignal(locale: Locale): Promise<PulseSignal>;
}
