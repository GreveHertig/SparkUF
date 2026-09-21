"use client";

import Link from "next/link";
import { ChatMessage } from "@/components/spark/ChatMessage";
import { DataFact } from "@/components/ui/DataFact";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { IdeaScreening } from "@/ports/ProjectRepository";

export type OnboardingIdeaData = {
  screening: IdeaScreening;
  /** Vart "Fortsätt" ska länka — det kortare profilsamtalet (avsnitt 2.1). */
  continueHref: string;
  onContinue?: () => void;
};

/**
 * Idégenomlysningen (avsnitt 2.1, 6): idén bryts ner i antaganden, en första
 * registerbild visas, Medgrundaren säger rakt ut vad som är svagt och
 * föreslår en skarpare version. Ersätter steg 02 för ingång B.
 */
export function OnboardingIdea({ data }: { data: OnboardingIdeaData }) {
  const { t } = useI18n();
  const { screening, continueHref, onContinue } = data;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 py-12">
      <div>
        <Eyebrow>{t.onboarding.idea.eyebrow}</Eyebrow>
        <EditorialHeading as="h1" className="mt-2">
          {t.onboarding.idea.title}
        </EditorialHeading>
      </div>

      <div>
        <Eyebrow>{t.onboarding.idea.founderIntroLabel}</Eyebrow>
        <div className="mt-2">
          <ChatMessage role="founder" text={screening.originalIdea} />
        </div>
      </div>

      <section>
        <Eyebrow>{t.onboarding.idea.assumptionsTitle}</Eyebrow>
        <ul className="mt-3 flex flex-col gap-2">
          {screening.assumptions.map((assumption) => (
            <li
              key={assumption.text}
              className="flex items-start justify-between gap-3 rounded-md border border-slate-200 bg-white p-3.5 shadow-lg"
            >
              <span className="text-sm leading-snug text-slate-800">{assumption.text}</span>
              <span
                className={cn(
                  "shrink-0 rounded-pill px-2.5 py-1 text-xs font-semibold uppercase",
                  assumption.testableNow ? "bg-accent-100 text-accent-700" : "bg-slate-100 text-slate-600",
                )}
                style={{ letterSpacing: "var(--tracking-label)" }}
              >
                {assumption.testableNow ? t.onboarding.idea.testableLabel : t.onboarding.idea.notTestableYetLabel}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <Eyebrow>{t.onboarding.idea.registerTitle}</Eyebrow>
        <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {screening.registerFacts.map((fact) => (
            <DataFact key={fact.label} label={fact.label} value={fact.value} source={fact.source} />
          ))}
        </div>
      </section>

      <section>
        <Eyebrow>{t.onboarding.idea.weaknessTitle}</Eyebrow>
        <div className="mt-2">
          <ChatMessage role="cofounder" text={screening.weakness} />
        </div>
      </section>

      <section>
        <Eyebrow>{t.onboarding.idea.sharperTitle}</Eyebrow>
        <div className="mt-2 rounded-md border border-slate-200 bg-white p-5 shadow-lg">
          <p className="text-xl font-bold text-slate-900">{screening.sharperIdea.name}</p>
          <p className="mt-1 text-sm leading-snug text-slate-700">{screening.sharperIdea.oneLiner}</p>
          <p className="mt-3 text-sm leading-snug text-slate-600">
            <span className="font-semibold text-slate-700">{t.onboarding.idea.sharperWhyLabel}: </span>
            {screening.sharperIdea.why}
          </p>
        </div>
      </section>

      <Link
        href={continueHref}
        onClick={onContinue}
        className="inline-flex w-fit items-center gap-1 rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-accent"
        style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
      >
        {t.onboarding.idea.continueCta}
      </Link>
    </div>
  );
}
