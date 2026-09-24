"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { formatCount } from "@/i18n/format";
import type { IdeaScreening } from "@/ports/ProjectRepository";
import { demoProjectRepository } from "@/adapters/demo/ProjectRepository";
import { FriSource } from "../../_components/FriSource";
import { FriChat, FriStatus } from "../../_components/FriParts";
import { FRI_DEMO_START } from "../../_lib/friPaths";

/** Idégenomgången i kopian (= /demo/start/ide, screens/OnboardingIdea). */
export default function FriStartIdeaPage() {
  const { t, locale } = useI18n();
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
  const idea = t.onboarding.idea;

  return (
    <div className="fri-start-narrow">
      <p className="fri-mono fri-muted">{idea.eyebrow}</p>
      <h1 className="fri-h1-demo" style={{ marginTop: 14 }}>
        {idea.title}
      </h1>

      <section style={{ marginTop: 40 }}>
        <p className="fri-mono fri-muted">{idea.founderIntroLabel}</p>
        <div style={{ marginTop: 12 }}>
          <FriChat role="founder" text={screening.originalIdea} />
        </div>
      </section>

      <section className="fri-section-demo">
        <h2 className="fri-h2-demo">{idea.assumptionsTitle}</h2>
        <ul className="fri-row-list" style={{ marginTop: 12 }}>
          {screening.assumptions.map((assumption) => (
            <li key={assumption.text}>
              <span>{assumption.text}</span>
              <FriStatus tone={assumption.testableNow ? "signal" : "muted"}>
                {assumption.testableNow ? idea.testableLabel : idea.notTestableYetLabel}
              </FriStatus>
            </li>
          ))}
        </ul>
      </section>

      <section className="fri-section-demo">
        <h2 className="fri-h2-demo">{idea.registerTitle}</h2>
        <dl className="fri-facts">
          {screening.registerFacts.map((fact) => (
            <div key={fact.label} className="fri-ruled">
              <dt className="fri-muted">{fact.label}</dt>
              <dd className="fri-fact-num">{typeof fact.value === "number" ? formatCount(fact.value, locale) : fact.value}</dd>
              <dd style={{ marginTop: 12 }}>
                <FriSource source={fact.source} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="fri-section-demo">
        <h2 className="fri-h2-demo">{idea.weaknessTitle}</h2>
        <div style={{ marginTop: 16 }}>
          <FriChat role="cofounder" text={screening.weakness} />
        </div>
      </section>

      <section className="fri-section-demo">
        <h2 className="fri-h2-demo">{idea.sharperTitle}</h2>
        <div className="fri-score-card" style={{ marginTop: 20 }}>
          <p style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "2rem", letterSpacing: "-0.035em", lineHeight: 1 }}>
            {screening.sharperIdea.name}
          </p>
          <p style={{ marginTop: 10 }}>{screening.sharperIdea.oneLiner}</p>
          <p className="fri-muted" style={{ marginTop: 12 }}>
            <span style={{ color: "var(--ink)", fontWeight: 540 }}>{idea.sharperWhyLabel}: </span>
            {screening.sharperIdea.why}
          </p>
        </div>
      </section>

      <Link href={`${FRI_DEMO_START}/profil`} className="fri-btn fri-btn-signal" style={{ marginTop: 44 }}>
        {idea.continueCta}
      </Link>
    </div>
  );
}
