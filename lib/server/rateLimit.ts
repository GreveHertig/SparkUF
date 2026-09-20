import "server-only";
import { OutreachRateLimitError } from "@/core/errors";

/**
 * Enkel throttle per användare, i minnet. Best-effort: överlever inte flera
 * serverinstanser eller omstart. Det riktiga taket är allowlisten på två
 * personer (lib/server/outreachAccess.ts). En Supabase-räknare med RLS är en
 * möjlig uppföljning.
 */

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const calls = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  limits: { perHour: number; perDay: number },
  now: number = Date.now(),
): void {
  const recent = (calls.get(key) ?? []).filter((t) => now - t < DAY_MS);
  const lastHour = recent.filter((t) => now - t < HOUR_MS).length;
  if (lastHour >= limits.perHour || recent.length >= limits.perDay) {
    calls.set(key, recent);
    throw new OutreachRateLimitError();
  }
  recent.push(now);
  calls.set(key, recent);
}

/** Bara för tester. */
export function resetRateLimit(): void {
  calls.clear();
}
