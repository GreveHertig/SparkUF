"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChatMessage } from "@/components/spark/ChatMessage";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useI18n } from "@/i18n/context";
import type { OnboardingScript } from "@/ports/ProfileRepository";

/** Hur länge Medgrundarens fråga står ensam innan svaret dyker upp, och hur
 * länge svaret står innan samtalet går vidare till nästa fråga — se
 * "Samtalet går framåt av sig själv" nedan. */
const REVEAL_ANSWER_DELAY_MS = 900;
const ADVANCE_DELAY_MS = 1400;

export type OnboardingProfileData = {
  script: OnboardingScript;
  /** Vart "Fortsätt" ska länka när alla frågor är besvarade. */
  continueHref: string;
  /** Bara demot behöver ett sidoeffekt-steg (markera onboardingen klar). */
  onContinue?: () => void;
};

/**
 * Profilsamtalet (avsnitt 6, 9.1): frågorna kommer en i taget, med ett
 * klickbart svarsförslag i stället för fritext — demot är helt förskrivet.
 * Varje klick lägger till svaret i chatten och i "profilen så här långt".
 */
export function OnboardingProfile({ data }: { data: OnboardingProfileData }) {
  const { t } = useI18n();
  const { script, continueHref, onContinue } = data;
  const [answeredCount, setAnsweredCount] = useState(0);
  // Index på den fråga vars svar redan hunnit dyka upp — jämförs mot
  // answeredCount i stället för en egen boolean, så att effekten nedan aldrig
  // behöver sätta state synkront i sin egen body (bara inuti setTimeout).
  const [revealedIndex, setRevealedIndex] = useState(-1);

  const allAnswered = answeredCount >= script.questions.length;
  const answered = script.questions.slice(0, answeredCount);
  const current = script.questions[answeredCount];
  const answerRevealed = revealedIndex === answeredCount;

  // Samtalet går framåt av sig själv (avsnitt 9.1): Medgrundarens fråga
  // visas, svaret dyker upp en stund senare, och samtalet går sedan vidare —
  // ingen ska behöva klicka på pratbubblorna för att komma framåt. Ett byte
  // av ingång (annat persona-samtal) monteras om via `key` av anropande
  // route, så den här skärmen behöver inte nollställa sig själv.
  useEffect(() => {
    if (!current) return;
    const revealTimer = setTimeout(() => setRevealedIndex(answeredCount), REVEAL_ANSWER_DELAY_MS);
    return () => clearTimeout(revealTimer);
  }, [current, answeredCount]);

  useEffect(() => {
    if (!current || !answerRevealed) return;
    const advanceTimer = setTimeout(() => setAnsweredCount((count) => count + 1), ADVANCE_DELAY_MS);
    return () => clearTimeout(advanceTimer);
  }, [current, answerRevealed]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-12">
      <div>
        <Eyebrow>{t.onboarding.profile.eyebrow}</Eyebrow>
        <EditorialHeading as="h1" className="mt-2">
          {t.onboarding.profile.title}
        </EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{t.onboarding.profile.subtitle}</p>
      </div>

      <div className="flex flex-col gap-3">
        {answered.map((question) => (
          <div key={question.id} className="flex flex-col gap-2">
            <ChatMessage role="cofounder" text={question.cofounderText} />
            <ChatMessage role="founder" text={question.suggestedAnswer} />
          </div>
        ))}

        {current && (
          <div className="flex flex-col gap-2">
            <ChatMessage role="cofounder" text={current.cofounderText} />
            {answerRevealed && <ChatMessage role="founder" text={current.suggestedAnswer} />}
          </div>
        )}

        {allAnswered && <ChatMessage role="cofounder" text={script.closingMessage} />}
      </div>

      {answered.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg">
          <Eyebrow>{t.onboarding.profile.buildingTitle}</Eyebrow>
          <ul className="mt-3 flex flex-col gap-1.5">
            {answered.map((question) => (
              <li key={question.id} className="flex items-center gap-2 text-sm text-slate-700">
                <CheckIcon />
                {question.suggestedAnswer}
              </li>
            ))}
          </ul>
        </div>
      )}

      {allAnswered && (
        <Link
          href={continueHref}
          onClick={onContinue}
          className="inline-flex w-fit items-center gap-1 rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-accent"
          style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
        >
          {t.onboarding.profile.continueCta}
        </Link>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-score-green"
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
