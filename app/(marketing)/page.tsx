"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { SourceTag } from "@/components/ui/SourceTag";
import { ALL_PART_IDS, SCORE_PART_WEIGHTS } from "@/core/score";
import { useI18n } from "@/i18n/context";
import { formatCount, formatSek } from "@/i18n/format";
import { saraEngine } from "@/adapters/demo/sara";
import {
  demoRegistryProvider,
  saraCompanies,
  SARA_INDUSTRY_LABEL,
  SARA_MARKET_SNI_CODE,
} from "@/adapters/demo/RegistryProvider";
import type { MarketOverview } from "@/ports/RegistryProvider";
import { DemoLink } from "./_components/DemoLink";
import { EmailSignup } from "./_components/EmailSignup";
import { ScoreProof } from "./_components/ScoreProof";
import { fill } from "@/i18n/fill";

// Stegen grupperade i resans fyra faser, samma indelning som startsidan.
// Titlar och beskrivningar kommer ur i18n (journeySteps, journeyPage).
const STEP_KEYS = [
  "step1", "step2", "step3", "step4", "step5", "step6",
  "step7", "step8", "step9", "step10", "step11", "step12",
] as const;

const PHASES = [
  { key: "discover", from: 1, to: 2 },
  { key: "tryPhase", from: 3, to: 6 },
  { key: "launch", from: 7, to: 10 },
  { key: "grow", from: 11, to: 12 },
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

/** Rubrik i två delar: rak text och en kursiv fortsättning. */
function Title({
  as: Tag = "h2",
  start,
  em,
  id,
  emOnOwnLine = false,
}: {
  as?: "h1" | "h2";
  start: string;
  em: string;
  id?: string;
  emOnOwnLine?: boolean;
}) {
  return (
    <Tag id={id} className={Tag === "h1" ? "fd-h1" : "fd-h2"}>
      {start} <em className={emOnOwnLine ? "fd-em fd-em--block" : "fd-em"}>{em}</em>
    </Tag>
  );
}

function Section({
  id,
  tone = "paper",
  labelledBy,
  children,
}: {
  id?: string;
  tone?: "paper" | "white";
  labelledBy: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`fd-section fd-section--${tone}`}>
      <div className="fd-wrap">{children}</div>
    </section>
  );
}

export default function FondaLandingPage() {
  const { t, locale } = useI18n();
  const copy = t.site;

  const [market, setMarket] = useState<MarketOverview | null>(null);
  useEffect(() => {
    let cancelled = false;
    demoRegistryProvider.getMarketOverview(locale).then((overview) => {
      if (!cancelled) setMarket(overview);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  // Medgrundarens kort: det riktiga demots nästa steg efter Domen (steg 06).
  const verdictBeat = saraEngine.findLatestBeatIndexForStep(6, saraEngine.beats.length - 1) ?? 0;
  const nextStep = saraEngine.getJourneySummaryForBeat(verdictBeat, locale).nextStep;
  const sampleCompanies = saraCompanies.slice(0, 3);

  return (
    <div className="fd">
      <header className="fd-nav">
        <div className="fd-nav__inner">
          <a href="#top" aria-label={copy.nav.home} className="fd-nav__logo">
            <Logo height={18} />
          </a>
          <nav aria-label={copy.nav.label} className="fd-nav__links">
            <a href="#resan">{copy.nav.journey}</a>
            <a href="#registret">{copy.nav.registry}</a>
            <a href="#poangen">{copy.nav.score}</a>
            <a href="#pris">{copy.nav.price}</a>
          </nav>
          <div className="fd-nav__actions">
            <LanguageSwitch />
            <DemoLink compact className="fd-btn--sm" />
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section id="top" aria-labelledby="fd-hero-title" className="fd-hero">
          <div className="fd-wrap">
            <div className="fd-hero__copy">
              <Title as="h1" id="fd-hero-title" start={copy.hero.titleStart} em={copy.hero.titleEm} />
              <p className="fd-lede fd-hero__lede">{copy.hero.lede}</p>
              <div className="fd-hero__ctas">
                <DemoLink />
                <a href="#besked" className="fd-btn fd-btn--secondary">
                  {copy.notifyLink}
                </a>
              </div>
            </div>
            <div className="fd-hero__proof">
              <ScoreProof />
            </div>
          </div>
        </section>

        {/* Resan */}
        <Section id="resan" labelledBy="fd-journey-title" tone="white">
          <div className="fd-head">
            <Title id="fd-journey-title" start={copy.journey.titleStart} em={copy.journey.titleEm} />
            <p className="fd-lede">{copy.journey.lede}</p>
          </div>

          <div className="fd-journey">
            <ol className="fd-stepper" aria-label={copy.journey.stepsListLabel}>
              {STEP_KEYS.map((key, index) => (
                <li key={key} className="fd-stepper__item">
                  <span className="fd-stepper__num">{pad(index + 1)}</span>
                  <span className="fd-stepper__title">{t.journeySteps[key].title}</span>
                </li>
              ))}
            </ol>

            <div className="fd-phases">
              {PHASES.map((phase) => (
                <div key={phase.key} className="fd-phase">
                  <p className="fd-phase__meta">
                    <span className="fd-phase__name">{t.journeyPage.phaseNames[phase.key]}</span>
                    <span className="fd-phase__range">
                      {fill(copy.journey.phaseSteps, { from: pad(phase.from), to: pad(phase.to) })}
                    </span>
                  </p>
                  <ul className="fd-phase__steps">
                    {STEP_KEYS.slice(phase.from - 1, phase.to).map((key) => (
                      <li key={key}>
                        <span className="fd-phase__steptitle">{t.journeySteps[key].title}</span>
                        <span className="fd-phase__stepline">{t.journeySteps[key].oneLiner}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Registret */}
        <Section id="registret" labelledBy="fd-registry-title">
          <div className="fd-split">
            <div className="fd-split__text">
              <Title id="fd-registry-title" start={copy.registry.titleStart} em={copy.registry.titleEm} />
              <p className="fd-lede">{copy.registry.body}</p>
              <ul className="fd-checks">
                {copy.registry.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>

            <figure className="fd-panel fd-register">
              <div className="fd-register__head">
                <div>
                  <p className="fd-register__title">{SARA_INDUSTRY_LABEL[locale]}</p>
                  <p className="fd-register__sni">{fill(copy.registry.cardSni, { code: SARA_MARKET_SNI_CODE })}</p>
                </div>
                <span className="fd-pill fd-pill--fiction">{copy.proof.fictional}</span>
              </div>

              {market && (
                <>
                  <dl className="fd-register__facts">
                    <div>
                      <dt>{copy.registry.companies}</dt>
                      <dd>{formatCount(market.companyCount, locale)}</dd>
                    </div>
                    <div>
                      <dt>{copy.registry.median}</dt>
                      <dd>{formatSek(market.medianRevenueKsek * 1000, locale)}</dd>
                    </div>
                    <div>
                      <dt>{copy.registry.growth}</dt>
                      <dd>{market.growthSharePercent} %</dd>
                    </div>
                  </dl>
                  <div className="fd-register__source">
                    <SourceTag source={market.source} dataType="register" />
                  </div>
                  {market.basis && (
                    <p className="fd-register__basis">
                      {fill(copy.registry.basis, {
                        median: formatCount(market.basis.medianRevenueCompanies, locale),
                        growth: formatCount(market.basis.growthCompanies, locale),
                        total: formatCount(market.companyCount, locale),
                      })}
                    </p>
                  )}
                </>
              )}

              <div className="fd-register__list">
                <p className="fd-register__listtitle">{copy.registry.sampleTitle}</p>
                <ul>
                  {sampleCompanies.map((company) => (
                    <li key={company.name}>
                      <span>{company.name}</span>
                      <span className="fd-register__meta">
                        {company.employees} {copy.registry.employeesUnit}, {company.county}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <figcaption className="fd-note">{copy.registry.fictionalNote}</figcaption>
            </figure>
          </div>
        </Section>

        {/* Poängen */}
        <Section id="poangen" labelledBy="fd-score-title" tone="white">
          <div className="fd-head fd-head--center">
            <Title id="fd-score-title" start={copy.score.titleStart} em={copy.score.titleEm} emOnOwnLine />
            <p className="fd-lede">{copy.score.lede}</p>
          </div>

          <div className="fd-weights">
            <p className="fd-weights__label">{copy.score.weightsLabel}</p>
            <ol
              className="fd-weights__list"
              style={{ ["--cols" as string]: ALL_PART_IDS.map((id) => `${SCORE_PART_WEIGHTS[id]}fr`).join(" ") }}
            >
              {ALL_PART_IDS.map((id) => (
                <li
                  key={id}
                  className="fd-weight"
                  style={{ ["--share" as string]: `${(SCORE_PART_WEIGHTS[id] / 18) * 100}%` }}
                >
                  <span className="fd-weight__bar" aria-hidden="true" />
                  <span className="fd-weight__name">{t.score.parts[id]}</span>
                  <span className="fd-weight__value">{SCORE_PART_WEIGHTS[id]}</span>
                </li>
              ))}
            </ol>
          </div>

          <ul className="fd-rules">
            {copy.score.rules.map((rule) => (
              <li key={rule.title}>
                <p className="fd-rules__title">{rule.title}</p>
                <p className="fd-rules__body">{rule.body}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Medgrundaren */}
        <Section labelledBy="fd-cofounder-title">
          <div className="fd-split fd-split--reverse">
            <div className="fd-split__text">
              <Title id="fd-cofounder-title" start={copy.cofounder.titleStart} em={copy.cofounder.titleEm} />
              <p className="fd-lede">{copy.cofounder.body}</p>
            </div>

            <figure className="fd-panel fd-nextstep">
              <div className="fd-nextstep__head">
                <p className="fd-nextstep__label">{copy.cofounder.cardLabel}</p>
                <span className="fd-pill fd-pill--fiction">{copy.proof.fictional}</span>
              </div>
              <p className="fd-nextstep__eyebrow">{nextStep.eyebrow}</p>
              <p className="fd-nextstep__title">{nextStep.title}</p>
              <p className="fd-nextstep__why">{nextStep.why}</p>
              {nextStep.doneItems.length > 0 && (
                <div className="fd-nextstep__done">
                  <p>{copy.cofounder.doneLabel}</p>
                  <ul className="fd-checks fd-checks--small">
                    {nextStep.doneItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="fd-nextstep__foot">
                <span className="fd-nextstep__action">{nextStep.actionLabel}</span>
                <span className="fd-nextstep__points">
                  {fill(copy.cofounder.pointsTemplate, { points: nextStep.maxPoints })}
                </span>
              </div>
              <figcaption className="fd-note">{copy.cofounder.fictionalNote}</figcaption>
            </figure>
          </div>
        </Section>

        {/* Pris */}
        <Section id="pris" labelledBy="fd-price-title" tone="white">
          <div className="fd-head fd-head--center">
            <Title id="fd-price-title" start={copy.price.titleStart} em={copy.price.titleEm} />
          </div>
          <div className="fd-price">
            <p className="fd-price__name">{copy.price.name}</p>
            <p className="fd-price__amount">
              {copy.price.amount}
              <span>{copy.price.unit}</span>
            </p>
            <p className="fd-price__desc">{copy.price.description}</p>
            <ul className="fd-checks fd-checks--dark">
              {copy.price.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <p className="fd-price__excluded">{copy.price.excluded}</p>
            <a href="#besked" className="fd-btn fd-btn--light">
              {copy.notifyLink}
            </a>
            <p className="fd-price__note">{copy.price.note}</p>
          </div>
        </Section>

        {/* Avslut */}
        <Section id="besked" labelledBy="fd-close-title">
          <div className="fd-close">
            <Title id="fd-close-title" start={copy.close.titleStart} em={copy.close.titleEm} emOnOwnLine />
            <p className="fd-lede">{copy.close.body}</p>
            <EmailSignup />
            <DemoLink className="fd-close__demo" />
          </div>
        </Section>
      </main>

      <footer className="fd-footer">
        <div className="fd-wrap fd-footer__inner">
          <Logo height={16} />
          <p>{copy.footer.note}</p>
          <LanguageSwitch />
        </div>
      </footer>
    </div>
  );
}
