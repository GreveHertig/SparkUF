"use client";

import Link from "next/link";
import { JOURNEY_STEP_META, type UiJourneyPhaseId } from "@/core/journey";
import type { Dictionary } from "@/i18n/dictionary";
import { useI18n, type Locale } from "@/i18n/context";
import { FreeSignup } from "./FreeSignup";

const PHASES: readonly UiJourneyPhaseId[] = ["discover", "tryPhase", "launch", "grow"];
const LOCALES: readonly Locale[] = ["sv", "en"];

function stepKey(stepNumber: number) {
  return `step${stepNumber}` as keyof Dictionary["journeySteps"];
}

export default function FreeLandingPage() {
  const { t, locale, setLocale } = useI18n();
  const copy = t.experimentFree;
  // Priset ägs av /priser (docs/uppdrag.md avsnitt 6, Grundare).
  const plan = t.pricingPage.founder;

  return (
    <div className="fri">
      <header className="fri-wrap fri-nav">
        <Link href="/experiment/fri" className="fri-mark" aria-label={copy.nav.home}>
          Spark
        </Link>
        <nav className="fri-nav-links" aria-label={copy.nav.home}>
          <a href="#resan">{copy.nav.journey}</a>
          <a href="#underlaget">{copy.nav.sources}</a>
          <a href="#pris">{copy.nav.price}</a>
        </nav>
        <Link href="/demo" className="fri-demo-link" aria-describedby="fri-demo-tag">
          {copy.nav.demo}
          <span id="fri-demo-tag" className="fri-tag">
            {copy.nav.demoTag}
          </span>
        </Link>
      </header>

      <main style={{ flex: 1 }}>
        {/* Hero: löftet som affisch, och ett exempel på hur Spark svarar. */}
        <section className="fri-wrap fri-hero">
          <h1 className="fri-display fri-h1">
            <span className="line">
              <span>{copy.hero.titleA}</span>
            </span>
            <span className="line">
              <span>
                {copy.hero.titleB}
                <span className="fri-dot">.</span>
              </span>
            </span>
          </h1>

          <div className="fri-hero-grid">
            <div className="fri-reveal">
              <p className="fri-lead" style={{ color: "var(--ink)" }}>
                {copy.hero.lead}
              </p>
              <div className="fri-ctas">
                <Link href="/demo" className="fri-btn fri-btn-signal" aria-describedby="fri-demo-note">
                  {copy.hero.demoCta}
                </Link>
                <a href="#besked" className="fri-btn fri-btn-ghost">
                  {copy.hero.signupCta}
                </a>
              </div>
              <p className="fri-demo-note">
                <span id="fri-demo-note" className="fri-tag">
                  {copy.hero.demoNote}
                </span>
              </p>
            </div>

            <figure className="fri-card fri-reveal-late" aria-label={copy.example.label}>
              <div className="fri-card-head">
                <span className="fri-mono">{copy.example.label}</span>
                <span className="fri-mark" style={{ fontSize: "1.05rem" }} aria-hidden="true">
                  Spark
                </span>
              </div>
              <p className="fri-msg-you">
                <span className="who">{copy.example.you}</span>
                {copy.example.question}
              </p>
              <div className="fri-msg-spark">
                <span className="who">Spark</span>
                <p>{copy.example.answer}</p>
                <div className="fri-stamps">
                  <span className="fri-stamp">Bolagsverket</span>
                  <span className="fri-stamp">SCB</span>
                </div>
              </div>
              <div className="fri-card-foot">
                <span style={{ color: "var(--muted)" }}>{copy.example.next}</span>
                <span className="step">
                  <span className="fri-mono" style={{ color: "var(--signal-ink)" }}>
                    03
                  </span>
                  {t.journeySteps.step3.title}
                </span>
              </div>
            </figure>
          </div>
        </section>

        {/* Resan: tolv steg, skenan fylls medan man läser. */}
        <section id="resan" className="fri-section">
          <div className="fri-wrap fri-journey">
            <div className="fri-journey-intro">
              <h2 className="fri-h2">{copy.journey.title}</h2>
              <p className="fri-lead" style={{ marginTop: 24 }}>
                {copy.journey.lead}
              </p>
            </div>
            <div className="fri-steps">
              <span className="fri-rail" aria-hidden="true" />
              <span className="fri-rail-fill" aria-hidden="true" />
              {PHASES.map((phase) => (
                <div key={phase} className="fri-phase">
                  <h3 className="fri-phase-name">{t.journeyPage.phaseNames[phase]}</h3>
                  <p className="fri-phase-desc">{copy.journey.phases[phase]}</p>
                  <ol className="fri-step-list">
                    {JOURNEY_STEP_META.filter((meta) => meta.journeyPhase === phase).map((meta) => (
                      <li key={meta.stepNumber} className="fri-step">
                        <span className="num" aria-label={`${copy.journey.stepLabel} ${meta.stepNumber}`}>
                          {String(meta.stepNumber).padStart(2, "0")}
                        </span>
                        <span className="title">{t.journeySteps[stepKey(meta.stepNumber)].title}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Underlaget: den mörka ytan, källorna som typografi. */}
        <section id="underlaget" className="fri-dark on-dark">
          <div className="fri-wrap" style={{ paddingBlock: "clamp(96px, 12vw, 176px)" }}>
            <h2 className="fri-h2" style={{ maxWidth: "14ch" }}>
              {copy.sources.title}
            </h2>
            <p className="fri-lead" style={{ marginTop: 24, maxWidth: "52ch" }}>
              {copy.sources.lead}
            </p>
            <div className="fri-sources">
              <div className="fri-source">
                <h3 className="fri-source-name">Bolagsverket</h3>
                <p className="fri-source-desc">{copy.sources.bolagsverket}</p>
              </div>
              <div className="fri-source">
                <h3 className="fri-source-name">SCB</h3>
                <p className="fri-source-desc">{copy.sources.scb}</p>
              </div>
            </div>
            <div className="fri-stamp-row">
              <span className="fri-stamp">Bolagsverket</span>
              <span className="fri-stamp" style={{ ["--rot" as string]: "1.5deg" }}>
                SCB
              </span>
              <span>{copy.sources.stampNote}</span>
            </div>
          </div>
        </section>

        {/* Medgrundaren: tre påståenden som en trappa. */}
        <section className="fri-wrap" style={{ paddingBlock: "clamp(96px, 12vw, 176px)" }}>
          <h2 className="fri-h2" style={{ maxWidth: "16ch" }}>
            {copy.cofounder.title}
          </h2>
          <div className="fri-stair">
            {(["straight", "memory", "score"] as const).map((item) => (
              <div key={item} className="fri-stair-item">
                <p className="fri-stair-title">{copy.cofounder.items[item].title}</p>
                <p className="fri-stair-body">{copy.cofounder.items[item].body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pris och mejl: signalytan. */}
        <section id="pris" className="fri-signal on-signal">
          <div className="fri-wrap fri-close" style={{ paddingBlock: "clamp(88px, 10vw, 144px)" }}>
            <div>
              <p className="fri-mono">{plan.name}</p>
              <p className="fri-price" style={{ marginTop: 14 }}>
                {plan.price}
                <small>{plan.priceUnit}</small>
              </p>
              <p style={{ marginTop: 24, fontSize: "1.1rem", maxWidth: "34ch" }}>{copy.price.lead}</p>
              <Link href="/priser" style={{ display: "inline-block", marginTop: 10, textDecoration: "underline" }}>
                {copy.price.allPlans}
              </Link>
            </div>
            <div id="besked" style={{ scrollMarginTop: 24 }}>
              <h2 className="fri-h2" style={{ fontSize: "clamp(2rem, 1.3rem + 2.2vw, 3.2rem)", marginBottom: 28 }}>
                {copy.signup.title}
              </h2>
              <FreeSignup />
            </div>
          </div>
        </section>
      </main>

      <footer className="fri-wrap fri-footer">
        <span className="fri-mark" style={{ fontSize: "1.25rem", color: "var(--ink)" }}>
          Spark
        </span>
        <div>
          <p>{copy.footer.experiment}</p>
          <p>{copy.footer.fiction}</p>
        </div>
        <div role="group" aria-label={copy.nav.language} className="fri-lang">
          {LOCALES.map((option) => (
            <button key={option} type="button" aria-pressed={locale === option} onClick={() => setLocale(option)}>
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
