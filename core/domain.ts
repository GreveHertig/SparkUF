// Delade domäntyper (avsnitt 14.2). Bevis, Källa, juridik- och byggtyperna
// fanns redan innan sessionerna började (types/evidence.ts, types/legal.ts,
// types/bygg.ts) och återexporteras här oförändrade, så att core/, ports/ och
// adapters/ har en enda importväg (`@/core/domain`) för hela domänmodellen.
export * from "@/types/evidence";
export * from "@/types/legal";
export * from "@/types/bygg";

import type { Källa } from "@/types/evidence";
import type { DataType } from "@/design/tokens";

export type Profile = {
  name: string;
  initials: string;
};

/** Vilken ingång grundaren valde i onboardingen (avsnitt 2.1): "noIdea" —
 * "Jag har ingen idé än", "hasIdea" — "Jag har redan en idé". Delad mellan
 * ports/, adapters/demo/ (demoStore) och screens/ så att ingen av dem
 * duplicerar typen. */
export type OnboardingEntry = "noIdea" | "hasIdea";

/**
 * Vilken sorts data en vy visar (Datalöftet, docs/uppdrag.md 1.2):
 * "example" är demots påhittade exempeldata och ska märkas synligt,
 * "live" är riktig data. Bara demot sätter "example" (docs/plan-en-design.md).
 */
export type DataKind = "example" | "live";

/** En del av poängens nedbrytning (avsnitt 7.2), redan upplåst. */
export type ScorePart = {
  name: string;
  points: number;
  weight: number;
  source: Källa;
  dataType: DataType;
};

/** En del som ännu inte är upplåst (avsnitt 7.3) — visas aldrig som 0. */
export type LockedScorePart = {
  name: string;
  unlocksAfterStep: number;
};

/** En upplåst del som saknar bevis (beslut B4, docs/bevislagring.md 3.3).
 * Ger 0 poäng till totalen men visas som en lucka, aldrig som "0/vikt":
 * Datalöftet säger att saknat underlag syns som en lucka, inte som ett resultat. */
export type EmptyScorePart = {
  name: string;
  weight: number;
};

export type ScoreSnapshot = {
  total: number;
  previousTotal: number;
  delta: number;
  deltaReason: string;
  calculatedAtIso: string;
  parts: ScorePart[];
  lockedParts: LockedScorePart[];
  /** Upplåsta delar utan bevis. Valfri så att befintliga snapshots i demots
   * scenarier inte behöver skrivas om. calculateScore sätter den alltid. */
  emptyParts?: EmptyScorePart[];
};

/** Handlingssteget som alltid visas (avsnitt 1.4, punkt 3). */
export type NextStep = {
  eyebrow: string;
  title: string;
  why: string;
  maxPoints: number;
  estimatedTime: string;
  doneItems: string[];
  actionLabel: string;
};

export type SinceLastTime = {
  emailSentSource: Källa;
  recipientCount: number;
  openRate: number;
  openRateSource: Källa;
  reminderSentDateIso: string;
  responsesReceived: number;
  responsesSource: Källa;
};

/** Riskområdena i Pulsen (Hampus Hedelius tips 2026-10-02: yttre omständigheter). */
export const PULSE_RISK_AREAS = ["costs", "finance", "regulation", "competition", "demand", "supply"] as const;
export type PulseRiskArea = (typeof PULSE_RISK_AREAS)[number];
/** Möjligheterna i Pulsen: stöd och bidrag, och offentliga upphandlingar. */
export const PULSE_OPPORTUNITY_AREAS = ["funding", "procurement"] as const;
export type PulseOpportunityArea = (typeof PULSE_OPPORTUNITY_AREAS)[number];

export type PulseSignal = {
  category: string;
  headline: string;
  whyItMatters: string;
  timestamp: string;
  source: Källa;
  /**
   * Satt när signalen är en risk att bevaka (yttre omständigheter). Valfri:
   * en vanlig nyhet saknar den, och demots signaler har den inte.
   * `actions` är allmänna förslag ur i18n, inga påståenden om nyheten.
   */
  risk?: { area: PulseRiskArea; actions: string[] };
  /** Satt när signalen är en möjlighet (stöd, bidrag, upphandling). Aldrig samtidigt som `risk`. */
  opportunity?: { area: PulseOpportunityArea; actions: string[] };
};
