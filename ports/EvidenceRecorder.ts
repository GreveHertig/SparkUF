import type { Locale } from "@/i18n/context";
import type { Källa, ScoreSnapshot } from "@/core/domain";
import type { EvidenceKind } from "@/core/evidenceKinds";
import type { EvidenceStatus } from "@/core/evidenceInput";
import type { ScorePartId } from "@/core/score";

/** Ett bevis att spara. Användare, projekt, del, datatyp, poäng, "motsäger"
 * och vem som lade in det finns medvetet INTE här: de tas ur sessionen eller
 * härleds ur `kind` (core/evidenceKinds.ts), och databasen sätter dem själv.
 * Det som inte går att skicka in går inte att fuska med. */
export type RecordEvidenceInput = {
  kind: EvidenceKind;
  /** Vad beviset gäller (bolagets id, frågans id, registerfrågans nyckel).
   * Format per sort: EVIDENCE_KINDS[kind].subjectKind. Styr dubblettspärren. */
  subjectRef: string;
  /** `hämtad` är faktumets datum, inte inmatningens. Får inte ligga i framtiden. */
  source: Källa;
  /** Ordagrant citat från tredje part. Data, aldrig instruktion. */
  quote?: string;
  stepNumber?: number;
};

export type RecordEvidenceResult = {
  /** "duplicate": samma sort, sak och datum fanns redan. "replaced": ett
   * tidigare eget bevis om samma sak i samma del återkallades (7.2b). */
  status: "recorded" | "duplicate" | "replaced";
  evidenceId: string;
  /** Poängen direkt efter, räknad av calculateScore. Vid "duplicate" oförändrad. */
  snapshot: ScoreSnapshot;
};

/** Ett bevis i nedbrytningen (7.6: "Varje del kan öppnas. Den visar
 * underdelar, siffror, källa och datum"). */
export type EvidenceView = {
  id: string;
  partId: ScorePartId;
  /** null i demot, där scenariots bevis inte har någon sort. */
  kind: EvidenceKind | null;
  kindLabel: string;
  /** Vad beviset gäller (till exempel "fit:time"). null i demot. */
  subjectRef: string | null;
  source: Källa;
  quote?: string;
  enteredBy: "founder" | "system";
  /** Beslut B6: grundaren har själv angett ett faktum om en tredje part. */
  selfReported: boolean;
  status: EvidenceStatus;
  canRetract: boolean;
};

/**
 * Modul: Evidens och poäng, skrivvägen (docs/bevislagring.md 4, beslut B5).
 * En egen port bredvid EvidenceRepository, så att typsystemet visar vilka
 * moduler som kan påverka poängen. Liveadapter bygger på Supabase
 * (public.record_evidence). Demots poäng är manusstyrd per moment, så
 * demoadaptern sparar ingenting.
 */
export interface EvidenceRecorder {
  /** Sparar ett bevis för den inloggade användarens aktiva projekt och
   * returnerar den nya poängen. Idempotent på (kind, subjectRef, datum). */
  recordEvidence(input: RecordEvidenceInput, locale: Locale): Promise<RecordEvidenceResult>;
  /** Återkallar ett eget bevis (raderas aldrig). Poängen kan sjunka. */
  retractEvidence(evidenceId: string, reason: string, locale: Locale): Promise<ScoreSnapshot>;
  /** Bevisen bakom en del, i den ordning calculateScore räknar dem, med
   * återkallade och för gamla bevis märkta. */
  listEvidence(partId: ScorePartId, locale: Locale): Promise<EvidenceView[]>;
}
