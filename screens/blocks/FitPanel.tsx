"use client";

import { useState } from "react";
import Link from "next/link";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import { FIT_ANSWER_MAX, FIT_QUESTION_IDS, fitSubjectRef, type FitQuestionId } from "@/core/fitQuestions";
import type { EvidenceView } from "@/ports/EvidenceRecorder";
import { formatDelta } from "./ScoreFigure";

export type SaveFitAnswer = (
  questionId: FitQuestionId,
  answer: string,
) => Promise<{ ok: true; total: number; delta: number } | { ok: false }>;

/**
 * Passform från profilen (docs/bevislagring.md 5.1). Fyra frågor. En besvarad
 * fråga visar svaret med källa och datum (Datalöftet) och märkningen "Ditt
 * eget svar" (5.4). En obesvarad fråga visar ett fält. Efter en sparning visas
 * den nya poängen, räknad på servern av calculateScore. Skalets poäng
 * uppdateras av servern (revalidatePath), inte här.
 *
 * `evidence` är bevisen i delen Passform, som listEvidence ger dem. Bara
 * profilsvar som inte är återkallade räknas som svar.
 */
export function FitPanel({
  evidence,
  onSave,
  scoreHref,
}: {
  evidence: EvidenceView[];
  onSave: SaveFitAnswer;
  /** Poäng-sidan, där varje del visas med källa. Den nya poängen länkar dit
   * (CLAUDE.md, undantaget för uträknade sammanfattningar). */
  scoreHref: string;
}) {
  const { t } = useI18n();
  const copy = t.fitPanel;

  return (
    <section className="fd-panel" aria-labelledby="fdd-fit-title">
      <h2 id="fdd-fit-title" className="fdd-label">
        {copy.title}
      </h2>
      <p className="fdd-muted">{copy.lede}</p>
      <div className="fdd-stack">
        {FIT_QUESTION_IDS.map((id) => (
          <FitQuestion
            key={id}
            id={id}
            answered={evidence.find(
              (view) => view.kind === "profileFitAnswer" && view.subjectRef === fitSubjectRef(id) && view.status !== "retracted",
            )}
            onSave={onSave}
            scoreHref={scoreHref}
          />
        ))}
      </div>
    </section>
  );
}

function FitQuestion({
  id,
  answered,
  onSave,
  scoreHref,
}: {
  id: FitQuestionId;
  answered: EvidenceView | undefined;
  onSave: SaveFitAnswer;
  scoreHref: string;
}) {
  const { t } = useI18n();
  const copy = t.fitPanel;
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "failed">("idle");
  const [result, setResult] = useState<{ total: number; delta: number } | null>(null);
  const fieldId = `fdd-fit-${id}`;

  async function save() {
    setState("saving");
    const outcome = await onSave(id, draft).catch(() => ({ ok: false as const }));
    if (outcome.ok) {
      setResult({ total: outcome.total, delta: outcome.delta });
      setState("idle");
    } else {
      setState("failed");
    }
  }

  return (
    <div>
      <p className="fdd-body">{copy.questions[id]}</p>
      {answered ? (
        <>
          <p className="fdd-body">{answered.quote}</p>
          <p className="fdd-muted">
            {copy.ownAnswer} · <SourceTag source={answered.source} dataType="customer" />
          </p>
        </>
      ) : (
        <>
          <label htmlFor={fieldId} className="fdd-muted">
            {copy.answerLabel}
          </label>
          <textarea
            id={fieldId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={FIT_ANSWER_MAX}
            rows={2}
            className="fdd-textarea"
          />
          <button
            type="button"
            className="fd-btn fd-btn--primary fd-btn--sm"
            onClick={save}
            disabled={state === "saving" || draft.trim().length === 0}
          >
            {state === "saving" ? copy.saving : copy.save}
          </button>
          {state === "failed" && (
            <p className="fdd-muted" role="alert">
              {copy.failed}
            </p>
          )}
        </>
      )}
      {result && (
        <p className="fdd-note" role="status">
          {result.delta === 0 ? (
            copy.scoreUnchanged
          ) : (
            <Link href={scoreHref}>
              {fill(copy.scoreAfter, { total: String(result.total), delta: formatDelta(result.delta) })}
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
