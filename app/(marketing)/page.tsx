"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { DataFact } from "@/components/ui/DataFact";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { NextStepCard } from "@/components/spark/NextStepCard";
import { ToolRunCard } from "@/components/spark/ToolRunCard";
import { ChatMessage } from "@/components/spark/ChatMessage";
import { PulseCard } from "@/components/spark/PulseCard";
import { VerdictCard } from "@/components/spark/VerdictCard";
import { LegalMap } from "@/components/spark/LegalMap";
import { SimulationCard } from "@/components/spark/SimulationCard";
import { useI18n } from "@/i18n/context";
import { formatSek } from "@/i18n/format";
import type { JuridisktKrav } from "@/core/domain";
import { WaitlistForm } from "./WaitlistForm";

// Stegen grupperade i faserna (uppdrag 1.5) — bara för layout här, titlarna
// kommer alltid ur `journeySteps`/`journeyPage.phaseNames`, aldrig hårdkodade.
const STEP_KEYS = [
  "step1", "step2", "step3", "step4", "step5", "step6",
  "step7", "step8", "step9", "step10", "step11", "step12",
] as const;

const JOURNEY_PHASES = [
  { key: "discover", stepIndexes: [0, 1] },
  { key: "tryPhase", stepIndexes: [2, 3, 4, 5] },
  { key: "launch", stepIndexes: [6, 7, 8, 9] },
  { key: "grow", stepIndexes: [10, 11] },
] as const;

function FeatureCard({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
      <div>
        <p className="text-xl text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-snug text-slate-600">{body}</p>
      </div>
      {children}
    </div>
  );
}

export default function LandningPage() {
  const { t, locale } = useI18n();

  const legalItems: JuridisktKrav[] = [
    {
      id: "f-skatt",
      rubrik: t.landingPage.legal.sampleItems.item1.rubrik,
      beskrivning: t.landingPage.legal.sampleItems.item1.beskrivning,
      gällerFör: ["aktiebolag", "enskild_firma"],
      källa: { namn: "Skatteverket", hämtad: "2026-09-10", url: "https://www.skatteverket.se" },
      status: "ej_uppfyllt",
    },
    {
      id: "pub-avtal",
      rubrik: t.landingPage.legal.sampleItems.item2.rubrik,
      beskrivning: t.landingPage.legal.sampleItems.item2.beskrivning,
      gällerFör: ["aktiebolag", "enskild_firma"],
      källa: { namn: "Integritetsskyddsmyndigheten (IMY)", hämtad: "2026-09-10", url: "https://www.imy.se" },
      status: "uppfyllt",
    },
  ];

  const hiasynthSimulation = {
    question: t.landingPage.concepts.hiasynth.question,
    populationSize: 4200,
    source: { namn: locale === "sv" ? "Hiasynth (koncept)" : "Hiasynth (concept)", hämtad: "2026-09-01" },
    result: t.landingPage.concepts.hiasynth.result,
    uncertaintyRangeLabel: t.landingPage.concepts.hiasynth.uncertaintyRangeLabel,
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-ink-800 px-6 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Eyebrow tone="light">{t.landingPage.hero.eyebrow}</Eyebrow>
            <EditorialHeading as="h1" className="mt-3 text-5xl leading-[1.05] text-paper-50 sm:text-6xl">
              {t.landingPage.hero.headingBefore}{" "}
              <EditorialHeading.Em>{t.landingPage.hero.headingEmphasis}</EditorialHeading.Em>{" "}
              {t.landingPage.hero.headingAfter}
            </EditorialHeading>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-300">{t.landingPage.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/demo"
                className="rounded-full bg-accent-600 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t.landingPage.hero.startDemoCta}
              </Link>
              <Link
                href="/skapa-konto"
                className="rounded-full border border-slate-500 px-6 py-3 text-sm font-semibold text-paper-50 transition-colors hover:border-slate-300"
              >
                {t.landingPage.hero.createAccountCta}
              </Link>
            </div>
            <WaitlistForm className="mt-8 max-w-md" />
          </div>
          <NextStepCard
            eyebrow={t.landingPage.hero.productCard.eyebrow}
            title={t.landingPage.hero.productCard.title}
            why={t.landingPage.hero.productCard.why}
            maxPoints={t.landingPage.hero.productCard.maxPoints}
            estimatedTime={t.landingPage.hero.productCard.estimatedTime}
            doneItems={t.landingPage.hero.productCard.doneItems}
            actionLabel={t.landingPage.hero.productCard.action}
            className="shadow-xl"
          />
        </div>
      </section>

      {/* 1. Problemet */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Eyebrow>{t.landingPage.problem.eyebrow}</Eyebrow>
        <EditorialHeading as="h2" className="mt-3 text-3xl sm:text-4xl">
          {t.landingPage.problem.title}
        </EditorialHeading>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">{t.landingPage.problem.body}</p>
      </section>

      {/* 2. Datalöftet */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>{t.landingPage.dataPromise.eyebrow}</Eyebrow>
            <EditorialHeading as="h2" className="mt-3 text-3xl sm:text-4xl">
              {t.landingPage.dataPromise.title}
            </EditorialHeading>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{t.landingPage.dataPromise.body}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <DataFact
              label={t.landingPage.dataPromise.companyCountLabel}
              value={312}
              source={{ namn: "Bolagsverket", hämtad: "2026-09-14", url: "https://bolagsverket.se" }}
              className="rounded-lg border border-slate-200 p-4"
            />
            <DataFact
              label={t.landingPage.dataPromise.medianRevenueLabel}
              value={formatSek(4_200_000, locale)}
              source={{ namn: "SCB", hämtad: "2026-09-14" }}
              className="rounded-lg border border-slate-200 p-4"
            />
            <DataFact
              label={t.landingPage.dataPromise.growthShareLabel}
              value={18}
              unit="%"
              source={{ namn: "SCB", hämtad: "2026-09-14" }}
              className="rounded-lg border border-slate-200 p-4"
            />
          </div>
        </div>
      </section>

      {/* 3. Resan i rutnät */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <Eyebrow>{t.landingPage.journey.eyebrow}</Eyebrow>
            <EditorialHeading as="h2" className="mt-3 text-3xl sm:text-4xl">
              {t.landingPage.journey.title}
            </EditorialHeading>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{t.landingPage.journey.subtitle}</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY_PHASES.map((phase) => (
              <div key={phase.key} className="flex flex-col gap-3">
                <p
                  className="text-xs font-semibold uppercase text-accent-700"
                  style={{ letterSpacing: "var(--tracking-label)" }}
                >
                  {t.journeyPage.phaseNames[phase.key]}
                </p>
                <p className="text-sm italic text-slate-500">&ldquo;{t.landingPage.journey.phaseQuotes[phase.key]}&rdquo;</p>
                <ul className="flex flex-col gap-2">
                  {phase.stepIndexes.map((index) => {
                    const step = t.journeySteps[STEP_KEYS[index]];
                    return (
                      <li key={index} className="rounded-md border border-slate-200 bg-white p-3">
                        <p className="font-numeric text-xs text-slate-400">{String(index + 1).padStart(2, "0")}</p>
                        <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Fyra saker Medgrundaren gör */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <Eyebrow>{t.landingPage.cofounder.eyebrow}</Eyebrow>
            <EditorialHeading as="h2" className="mt-3 text-3xl sm:text-4xl">
              {t.landingPage.cofounder.title}
            </EditorialHeading>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{t.landingPage.cofounder.subtitle}</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FeatureCard title={t.landingPage.cofounder.nextStep.title} body={t.landingPage.cofounder.nextStep.body}>
              <div className="flex items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3.5">
                <Eyebrow>{t.landingPage.hero.productCard.eyebrow}</Eyebrow>
                <span className="text-sm font-medium text-accent-700">
                  {t.common.upToPointsBefore} <span className="font-numeric">{t.landingPage.hero.productCard.maxPoints}</span>{" "}
                  {t.common.upToPointsAfter} · <span className="font-numeric">{t.landingPage.hero.productCard.estimatedTime}</span>
                </span>
              </div>
            </FeatureCard>
            <FeatureCard title={t.landingPage.cofounder.toolRun.title} body={t.landingPage.cofounder.toolRun.body}>
              <ToolRunCard label={t.landingPage.cofounder.toolRun.label} steps={t.landingPage.cofounder.toolRun.steps} />
            </FeatureCard>
            <FeatureCard title={t.landingPage.cofounder.honesty.title} body={t.landingPage.cofounder.honesty.body}>
              <div className="flex flex-col gap-2">
                <ChatMessage role="founder" text={t.landingPage.cofounder.honesty.founderLine} />
                <ChatMessage role="cofounder" text={t.landingPage.cofounder.honesty.cofounderLine} />
              </div>
            </FeatureCard>
            <FeatureCard title={t.landingPage.cofounder.pulse.title} body={t.landingPage.cofounder.pulse.body}>
              <PulseCard
                category={t.landingPage.cofounder.pulse.category}
                headline={t.landingPage.cofounder.pulse.headline}
                whyItMatters={t.landingPage.cofounder.pulse.whyItMatters}
                timestamp={t.landingPage.cofounder.pulse.timestamp}
                source={{ namn: "Bolagsverket", hämtad: "2026-09-19" }}
              />
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* 5. Poängen som mäter bevis */}
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>{t.landingPage.score.eyebrow}</Eyebrow>
            <EditorialHeading as="h2" className="mt-3 text-3xl sm:text-4xl">
              {t.landingPage.score.title}
            </EditorialHeading>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{t.landingPage.score.body}</p>
          </div>
          <VerdictCard
            score={54}
            headline={t.landingPage.score.verdictHeadline}
            reasoning={t.landingPage.score.verdictReasoning}
          />
        </div>
      </section>

      {/* 6. Juridisk koll */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>{t.landingPage.legal.eyebrow}</Eyebrow>
            <EditorialHeading as="h2" className="mt-3 text-3xl sm:text-4xl">
              {t.landingPage.legal.title}
            </EditorialHeading>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{t.landingPage.legal.body}</p>
            <p className="mt-4 text-sm text-slate-500">{t.legalPage.disclaimer}</p>
          </div>
          <LegalMap krav={legalItems} />
        </div>
      </section>

      {/* 7. Minnet som chattutdrag */}
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>{t.landingPage.memory.eyebrow}</Eyebrow>
            <EditorialHeading as="h2" className="mt-3 text-3xl sm:text-4xl">
              {t.landingPage.memory.title}
            </EditorialHeading>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{t.landingPage.memory.body}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-5">
            <ChatMessage role="founder" text={t.landingPage.memory.founderLine} />
            <ChatMessage role="cofounder" text={t.landingPage.memory.cofounderLine} />
          </div>
        </div>
      </section>

      {/* 8. Koncept på väg: Hiasynth och Lovable */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <Eyebrow>{t.landingPage.concepts.eyebrow}</Eyebrow>
            <EditorialHeading as="h2" className="mt-3 text-3xl sm:text-4xl">
              {t.landingPage.concepts.title}
            </EditorialHeading>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{t.landingPage.concepts.body}</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FeatureCard title={t.landingPage.concepts.hiasynth.title} body={t.landingPage.concepts.hiasynth.body}>
              <SimulationCard simulation={hiasynthSimulation} />
            </FeatureCard>
            <FeatureCard title={t.landingPage.concepts.lovable.title} body={t.landingPage.concepts.lovable.body}>
              <div className="flex flex-col gap-3">
                <ConceptBadge />
                <ToolRunCard label={t.landingPage.concepts.lovable.creditsLabel} steps={t.landingPage.concepts.lovable.buildSteps} />
              </div>
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* 9. Priser, FAQ och avslutande uppmaning */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 text-center">
          <Eyebrow>{t.landingPage.pricingTeaser.eyebrow}</Eyebrow>
          <EditorialHeading as="h2" className="mt-3 text-3xl">
            {t.landingPage.pricingTeaser.title}
          </EditorialHeading>
          <p className="mt-3 text-base leading-relaxed text-slate-600">{t.landingPage.pricingTeaser.body}</p>
          <Link
            href="/priser"
            className="mt-6 inline-flex items-center gap-1 rounded-full bg-accent-600 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t.landingPage.pricingTeaser.cta}
          </Link>
        </div>
      </section>

      <section id="faq" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <Eyebrow>{t.landingPage.faq.eyebrow}</Eyebrow>
            <EditorialHeading as="h2" className="mt-3 text-3xl">
              {t.landingPage.faq.title}
            </EditorialHeading>
          </div>
          <dl className="mt-10 flex flex-col gap-6">
            {[
              t.landingPage.faq.q1,
              t.landingPage.faq.q2,
              t.landingPage.faq.q3,
              t.landingPage.faq.q4,
              t.landingPage.faq.q5,
            ].map((item) => (
              <div key={item.question} className="border-b border-slate-200 pb-6">
                <dt className="text-base font-semibold text-slate-900">{item.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-ink-800 px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <EditorialHeading as="h2" className="text-3xl text-paper-50 sm:text-4xl">
            {t.landingPage.finalCta.title}
          </EditorialHeading>
          <p className="mt-4 text-lg text-slate-300">{t.landingPage.finalCta.body}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/demo"
              className="rounded-full bg-accent-600 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t.landingPage.finalCta.startDemoCta}
            </Link>
            <Link
              href="/skapa-konto"
              className="rounded-full border border-slate-500 px-6 py-3 text-sm font-semibold text-paper-50 transition-colors hover:border-slate-300"
            >
              {t.landingPage.finalCta.createAccountCta}
            </Link>
          </div>
          <WaitlistForm className="mx-auto mt-10 max-w-md" />
        </div>
      </section>
    </>
  );
}
