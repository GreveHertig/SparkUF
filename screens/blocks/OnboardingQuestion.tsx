"use client";

import { useState } from "react";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import { ONBOARDING_TEXT_MAX_LENGTH } from "@/core/onboarding";
import { textHasFigure } from "@/core/figures";
import type { Källa } from "@/core/domain";
import type { OnboardingQuestion } from "@/ports/ProfileRepository";
import { ChatLine } from "./ChatBlocks";

/**
 * En fråga ur onboardingen enligt spec v4 §4, som plattformen ställer den i
 * /start/profil och under Återstår i Minnet. Ett val är en knapp som sparar
 * direkt, fritext ett fält med en knapp. Skärmen vet inte vart svaret går: den
 * får en Server Action av routen. `ok: false` är indata som avvisades eller en
 * fråga som redan är besvarad; ett riktigt fel visas som ett fel att försöka
 * igen med, aldrig som ett tyst tomläge.
 */
export type SaveOnboardingAnswer = (
  questionId: string,
  answer: string,
) => Promise<{ ok: true; answeredOn: string | null } | { ok: false; reason: "invalid" | "locked" }>;

export function OnboardingQuestionCard({
  question,
  selected,
  onSave,
  onSaved,
}: {
  question: OnboardingQuestion;
  /** Det sparade svaret, när frågan ändras. */
  selected?: string;
  onSave: SaveOnboardingAnswer;
  /** Svaret och dagen databasen sparade det (null om tiden saknas). */
  onSaved: (answer: string, answeredOn: string | null) => void;
}) {
  const { t } = useI18n();
  const copy = t.onboarding.profile;
  const isChoice = question.kind === "choice" && question.choices !== undefined;
  const [draft, setDraft] = useState(!isChoice && selected ? selected : "");
  const [state, setState] = useState<"idle" | "saving" | "invalid" | "failed">("idle");
  const labelId = `fdd-question-${question.id}`;
  const saving = state === "saving";

  async function save(answer: string) {
    setState("saving");
    const outcome = await onSave(question.id, answer).catch(() => null);
    if (outcome?.ok) {
      setState("idle");
      onSaved(isChoice ? answer : answer.trim(), outcome.answeredOn);
    } else {
      setState(outcome?.reason === "invalid" ? "invalid" : "failed");
    }
  }

  return (
    <div className="fdd-conversation__pair" aria-busy={saving}>
      <div id={labelId}>
        <ChatLine role="cofounder" text={question.cofounderText} />
      </div>
      {isChoice ? (
        <div className="fdd-choices" role="group" aria-labelledby={labelId}>
          {question.choices!.map((choice) => (
            <button
              key={choice.id}
              type="button"
              aria-pressed={selected === choice.id}
              disabled={saving}
              onClick={() => save(choice.id)}
              className={cn("fd-btn fd-btn--sm", selected === choice.id ? "fd-btn--primary" : "fd-btn--secondary")}
            >
              {choice.label}
            </button>
          ))}
        </div>
      ) : (
        <form
          className="fdd-stack fdd-stack--tight"
          onSubmit={(event) => {
            event.preventDefault();
            void save(draft);
          }}
        >
          <textarea
            aria-labelledby={labelId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={ONBOARDING_TEXT_MAX_LENGTH}
            rows={3}
            required
            className="fdd-textarea"
          />
          <button
            type="submit"
            disabled={saving || draft.trim().length === 0}
            className="fd-btn fd-btn--primary fd-btn--sm fdd-self-start"
          >
            {saving ? copy.savingCta : copy.textSubmitCta}
          </button>
        </form>
      )}
      {state === "invalid" && (
        <p className="fdd-muted" role="alert">
          {fill(copy.invalidTemplate, { max: String(ONBOARDING_TEXT_MAX_LENGTH) })}
        </p>
      )}
      {state === "failed" && (
        <p className="fdd-muted" role="alert">
          {copy.saveFailed}
        </p>
      )}
    </div>
  );
}

/** Svaret som text: ett val med sin etikett, fritext som den skrevs. */
export function answerText(question: OnboardingQuestion, answer: string): string {
  return question.choices?.find((choice) => choice.id === answer)?.label ?? answer;
}

/** Ett givet svar som grundarens rad i samtalet. En siffra i svaret får
 * källan "Din uppgift" (CLAUDE.md, "Källa på varje siffra"), med dagen
 * svaret gavs, eller utan datum när tiden saknas. */
export function AnswerLine({ text, source }: { text: string; source: Källa }) {
  return <ChatLine role="founder" text={text} source={textHasFigure(text) ? { source, dataType: "user" } : undefined} />;
}
