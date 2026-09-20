import type { Locale } from "@/i18n/context";
import type { Källa } from "@/core/domain";
import type { TraceEvent } from "@/ports/MemoryRepository";
import type { JourneyStepVerdict } from "@/ports/JourneyRepository";
import type { Verdict, VerdictInput } from "@/core/verdict";

/** Ett ordagrant citat som lyfts fram i domen. Alltid med bolag, datum och källa (Datalöftet). */
export type VerdictQuote = {
  companyName: string;
  dateIso: string;
  quote: string;
  source: Källa;
};

/**
 * Domen, färdig att visa. `presentation` har samma form som
 * `JourneyStepDetail.verdict` (ports/JourneyRepository.ts), så Resan kan
 * läsa den utan ändring. Innehåller aldrig poäng.
 */
export type VerdictReport = {
  verdict: Verdict;
  presentation: JourneyStepVerdict;
  quotes: VerdictQuote[];
  /** Bara vid `pivot`: en post som Minnets Spår kan spara. Sparas inte av den här modulen. */
  pivotTraceEvent: TraceEvent | null;
};

/**
 * Modul: Domen (avsnitt 14.3, steg 06). Se docs/moduler/domen.md.
 * `null` = det finns inga svar att döma på än (t.ex. steg 05 inte körd).
 */
export interface VerdictProvider {
  getVerdictInput(locale: Locale): Promise<VerdictInput | null>;
  getVerdictReport(locale: Locale): Promise<VerdictReport | null>;
}
