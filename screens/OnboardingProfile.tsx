"use client";

import { useState } from "react";
import Link from "next/link";
import { ChatMessage } from "@/components/spark/ChatMessage";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useI18n } from "@/i18n/context";
import type { OnboardingScript } from "@/ports/ProfileRepository";

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

  const allAnswered = answeredCount >= script.questions.length;
  const answered = script.questions.slice(0, answeredCount);
  const current = script.questions[answeredCount];

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
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAnsweredCount((count) => count + 1)}
                className="max-w-lg rounded-lg border border-dashed border-accent-300 bg-accent-50 px-3.5 py-2 text-left text-sm leading-snug text-accent-800 transition-colors hover:bg-accent-100 focus-visible:outline-2 focus-visible:outline-accent-300"
                style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
              >
                {current.suggestedAnswer}
              </button>
            </div>
          </div>
        )}

        {allAnswered && <ChatMessage role="cofounder" text={script.closingMessage} />}
      </div>

      {answered.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
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
