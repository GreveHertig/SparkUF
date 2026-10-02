"use client";

import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import type { IdeaScreening } from "@/ports/ProjectRepository";
import { ChatLine } from "./blocks/ChatBlocks";
import { Pill } from "./blocks/PageBlocks";
import { IdeaForm, type OnboardingFormAction } from "./blocks/OnboardingForms";

/**
 * `null` betyder platshållarfel (Projektets liveadapter är inte byggd): varje
 * sektion behåller sin rubrik och visar "Kommer snart". Alla sektioner kommer
 * ur samma anrop, så de saknas tillsammans.
 */
export type OnboardingIdeaData = { screening: IdeaScreening | null };

export type OnboardingIdeaProps = {
  data: OnboardingIdeaData;
  /** Vart "Fortsätt" länkar: det kortare profilsamtalet (avsnitt 2.1). */
  continueHref: string;
  /** Bara plattformen, och bara innan projektet finns: grundaren beskriver
   * idén, och actionen sparar den som aktivt projekt. Utan den visas
   * genomlysningen, som förut. */
  ideaAction?: OnboardingFormAction;
};

/**
 * Idégenomlysningen (ingång B, avsnitt 2.1, 6): antagandena, registret, det
 * svaga och en skarpare idé. Flyttad från demots `/demo/start/ide` i PR 11
 * (docs/plan-en-design.md) och delad av `/demo/start/ide` och `/start/ide`.
 */
export function OnboardingIdea({ data, continueHref, ideaAction }: OnboardingIdeaProps) {
  const { t } = useI18n();
  const copy = t.onboarding.idea;
  const { screening } = data;

  if (ideaAction) {
    return (
      <div className="fdd-page fdd-onboarding">
        <header className="fdd-head">
          <h1 className="fd-h2">{copy.founderIntroLabel}</h1>
          <p className="fd-lede">{copy.formSubtitle}</p>
        </header>
        <IdeaForm action={ideaAction} />
      </div>
    );
  }

  return (
    <div className="fdd-page fdd-onboarding">
      <header className="fdd-head">
        <h1 className="fd-h2">{copy.title}</h1>
      </header>

      <section className="fdd-block" aria-labelledby="fdd-idea-intro">
        <h2 id="fdd-idea-intro" className="fdd-label">
          {copy.founderIntroLabel}
        </h2>
        {screening ? <ChatLine role="founder" text={screening.originalIdea} /> : <ComingSoon />}
      </section>

      <section className="fdd-block" aria-labelledby="fdd-idea-assumptions">
        <h2 id="fdd-idea-assumptions" className="fdd-block__title">
          {copy.assumptionsTitle}
        </h2>
        {screening ? (
          <ul className="fdd-rows">
            {screening.assumptions.map((assumption) => (
              <li key={assumption.text} className="fdd-rows__item">
                <span>{assumption.text}</span>
                <Pill tone={assumption.testableNow ? "accent" : "neutral"}>
                  {assumption.testableNow ? copy.testableLabel : copy.notTestableYetLabel}
                </Pill>
              </li>
            ))}
          </ul>
        ) : (
          <ComingSoon />
        )}
      </section>

      <section className="fdd-block" aria-labelledby="fdd-idea-register">
        <h2 id="fdd-idea-register" className="fdd-block__title">
          {copy.registerTitle}
        </h2>
        {screening ? (
          <dl className="fdd-figures">
            {screening.registerFacts.map((fact) => (
              <div key={fact.label} className="fdd-figures__item">
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
                <SourceTag source={fact.source} />
              </div>
            ))}
          </dl>
        ) : (
          <ComingSoon />
        )}
      </section>

      <section className="fdd-block" aria-labelledby="fdd-idea-weak">
        <h2 id="fdd-idea-weak" className="fdd-block__title">
          {copy.weaknessTitle}
        </h2>
        {screening ? <ChatLine role="cofounder" text={screening.weakness} /> : <ComingSoon />}
      </section>

      <section className="fd-panel fdd-sharper" aria-labelledby="fdd-idea-sharper">
        <h2 id="fdd-idea-sharper" className="fdd-label">
          {copy.sharperTitle}
        </h2>
        {screening ? (
          <>
            <p className="fdd-sharper__name">{screening.sharperIdea.name}</p>
            <p className="fd-nextstep__why">{screening.sharperIdea.oneLiner}</p>
            <p className="fdd-muted">
              {copy.sharperWhyLabel}: {screening.sharperIdea.why}
            </p>
          </>
        ) : (
          <ComingSoon />
        )}
      </section>

      <Link href={continueHref} className="fd-btn fd-btn--primary fdd-self-start">
        {copy.continueCta}
      </Link>
    </div>
  );
}
