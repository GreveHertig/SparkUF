"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import {
  BUSINESS_PLAN_SECTION_ORDER,
  nextPlanStep,
  type BusinessPlan as BusinessPlanModel,
  type BusinessPlanClaim,
  type BusinessPlanSection,
  type BusinessPlanSectionId,
  type BusinessPlanStatus,
} from "@/core/businessPlan";
import { mentionsConcept } from "@/core/concepts";
import type { JourneyStepStatus } from "@/ports/JourneyRepository";
import { PageHead, Pill, type PillTone } from "./blocks/PageBlocks";

/** Ett steg i resan, som planen behöver det: namnet och läget. */
export type BusinessPlanStep = { stepNumber: number; title: string; status: JourneyStepStatus };

/**
 * `null` betyder att planen inte kan sättas samman (ett platshållarfel i
 * hopsamlingen): varje avsnitt visar sin rubrik och "Kommer snart", och
 * mognaden visas som luckan "—", aldrig som 0.
 *
 * `completedStepNumbers` är stegen som är klara. En lucka från ett klart steg
 * säger det, i stället för att underlaget "kommer från" steget (PR 11).
 *
 * `steps` och `stepBasePath` ger luckorna och nästa-steg-kortet stegets namn
 * och en länk dit. Utan dem visas bara stegnumret.
 */
export type BusinessPlanData = {
  plan: BusinessPlanModel | null;
  completedStepNumbers?: readonly number[];
  steps?: readonly BusinessPlanStep[] | null;
  stepBasePath?: string | null;
};

const statusTone: Record<BusinessPlanStatus, PillTone> = {
  solid: "green",
  thin: "yellow",
  missing: "neutral",
};

const sectionAnchor = (id: BusinessPlanSectionId) => `fdd-plan-${id}`;
const padStep = (stepNumber: number) => String(stepNumber).padStart(2, "0");

/** Ett kort värde med en siffra ("312", "18 %") visas som ett nyckeltal. Allt
 * annat (namn, citat, sortens etikett) visas som text bredvid påståendet. */
function isFigure(value: BusinessPlanClaim["value"]): boolean {
  if (typeof value === "number") return true;
  return typeof value === "string" && value.length <= 12 && /\d/.test(value);
}

function ClaimSource({ claim }: { claim: BusinessPlanClaim }) {
  return (
    <span className="fdd-inline">
      <SourceTag source={claim.source} dataType={claim.dataType} />
      {mentionsConcept(claim.text) && <ConceptBadge />}
    </span>
  );
}

function Claim({ claim }: { claim: BusinessPlanClaim }) {
  return (
    <li className="fdd-claim">
      <p>
        {claim.text}
        {claim.value !== undefined && <span className="fdd-claim__value"> · {claim.value}</span>}
      </p>
      <ClaimSource claim={claim} />
    </li>
  );
}

/** Påståenden med ett siffervärde, som nyckeltal: värdet stort, påståendet som etikett. */
function Figures({ claims }: { claims: BusinessPlanClaim[] }) {
  return (
    <ul className="fdd-bplan-figures">
      {claims.map((claim, index) => (
        <li key={index} className="fdd-bplan-figure">
          <span className="fdd-bplan-figure__value">{claim.value}</span>
          <span className="fdd-bplan-figure__label">{claim.text}</span>
          <ClaimSource claim={claim} />
        </li>
      ))}
    </ul>
  );
}

type StepLookup = {
  title: (stepNumber: number) => string | null;
  /** Länk till steget, bara om grundaren kan öppna det nu (det aktuella steget). */
  href: (stepNumber: number) => string | null;
  isDone: (stepNumber: number) => boolean;
};

/** En lucka: vilket steg som skulle ge underlaget, med en länk dit när steget går att göra nu. */
function Gap({ stepNumber, steps }: { stepNumber: number; steps: StepLookup }) {
  const { t } = useI18n();
  const copy = t.businessPlanPage;

  if (steps.isDone(stepNumber)) {
    return <p className="fdd-muted">{fill(copy.stepDoneNoEvidenceTemplate, { step: stepNumber })}</p>;
  }
  const title = steps.title(stepNumber);
  const href = steps.href(stepNumber);
  return (
    <div className="fdd-bplan-gap">
      <p>
        <span className="fdd-bplan-gap__text">{fill(copy.requiresStepTemplate, { step: stepNumber })}</span>
        {title && <span className="fdd-bplan-gap__step"> · {title}</span>}
      </p>
      {href && (
        <Link href={href} className="fdd-link fdd-bplan-gap__link">
          {fill(copy.openStepTemplate, { step: padStep(stepNumber) })}
        </Link>
      )}
    </div>
  );
}

function SectionShell({
  id,
  status,
  pill,
  children,
}: {
  id: BusinessPlanSectionId;
  status?: BusinessPlanStatus;
  pill?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const text = t.businessPlanPage.sections[id];
  return (
    <section
      className={cn("fd-panel fdd-plansection", status && `fdd-plansection--${status}`)}
      aria-labelledby={sectionAnchor(id)}
    >
      <div className="fdd-panel__head">
        <h2 id={sectionAnchor(id)} className="fdd-panel__title">
          {text.title}
        </h2>
        {pill}
      </div>
      <p className="fdd-muted">{text.description}</p>
      {children}
    </section>
  );
}

function Section({ section, steps }: { section: BusinessPlanSection; steps: StepLookup }) {
  const { t } = useI18n();
  const copy = t.businessPlanPage;
  const figures = section.claims.filter((claim) => isFigure(claim.value));
  const texts = section.claims.filter((claim) => !isFigure(claim.value));
  // Två kontrollpunkter kan vänta på samma steg (Marknaden): luckan visas en gång.
  const gapSteps = [...new Set(section.gaps.map((gap) => gap.requiredStepNumber))];

  return (
    <SectionShell id={section.id} status={section.status} pill={<Pill tone={statusTone[section.status]}>{copy.status[section.status]}</Pill>}>
      {figures.length > 0 && <Figures claims={figures} />}
      {texts.length > 0 && (
        <ul className="fdd-claims">
          {texts.map((claim, index) => (
            <Claim key={index} claim={claim} />
          ))}
        </ul>
      )}

      {section.contradictions.map((contradiction, index) => (
        <div key={index} className="fdd-contradiction">
          <p className="fdd-contradiction__label">{copy.contradictionLabel}</p>
          <ul className="fdd-claims">
            <Claim claim={contradiction.a} />
            <Claim claim={contradiction.b} />
          </ul>
        </div>
      ))}

      {gapSteps.length > 0 && (
        <div className="fdd-bplan-gaps">
          {gapSteps.map((stepNumber) => (
            <Gap key={stepNumber} stepNumber={stepNumber} steps={steps} />
          ))}
        </div>
      )}

      {section.lockedParts.length > 0 && (
        <div className="fdd-bplan-locked">
          <p className="fdd-label">{copy.lockedPartsTitle}</p>
          <ul>
            {section.lockedParts.map((part) => (
              <li key={part.name}>
                <span className="fdd-lock" aria-hidden="true" />
                <span>
                  {part.name} · {t.homePage.unlocksAfterStepBefore} {part.unlocksAfterStep}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionShell>
  );
}

/** Översikten: varje avsnitt med sitt läge, som länk ner till avsnittet. */
function Overview({ plan }: { plan: BusinessPlanModel }) {
  const { t } = useI18n();
  const copy = t.businessPlanPage;
  return (
    <nav className="fd-panel fdd-bplan-overview" aria-label={copy.overviewLabel}>
      <div className="fdd-bplan-bar" aria-hidden="true">
        {plan.sections.map((section) => (
          <span key={section.id} className={`fdd-bplan-bar__seg fdd-bplan-bar__seg--${section.status}`} />
        ))}
      </div>
      <ol className="fdd-bplan-ov">
        {plan.sections.map((section) => {
          const title = copy.sections[section.id].title;
          const status = copy.status[section.status];
          return (
            <li key={section.id}>
              <a
                href={`#${sectionAnchor(section.id)}`}
                className={`fdd-bplan-ov__item fdd-bplan-ov__item--${section.status}`}
                aria-label={fill(copy.overviewLinkTemplate, { title, status })}
              >
                <span className="fdd-bplan-ov__dot" aria-hidden="true" />
                <span>{title}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Steget som stärker planen mest: det första som en lucka väntar på. */
function NextStep({
  plan,
  completedStepNumbers,
  steps,
}: {
  plan: BusinessPlanModel;
  completedStepNumbers: readonly number[];
  steps: StepLookup;
}) {
  const { t } = useI18n();
  const copy = t.businessPlanPage;
  const next = nextPlanStep(plan, completedStepNumbers);
  const title = next && steps.title(next.stepNumber);
  if (!next || !title) return null;
  const href = steps.href(next.stepNumber);

  return (
    <section className="fd-panel fdd-bplan-next" aria-labelledby="fdd-bplan-next-title">
      <p className="fd-nextstep__eyebrow">{copy.nextStep.eyebrow}</p>
      <h2 id="fdd-bplan-next-title" className="fdd-bplan-next__title">
        {fill(copy.nextStep.titleTemplate, { step: padStep(next.stepNumber), title })}
      </h2>
      <div className="fdd-bplan-next__foot">
        <p className="fdd-muted">
          {copy.nextStep.feedsLabel}: {next.sectionIds.map((id) => copy.sections[id].title).join(", ")}
        </p>
        {href && (
          <Link href={href} className="fd-btn fd-btn--primary fd-btn--sm">
            {fill(copy.nextStep.ctaTemplate, { step: padStep(next.stepNumber) })}
          </Link>
        )}
      </div>
    </section>
  );
}

/**
 * Affärsplanen (PR 10, omgjord 2026-10-03): sammansatt i kod ur det som redan
 * är belagt, aldrig genererad. Skärmen visar bara vad `buildBusinessPlan`
 * (core/businessPlan.ts) returnerar, plus en översikt och steget som stärker
 * planen mest (`nextPlanStep`), båda räknade ur samma plan.
 */
export function BusinessPlan({ data }: { data: BusinessPlanData }) {
  const { t } = useI18n();
  const copy = t.businessPlanPage;
  const { plan, stepBasePath = null } = data;
  const completedStepNumbers = data.completedStepNumbers ?? [];
  const stepViews = data.steps ?? [];

  const steps: StepLookup = {
    title: (stepNumber) => stepViews.find((step) => step.stepNumber === stepNumber)?.title ?? null,
    href: (stepNumber) =>
      stepBasePath && stepViews.find((step) => step.stepNumber === stepNumber)?.status === "current"
        ? `${stepBasePath}/${stepNumber}`
        : null,
    isDone: (stepNumber) => completedStepNumbers.includes(stepNumber),
  };

  return (
    <div className="fdd-page fdd-bplan-page">
      <PageHead
        title={copy.title}
        lede={copy.subtitle}
        aside={
          <div className="fdd-bplan-aside">
            <p className="fdd-maturity">
              <span className="fdd-maturity__value">
                {plan ? `${plan.maturity.solidCount}/${plan.maturity.totalCount}` : "—"}
              </span>
              <span className="fdd-muted">{copy.maturityLabel}</span>
            </p>
            {plan && (
              <button type="button" className="fd-btn fd-btn--secondary fd-btn--sm fdd-bplan-print" onClick={() => window.print()}>
                {copy.printCta}
              </button>
            )}
          </div>
        }
      />
      {plan && (
        <div className="fdd-bplan-top">
          <Overview plan={plan} />
          <NextStep plan={plan} completedStepNumbers={completedStepNumbers} steps={steps} />
        </div>
      )}
      <div className="fdd-bplan">
        {plan
          ? plan.sections.map((section) => <Section key={section.id} section={section} steps={steps} />)
          : BUSINESS_PLAN_SECTION_ORDER.map((id) => (
              <SectionShell key={id} id={id}>
                <ComingSoon />
              </SectionShell>
            ))}
      </div>
    </div>
  );
}
