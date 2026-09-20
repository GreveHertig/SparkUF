import type { MemoryRepository } from "@/ports/MemoryRepository";
import type { VerdictReport } from "@/ports/VerdictProvider";

/** Modulnamnet Domen skriver under i Spåret (`trace_events.module`). */
export const VERDICT_TRACE_MODULE = "Domen";

/**
 * Sparar en pivot i Minnets Spår (grundarens beslut, docs/moduler/domen.md).
 * Bara `pivot` ger en post; andra domar och `null` sparar inget. Idempotent
 * via `recordTraceEvent`, så det är säkert att anropa vid varje omräkning.
 * Portarna får datan injicerad: den här funktionen vet inte om det är demo
 * eller live, och ingen skärm anropar den än (skärmkopplingen är en egen fas).
 */
export async function recordVerdictTrace(
  report: VerdictReport | null,
  memory: Pick<MemoryRepository, "recordTraceEvent">,
): Promise<boolean> {
  const event = report?.pivotTraceEvent;
  if (!event) return false;
  await memory.recordTraceEvent({
    module: VERDICT_TRACE_MODULE,
    description: event.description,
    occurredAtIso: event.timestampIso,
  });
  return true;
}
