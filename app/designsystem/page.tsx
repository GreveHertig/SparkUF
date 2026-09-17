"use client";

import type { ReactNode } from "react";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { DataFact } from "@/components/ui/DataFact";
import { DemoDataBadge } from "@/components/ui/DemoDataBadge";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { LockedState } from "@/components/ui/LockedState";
import { Logo } from "@/components/ui/Logo";
import { SourceTag } from "@/components/ui/SourceTag";
import { NextStepCard } from "@/components/spark/NextStepCard";
import { PulseCard } from "@/components/spark/PulseCard";
import { ScoreBadge } from "@/components/spark/ScoreBadge";
import { VerdictCard } from "@/components/spark/VerdictCard";
import { accent, dataTypeColors, motion, radius, scoreColors, slate, spacing } from "@/design/tokens";
import { useI18n } from "@/i18n/context";
import type { Källa } from "@/types/evidence";

const exampleSource: Källa = {
  namn: "Bolagsverket",
  hämtad: "2026-09-14",
  url: "https://www.bolagsverket.se",
};

const exampleSourceWithQuote: Källa = {
  namn: "Kundintervju",
  hämtad: "2026-09-10",
};

const hiasynthSource: Källa = {
  namn: "Hiasynth",
  hämtad: "2026-09-12",
};

const scoreExamples = [15, 40, 60, 78, 92];

export default function DesignsystemPage() {
  const { t } = useI18n();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-12">
      <header className="flex flex-col gap-6 rounded-lg bg-ink-800 p-8">
        <div className="flex items-center justify-between">
          <Logo tone="light" height={22} />
          <LanguageSwitch tone="dark" />
        </div>
        <div>
          <EditorialHeading as="h1" className="text-paper-50">
            {t.designsystem.title}
          </EditorialHeading>
          <p className="mt-2 max-w-xl text-sm text-slate-300">{t.designsystem.intro}</p>
        </div>
      </header>

      <Section eyebrow={t.designsystem.sections.colors}>
        <div className="flex flex-col gap-8">
          <SwatchRow title="Slate 50–950" tones={slate} />
          <SwatchRow title="Accent 50–900" tones={accent} />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
            {Object.entries(scoreColors).map(([name, value]) => (
              <ColorCard key={name} name={`score-${name}`} hex={value.fg} bgHex={value.bg} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {Object.entries(dataTypeColors).map(([name, value]) => (
              <ColorCard key={name} name={`data-${name}`} hex={value.fg} bgHex={value.bg} />
            ))}
          </div>
        </div>
      </Section>

      <Section eyebrow={t.designsystem.sections.typography}>
        <div className="flex flex-col gap-6">
          <EditorialHeading>
            {t.designsystem.typographySample.headingBefore}{" "}
            <EditorialHeading.Em>
              {t.designsystem.typographySample.headingEmphasisOne}
            </EditorialHeading.Em>
            {t.designsystem.typographySample.headingMiddle}{" "}
            <EditorialHeading.Em>
              {t.designsystem.typographySample.headingEmphasisTwo}
            </EditorialHeading.Em>
            {t.designsystem.typographySample.headingAfter}
          </EditorialHeading>
          <p className="max-w-xl text-base text-slate-600">
            {t.designsystem.typographySample.body}
          </p>
          <Eyebrow>{t.demoContent.nextStep.eyebrow}</Eyebrow>
        </div>
      </Section>

      <Section eyebrow={t.designsystem.sections.spacing}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end gap-3">
            {Object.entries(spacing).map(([name, value]) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <div className="bg-accent-200" style={{ width: value, height: value }} />
                <span className="text-xs text-slate-600">{name}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {Object.entries(radius).map(([name, value]) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <div
                  className="h-12 w-12 border border-slate-300 bg-white"
                  style={{ borderRadius: value }}
                />
                <span className="text-xs text-slate-600">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section eyebrow={t.designsystem.sections.motion}>
        <div className="flex flex-col gap-2 text-sm text-slate-600">
          <p>
            fast {motion.fast}ms · base {motion.base}ms · slow {motion.slow}ms · count{" "}
            {motion.count}ms
          </p>
          <p>ScoreBadge nedan visar den räknande animationen (respekterar prefers-reduced-motion).</p>
        </div>
      </Section>

      <Section eyebrow={t.designsystem.sections.components}>
        <div className="flex flex-col gap-12">
          <ComponentDemo title={t.designsystem.components.eyebrow}>
            <Eyebrow>{t.demoContent.nextStep.eyebrow}</Eyebrow>
          </ComponentDemo>

          <ComponentDemo title={t.designsystem.components.sourceTag}>
            <div className="flex flex-wrap items-center gap-3">
              <SourceTag source={exampleSource} dataType="register" />
              <SourceTag
                source={exampleSourceWithQuote}
                dataType="customer"
                quote="Vi betalar redan för tre olika verktyg som gör halva det här."
              />
              {/* Uppdrag 2.2: allt Hiasynth-relaterat är simulering OCH koncept — båda etiketterna krävs. */}
              <SourceTag source={hiasynthSource} dataType="simulation" />
              <ConceptBadge />
            </div>
          </ComponentDemo>

          <ComponentDemo title={t.designsystem.components.dataFact}>
            <DataFact
              label={t.demoContent.marketFact.label}
              value={312}
              unit={t.demoContent.marketFact.unit}
              source={exampleSource}
              dataType="register"
            />
          </ComponentDemo>

          <ComponentDemo title={t.designsystem.components.conceptBadge}>
            <ConceptBadge />
          </ComponentDemo>

          <ComponentDemo title={t.designsystem.components.demoDataBadge}>
            <DemoDataBadge />
          </ComponentDemo>

          <ComponentDemo title={t.designsystem.components.scoreBadge}>
            <div className="flex flex-wrap items-center gap-3">
              {scoreExamples.map((score) => (
                <ScoreBadge key={score} score={score} />
              ))}
            </div>
            <div className="mt-4">
              <ScoreBadge score={54} size="large" />
            </div>
          </ComponentDemo>

          <ComponentDemo title={t.designsystem.components.lockedState}>
            <LockedState unlockHint={t.demoContent.locked.unlocksAfter}>
              <p className="text-sm">{t.demoContent.locked.title}</p>
            </LockedState>
          </ComponentDemo>

          <ComponentDemo title={t.designsystem.components.nextStepCard}>
            <NextStepCard
              eyebrow={t.demoContent.nextStep.eyebrow}
              title={t.demoContent.nextStep.title}
              why={t.demoContent.nextStep.why}
              maxPoints={t.demoContent.nextStep.maxPoints}
              estimatedTime={t.demoContent.nextStep.estimatedTime}
              doneItems={t.demoContent.nextStep.doneItems}
              actionLabel={t.demoContent.nextStep.action}
              className="max-w-md"
            />
          </ComponentDemo>

          <ComponentDemo title={t.designsystem.components.pulseCard}>
            <PulseCard
              category={t.demoContent.pulse.category}
              headline={t.demoContent.pulse.headline}
              whyItMatters={t.demoContent.pulse.whyItMatters}
              timestamp={t.demoContent.pulse.timestamp}
              source={exampleSource}
              className="max-w-md"
            />
          </ComponentDemo>

          <ComponentDemo title={t.designsystem.components.verdictCard}>
            <VerdictCard
              score={54}
              headline={t.demoContent.verdict.headline}
              reasoning={t.demoContent.verdict.reasoning}
              className="max-w-md"
            />
          </ComponentDemo>
        </div>
      </Section>
    </main>
  );
}

function Section({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <Eyebrow>{eyebrow}</Eyebrow>
      {children}
    </section>
  );
}

function ComponentDemo({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {children}
    </div>
  );
}

function SwatchRow({ title, tones }: { title: string; tones: Record<string, string> }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <div className="flex flex-wrap gap-3">
        {Object.entries(tones).map(([name, hex]) => (
          <ColorCard key={name} name={name} hex={hex} />
        ))}
      </div>
    </div>
  );
}

function ColorCard({ name, hex, bgHex }: { name: string; hex: string; bgHex?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-14 w-20 rounded-md border border-slate-200"
        style={{ background: bgHex ?? hex }}
      />
      <span className="text-xs text-slate-600">{name}</span>
      <span className="text-xs text-slate-600">{hex}</span>
    </div>
  );
}
