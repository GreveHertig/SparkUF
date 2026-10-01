"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/context";
import type { OnboardingEntry as EntryChoice } from "@/core/domain";

export type OnboardingEntryProps = {
  /** "/demo/start" eller "/start" — skärmen känner inte till vilket läge den är i. */
  basePath: string;
  /** Bara demot behöver veta vilken ingång som valdes (demoStore). Plattformen
   * har inget att spara det till än. */
  onChoose?: (entry: EntryChoice) => void;
};

/**
 * Val av ingång (avsnitt 2.1, 6): två vägar in i samma resa. Ingen data att
 * hämta, bara navigation. Flyttad från demots `/demo/start` i PR 11
 * (docs/plan-en-design.md) och delad av `/demo/start` och `/start`.
 */
export function OnboardingEntry({ basePath, onChoose }: OnboardingEntryProps) {
  const { t } = useI18n();
  const copy = t.onboarding.entry;

  const choices = [
    { entry: "noIdea" as const, href: `${basePath}/profil`, ...copy.noIdea },
    { entry: "hasIdea" as const, href: `${basePath}/ide`, ...copy.hasIdea },
  ];

  return (
    <div className="fdd-page fdd-onboarding">
      <header className="fdd-head fdd-head--center">
        <h1 className="fd-h2">{copy.title}</h1>
        <p className="fd-lede">{copy.subtitle}</p>
      </header>

      <div className="fdd-entries" data-tour-id="entry-cards">
        {choices.map((choice) => (
          <Link key={choice.entry} href={choice.href} onClick={() => onChoose?.(choice.entry)} className="fdd-entry">
            <span className="fdd-entry__title">{choice.title}</span>
            <span className="fdd-entry__body">{choice.body}</span>
            <span className="fdd-entry__cta">
              {choice.cta} <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
