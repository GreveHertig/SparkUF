"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { demoProjectRepository } from "@/adapters/demo/ProjectRepository";
import type { IdeaScreening } from "@/ports/ProjectRepository";
import { ChatLine, Pill } from "../../_components/DemoBlocks";
import { FONDA_DEMO_PATHS } from "../../_lib/paths";

/** Idégenomlysningen (ingång B): antagandena, registret, det svaga och en skarpare idé. */
export default function FondaDemoIdeaPage() {
  const { t, locale } = useI18n();
  const copy = t.onboarding.idea;
  const [screening, setScreening] = useState<IdeaScreening | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoProjectRepository.getIdeaScreening(locale).then((result) => {
      if (!cancelled) setScreening(result);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (!screening) return null;

  return (
    <div className="fdd-page fdd-onboarding">
      <header className="fdd-head">
        <h1 className="fd-h2">{copy.title}</h1>
      </header>

      <section className="fdd-block" aria-labelledby="fdd-idea-intro">
        <h2 id="fdd-idea-intro" className="fdd-label">
          {copy.founderIntroLabel}
        </h2>
        <ChatLine role="founder" text={screening.originalIdea} />
      </section>

      <section className="fdd-block" aria-labelledby="fdd-idea-assumptions">
        <h2 id="fdd-idea-assumptions" className="fdd-block__title">
          {copy.assumptionsTitle}
        </h2>
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
      </section>

      <section className="fdd-block" aria-labelledby="fdd-idea-register">
        <h2 id="fdd-idea-register" className="fdd-block__title">
          {copy.registerTitle}
        </h2>
        <dl className="fdd-figures">
          {screening.registerFacts.map((fact) => (
            <div key={fact.label} className="fdd-figures__item">
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
              <SourceTag source={fact.source} />
            </div>
          ))}
        </dl>
      </section>

      <section className="fdd-block" aria-labelledby="fdd-idea-weak">
        <h2 id="fdd-idea-weak" className="fdd-block__title">
          {copy.weaknessTitle}
        </h2>
        <ChatLine role="cofounder" text={screening.weakness} />
      </section>

      <section className="fd-panel fdd-sharper" aria-labelledby="fdd-idea-sharper">
        <h2 id="fdd-idea-sharper" className="fdd-label">
          {copy.sharperTitle}
        </h2>
        <p className="fdd-sharper__name">{screening.sharperIdea.name}</p>
        <p className="fd-nextstep__why">{screening.sharperIdea.oneLiner}</p>
        <p className="fdd-muted">
          {copy.sharperWhyLabel}: {screening.sharperIdea.why}
        </p>
      </section>

      <Link href={FONDA_DEMO_PATHS.startProfile} className="fd-btn fd-btn--primary fdd-self-start">
        {copy.continueCta}
      </Link>
    </div>
  );
}
