"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import type { StepCompletionView } from "@/ports/JourneyProgress";

export type CompleteStep = () => Promise<{ ok: true; total: number } | { ok: false }>;

/**
 * Markera ett steg som klart (beslut 2026-10-01, docs/beslut.md). Visar
 * knappen bara när kraven är uppfyllda, annars vad som saknas. Databasen
 * prövar kraven igen när knappen trycks, så ett läge som hunnit ändras
 * (ett bevis som återkallats) ger ett fel i stället för ett klart steg.
 * Efter markeringen uppdaterar servern skalets poäng och steg (revalidatePath).
 */
export function StepCompletionPanel({
  completion,
  onComplete,
  scoreHref,
}: {
  completion: StepCompletionView;
  onComplete: CompleteStep;
  /** Poäng-sidan. Den nya poängen länkar dit (CLAUDE.md, undantaget för
   * uträknade sammanfattningar). */
  scoreHref: string;
}) {
  const { t } = useI18n();
  const copy = t.stepCompletion;
  const [state, setState] = useState<"idle" | "saving" | "failed">("idle");
  const [total, setTotal] = useState<number | null>(null);

  async function complete() {
    setState("saving");
    const outcome = await onComplete().catch(() => ({ ok: false as const }));
    if (outcome.ok) {
      setTotal(outcome.total);
      setState("idle");
    } else {
      setState("failed");
    }
  }

  return (
    <section className="fd-panel" aria-labelledby="fdd-step-completion">
      <h2 id="fdd-step-completion" className="fdd-label">
        {copy.title}
      </h2>
      {total !== null ? (
        <p className="fdd-note" role="status">
          <Link href={scoreHref}>{fill(copy.scoreAfter, { total: String(total) })}</Link>
        </p>
      ) : completion.status === "done" ? (
        <p className="fdd-body">{copy.done}</p>
      ) : completion.status === "previousNotDone" ? (
        <p className="fdd-muted">{copy.previousNotDone}</p>
      ) : completion.status === "noRequirementYet" ? (
        <p className="fdd-muted">{copy.noRequirementYet}</p>
      ) : completion.status === "missing" ? (
        <>
          <p className="fdd-muted">{copy.missingTitle}</p>
          <ul className="fdd-bullets">
            {completion.missing.map((group) => (
              <li key={group}>{copy.requirements[group]}</li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="fdd-body">{copy.completable}</p>
          <button type="button" className="fd-btn fd-btn--primary" onClick={complete} disabled={state === "saving"}>
            {state === "saving" ? copy.completing : copy.cta}
          </button>
        </>
      )}
      {state === "failed" && (
        <p className="fdd-muted" role="alert">
          {copy.failed}
        </p>
      )}
    </section>
  );
}
