import type { Locale } from "@/i18n/context";
import type { PulseFeedbackVerdict, PulseSignal, PulseWatch } from "@/core/domain";

/** Modul: Pulsen (avsnitt 14.3), delar dokument med ResearchProvider. Liveadapter bygger på Tavily. */
export interface PulseProvider {
  getTodaysSignal(locale: Locale): Promise<PulseSignal>;
  /** Signalflödet för /app/pulsen (9.5) — 3–5 signaler, nyast först. */
  getSignals(locale: Locale): Promise<PulseSignal[]>;

  // Omdöme och bevakningar (docs/moduler/webbresearch-och-pulsen.md,
  // "Omdöme och bevakningar"). Valfria: bara liveadaptern har dem, demot
  // visar varken knappar eller bevakningar. Kastar NotImplementedError när
  // tabellerna saknas (migreringen inte körd).
  /** Sparar grundarens omdöme. "not_relevant" döljer signalen. */
  setFeedback?(signalId: string, verdict: PulseFeedbackVerdict): Promise<void>;
  /** Det aktiva projektets bevakningar. */
  getWatches?(): Promise<PulseWatch[]>;
  /** Lägger till en bevakning. Samma ord två gånger ignoreras. */
  addWatch?(kind: PulseWatch["kind"], term: string): Promise<void>;
  removeWatch?(id: string): Promise<void>;
}
