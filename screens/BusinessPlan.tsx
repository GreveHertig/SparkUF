"use client";

import type { ReactNode } from "react";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import {
  BUSINESS_PLAN_SECTION_ORDER,
  type BusinessPlan as BusinessPlanModel,
  type BusinessPlanClaim,
  type BusinessPlanSection,
  type BusinessPlanSectionId,
  type BusinessPlanStatus,
} from "@/core/businessPlan";
import { mentionsConcept } from "@/core/concepts";
import { Locked, PageHead, Pill, type PillTone } from "./blocks/PageBlocks";

/**
 * `null` betyder att planen inte kan sättas samman (ingen hopsamling i /app
 * än): varje avsnitt visar sin rubrik och "Kommer snart", och mognaden visas
 * som luckan "—", aldrig som 0.
 */
export type BusinessPlanData = { plan: BusinessPlanModel | null };

const statusTone: Record<BusinessPlanStatus, PillTone> = {
  solid: "green",
  thin: "yellow",
  missing: "neutral",
};

function Claim({ claim }: { claim: BusinessPlanClaim }) {
  return (
    <li className="fdd-claim">
      <p>
        {claim.text}
        {claim.value !== undefined && <span className="fdd-claim__value"> {claim.value}</span>}
      </p>
      <span className="fdd-inline">
        <SourceTag source={claim.source} dataType={claim.dataType} />
        {mentionsConcept(claim.text) && <ConceptBadge />}
      </span>
    </li>
  );
}

function SectionShell({
  id,
  pill,
  children,
}: {
  id: BusinessPlanSectionId;
  pill?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const text = t.businessPlanPage.sections[id];
  return (
    <section className="fd-panel fdd-plansection" aria-labelledby={`fdd-plan-${id}`}>
      <div className="fdd-panel__head">
        <h2 id={`fdd-plan-${id}`} className="fdd-panel__title">
          {text.title}
        </h2>
        {pill}
      </div>
      <p className="fdd-muted">{text.description}</p>
      {children}
    </section>
  );
}

function Section({ section }: { section: BusinessPlanSection }) {
  const { t } = useI18n();
  const copy = t.businessPlanPage;

  return (
    <SectionShell id={section.id} pill={<Pill tone={statusTone[section.status]}>{copy.status[section.status]}</Pill>}>
      {section.claims.length > 0 && (
        <ul className="fdd-claims">
          {section.claims.map((claim, index) => (
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

      {section.gaps.map((gap, index) => (
        <Locked key={index} hint={fill(copy.requiresStepTemplate, { step: gap.requiredStepNumber })} />
      ))}

      {section.lockedParts.length > 0 && (
        <div className="fdd-stack fdd-stack--tight">
          <p className="fdd-label">{copy.lockedPartsTitle}</p>
          {section.lockedParts.map((part) => (
            <Locked key={part.name} hint={`${part.name} · ${t.homePage.unlocksAfterStepBefore} ${part.unlocksAfterStep}`} />
          ))}
        </div>
      )}
    </SectionShell>
  );
}

/**
 * Affärsplanen (PR 10): sammansatt i kod ur det som redan är belagt, aldrig
 * genererad. Skärmen visar bara vad `buildBusinessPlan` (core/businessPlan.ts)
 * returnerar.
 */
export function BusinessPlan({ data }: { data: BusinessPlanData }) {
  const { t } = useI18n();
  const copy = t.businessPlanPage;
  const { plan } = data;

  return (
    <div className="fdd-page">
      <PageHead
        title={copy.title}
        lede={copy.subtitle}
        aside={
          <p className="fdd-maturity">
            <span className="fdd-maturity__value">
              {plan ? `${plan.maturity.solidCount}/${plan.maturity.totalCount}` : "—"}
            </span>
            <span className="fdd-muted">{copy.maturityLabel}</span>
          </p>
        }
      />
      <div className="fdd-plan">
        {plan
          ? plan.sections.map((section) => <Section key={section.id} section={section} />)
          : BUSINESS_PLAN_SECTION_ORDER.map((id) => (
              <SectionShell key={id} id={id}>
                <ComingSoon />
              </SectionShell>
            ))}
      </div>
    </div>
  );
}
