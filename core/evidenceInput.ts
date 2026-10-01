// Från lagrade bevisrader till det calculateScore tar emot
// (docs/bevislagring.md 3.2). Ren funktion: samma rader och samma datum ger
// alltid samma utdata. Dagens datum kommer in som argument, aldrig ur
// Date.now(), så att "om ett år" går att testa utan att fejka klockan.
//
// Reglerna, i den ordning de tillämpas:
// 1. Återkallade bevis räknas inte (de raderas aldrig, se 7.5).
// 2. Del, datatyp och "motsäger" måste stämma med sorten i core/evidenceKinds.ts.
//    Gör de inte det har någon skrivit förbi skrivvägen, och då kastas ett fel.
// 3. Ett bevis äldre än sortens livslängd utesluts helt (beslut B9). Det
//    graderas aldrig ner: "Det här beviset är äldre än X och räknas inte
//    längre" ska gå att säga i en mening.
// 4. Bevisen ordnas efter när de lades in (created_at, sedan id). Ordningen
//    styr avtagande värde-trappan och vilken källa delen visar i calculateScore.
// 5. En sort utan poäng (basePoints 0) skickas inte till calculateScore.
//    Den uppfyller bara ett krav i resan och får inte fylla en tom del, som
//    då skulle visas som "0" i stället för som en lucka (beslut B4).
// 6. Självrapporterade bevis kan tillsammans ge en del högst
//    SELF_REPORTED_PART_SHARE av dess vikt (beslut B6).
//
// En del som efter reglerna saknar bevis skickas tom till calculateScore,
// som visar den som en lucka och aldrig kastar (beslut B4).
import type { Källa } from "@/core/domain";
import { ALL_PART_IDS, SCORE_PART_WEIGHTS, type PartEvidence, type ScorePartId } from "@/core/score";
import {
  EVIDENCE_KINDS,
  SELF_REPORTED_PART_SHARE,
  givesPoints,
  isEvidenceKind,
  isSelfReported,
  type EvidenceKind,
} from "@/core/evidenceKinds";

/** En rad ur public.evidence, redan omvandlad av adaptern. */
export type StoredEvidence = {
  id: string;
  kind: string;
  /** Som lagrat. Kontrolleras mot sorten, används aldrig direkt. */
  partId: string;
  dataType: string;
  contradicts: boolean;
  /** Satt av databasen ur sorten när beviset skrevs (beslut B2). */
  points: number;
  enteredBy: "founder" | "system";
  /** `hämtad` är faktumets datum (fetched_at). Föråldringen räknas på det. */
  source: Källa;
  createdAtIso: string;
  retractedAtIso: string | null;
};

/** Hur ett bevis behandlades. "capped": självrapporterat, och taket för
 * delen var redan helt eller delvis nått. "noPoints": sorten ger ingen poäng
 * men räknas mot resans krav. */
export type EvidenceStatus = "counted" | "capped" | "noPoints" | "stale" | "retracted";

export type EvidenceInputResult = {
  parts: PartEvidence[];
  status: Record<string, EvidenceStatus>;
};

/** Kastas när en lagrad rad inte stämmer med core/evidenceKinds.ts. Ska
 * aldrig hända via skrivvägen: databasen sätter fälten ur sorten. */
export class EvidenceIntegrityError extends Error {
  constructor(evidenceId: string, detail: string) {
    super(`Bevis ${evidenceId} stämmer inte med sin sort (${detail}). Någon har skrivit förbi skrivvägen.`);
    this.name = "EvidenceIntegrityError";
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDay(iso: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) throw new Error(`Ogiltigt datum: "${iso}".`);
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS;
}

/** Är beviset äldre än sortens livslängd, räknat från faktumets datum? */
export function isStale(kind: EvidenceKind, fetchedIso: string, todayIso: string): boolean {
  const freshForDays = EVIDENCE_KINDS[kind].freshForDays;
  if (freshForDays === null) return false;
  return utcDay(todayIso) - utcDay(fetchedIso) > freshForDays;
}

function assertMatchesKind(row: StoredEvidence): EvidenceKind {
  if (!isEvidenceKind(row.kind)) throw new EvidenceIntegrityError(row.id, `okänd sort "${row.kind}"`);
  const spec = EVIDENCE_KINDS[row.kind];
  if (row.partId !== spec.partId) throw new EvidenceIntegrityError(row.id, `del "${row.partId}"`);
  if (row.dataType !== spec.dataType) throw new EvidenceIntegrityError(row.id, `datatyp "${row.dataType}"`);
  if (row.contradicts !== spec.contradicts) throw new EvidenceIntegrityError(row.id, "motsäger");
  return row.kind;
}

function byInsertionOrder(a: StoredEvidence, b: StoredEvidence): number {
  if (a.createdAtIso !== b.createdAtIso) return a.createdAtIso < b.createdAtIso ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function toPartEvidence(
  rows: readonly StoredEvidence[],
  todayIso: string,
  labels: Record<ScorePartId, string>,
): EvidenceInputResult {
  const status: Record<string, EvidenceStatus> = {};
  const counted: { row: StoredEvidence; kind: EvidenceKind }[] = [];

  for (const row of [...rows].sort(byInsertionOrder)) {
    // Kontrollen gäller även återkallade och föråldrade rader: en felaktig
    // rad är ett fel oavsett om den råkar räknas just nu.
    const kind = assertMatchesKind(row);
    if (row.retractedAtIso !== null) {
      status[row.id] = "retracted";
    } else if (isStale(kind, row.source.hämtad, todayIso)) {
      status[row.id] = "stale";
    } else if (!givesPoints(kind)) {
      status[row.id] = "noPoints";
    } else {
      counted.push({ row, kind });
    }
  }

  const parts = ALL_PART_IDS.map((partId): PartEvidence => {
    const selfReportCap = SCORE_PART_WEIGHTS[partId] * SELF_REPORTED_PART_SHARE;
    let selfReportUsed = 0;

    const items = counted
      .filter(({ kind }) => EVIDENCE_KINDS[kind].partId === partId)
      .map(({ row, kind }) => {
        const spec = EVIDENCE_KINDS[kind];
        let points = row.points;
        status[row.id] = "counted";
        if (isSelfReported(kind, row.enteredBy) && points > 0) {
          const allowed = Math.min(points, Math.max(0, selfReportCap - selfReportUsed));
          selfReportUsed += allowed;
          if (allowed < points) status[row.id] = "capped";
          points = allowed;
        }
        return { points, source: row.source, dataType: spec.dataType, contradicts: spec.contradicts };
      });

    return { partId, label: labels[partId], items };
  });

  return { parts, status };
}
