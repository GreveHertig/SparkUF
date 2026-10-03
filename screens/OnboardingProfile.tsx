"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { useI18n } from "@/i18n/context";
import type { OnboardingEntry } from "@/core/domain";
import type { OnboardingScript } from "@/ports/ProfileRepository";
import { ChatLine } from "./blocks/ChatBlocks";
import type { OnboardingFormAction } from "./blocks/OnboardingForms";
import type { SaveOnboardingAnswer } from "./blocks/OnboardingQuestion";
import { OnboardingQuestionFlow } from "./blocks/OnboardingQuestionFlow";

// Frågan står ensam en stund, svaret kommer, och samtalet går vidare av sig
// självt (avsnitt 9.1): ingen ska behöva klicka på pratbubblorna.
const REVEAL_ANSWER_DELAY_MS = 900;
const ADVANCE_DELAY_MS = 1400;

/**
 * `null` betyder platshållarfel (Profilens liveadapter är inte byggd):
 * samtalet och profilen visar "Kommer snart". Båda kommer ur samma anrop, så
 * de saknas tillsammans.
 */
export type OnboardingProfileData = { script: OnboardingScript | null };

/** Bara plattformen (spec v4 §4): grundaren svarar själv, ett svar i taget,
 * och actionerna sparar. Utan den visas demots samtal med färdiga svar. */
export type OnboardingLiveFlow = {
  entry: OnboardingEntry;
  /** De svar som redan är sparade, så att samtalet fortsätter där det slutade. */
  answers: Record<string, string>;
  saveAnswer: SaveOnboardingAnswer;
  /** Gör onboardingen klar och skickar till /app ("Till appen" på startkortet). */
  completeAction: OnboardingFormAction;
  todayIso: string;
};

export type OnboardingProfileProps = {
  data: OnboardingProfileData;
  /** Vart "Fortsätt" länkar när alla frågor är besvarade. */
  continueHref: string;
  /** Bara demot behöver en sidoeffekt (markera onboardingen klar). */
  onContinue?: () => void;
  live?: OnboardingLiveFlow;
};

/**
 * Profilsamtalet (avsnitt 6, 9.1). Flyttad från demots `/demo/start/profil`
 * i PR 11 (docs/plan-en-design.md) och delad av `/demo/start/profil` och
 * `/start/profil`. Ett byte av ingång (annat samtal) monteras om via `key`
 * av anroparen, så skärmen behöver inte nollställa sig själv.
 */
export function OnboardingProfile({ data, continueHref, onContinue, live }: OnboardingProfileProps) {
  const { t } = useI18n();
  const copy = t.onboarding.profile;

  return (
    <div className="fdd-page fdd-onboarding">
      <header className="fdd-head">
        <h1 className="fd-h2">{copy.title}</h1>
        <p className="fd-lede">{live ? copy.formSubtitle : copy.subtitle}</p>
      </header>

      {data.script && live ? (
        <OnboardingQuestionFlow
          entry={live.entry}
          questions={data.script.questions}
          initialAnswers={live.answers}
          saveAnswer={live.saveAnswer}
          completeAction={live.completeAction}
          todayIso={live.todayIso}
        />
      ) : data.script ? (
        <Conversation script={data.script} continueHref={continueHref} onContinue={onContinue} />
      ) : (
        <div className="fdd-onboarding__grid">
          <div className="fdd-conversation">
            <ComingSoon />
          </div>
          <aside className="fd-panel fdd-profilebuild" aria-label={copy.buildingTitle}>
            <p className="fdd-label">{copy.buildingTitle}</p>
            <ComingSoon />
          </aside>
        </div>
      )}
    </div>
  );
}

function Conversation({
  script,
  continueHref,
  onContinue,
}: {
  script: OnboardingScript;
  continueHref: string;
  onContinue?: () => void;
}) {
  const { t } = useI18n();
  const copy = t.onboarding.profile;
  const [answeredCount, setAnsweredCount] = useState(0);
  // Index på frågan vars svar redan dykt upp. Jämförs mot answeredCount, så
  // att effekterna bara sätter state inuti setTimeout.
  const [revealedIndex, setRevealedIndex] = useState(-1);

  const allAnswered = answeredCount >= script.questions.length;
  const answered = script.questions.slice(0, answeredCount);
  const current = script.questions[answeredCount];
  const answerRevealed = revealedIndex === answeredCount;

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => setRevealedIndex(answeredCount), REVEAL_ANSWER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [current, answeredCount]);

  useEffect(() => {
    if (!current || !answerRevealed) return;
    const timer = setTimeout(() => setAnsweredCount((count) => count + 1), ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [current, answerRevealed]);

  return (
    <div className="fdd-onboarding__grid">
      <div className="fdd-conversation" aria-live="polite">
        {answered.map((question) => (
          <div key={question.id} className="fdd-conversation__pair">
            <ChatLine role="cofounder" text={question.cofounderText} />
            {question.suggestedAnswer !== null && <ChatLine role="founder" text={question.suggestedAnswer} />}
          </div>
        ))}
        {current && (
          <div className="fdd-conversation__pair">
            <ChatLine role="cofounder" text={current.cofounderText} />
            {answerRevealed && current.suggestedAnswer !== null && <ChatLine role="founder" text={current.suggestedAnswer} />}
          </div>
        )}
        {allAnswered && <ChatLine role="cofounder" text={script.closingMessage} />}
      </div>

      <aside className="fd-panel fdd-profilebuild" aria-label={copy.buildingTitle}>
        <p className="fdd-label">{copy.buildingTitle}</p>
        {answered.length > 0 && (
          <ul className="fd-checks fd-checks--small">
            {answered.map((question) => (
              <li key={question.id}>{question.suggestedAnswer}</li>
            ))}
          </ul>
        )}
        {allAnswered && (
          <Link href={continueHref} onClick={onContinue} className="fd-btn fd-btn--primary">
            {copy.continueCta}
          </Link>
        )}
      </aside>
    </div>
  );
}
