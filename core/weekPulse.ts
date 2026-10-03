import type { PulseSignal } from "@/core/domain";

/** Så många signaler visas i "Veckans puls" på Hem. */
export const WEEK_PULSE_MAX = 2;
/** Så många dagar bakåt räknas som "veckan". */
const WEEK_DAYS = 7;

/**
 * Veckans viktigaste signaler (Pulsen v3): hämtade de senaste sju dagarna,
 * risker och möjligheter före vanliga nyheter, och inom varje grupp i
 * Pulsens egen ordning (det grundaren gillat först, sedan nyast). Ingen ny
 * bedömning: bara ett urval ur det Pulsen redan visar.
 */
export function pickWeekPulse(signals: PulseSignal[], todayIso: string, max = WEEK_PULSE_MAX): PulseSignal[] {
  const today = Date.parse(`${todayIso.slice(0, 10)}T00:00:00Z`);
  const recent = signals.filter((signal) => {
    const fetched = Date.parse(`${signal.source.hämtad.slice(0, 10)}T00:00:00Z`);
    return !Number.isNaN(fetched) && today - fetched < WEEK_DAYS * 24 * 60 * 60 * 1000 && fetched <= today;
  });
  const important = recent.filter((signal) => signal.risk || signal.opportunity);
  const other = recent.filter((signal) => !signal.risk && !signal.opportunity);
  return [...important, ...other].slice(0, max);
}
