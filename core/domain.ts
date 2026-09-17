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

export type ScoreSnapshot = {
  total: number;
  previousTotal: number;
  delta: number;
  deltaReason: string;
  calculatedAtIso: string;
  parts: ScorePart[];
  lockedParts: LockedScorePart[];
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

export type PulseSignal = {
  category: string;
  headline: string;
  whyItMatters: string;
  timestamp: string;
  source: Källa;
};
