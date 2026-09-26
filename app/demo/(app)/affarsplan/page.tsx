"use client";

import { useEffect, useState } from "react";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { getBusinessPlan } from "@/adapters/demo/businessPlan";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { BusinessPlan, BusinessPlanClaim, BusinessPlanSection, BusinessPlanStatus } from "@/core/businessPlan";
import { fill } from "@/i18n/fill";
import { Locked, PageHead, Pill, type PillTone } from "../../_components/DemoBlocks";
import { mentionsConcept } from "../../_lib/concepts";

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

function Section({ section }: { section: BusinessPlanSection }) {
  const { t } = useI18n();
  const copy = t.businessPlanPage;
  const text = copy.sections[section.id];

  return (
    <section className="fd-panel fdd-plansection" aria-labelledby={`fdd-plan-${section.id}`}>
      <div className="fdd-panel__head">
        <h2 id={`fdd-plan-${section.id}`} className="fdd-panel__title">
          {text.title}
        </h2>
        <Pill tone={statusTone[section.status]}>{copy.status[section.status]}</Pill>
      </div>
      <p className="fdd-muted">{text.description}</p>

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
    </section>
  );
}

/** Affärsplanen: sammansatt i kod ur det som redan är belagt, aldrig genererad. */
export default function FondaDemoBusinessPlanPage() {
  const { t, locale } = useI18n();
  const copy = t.businessPlanPage;
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const [plan, setPlan] = useState<BusinessPlan | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBusinessPlan(locale).then((result) => {
      if (!cancelled) setPlan(result);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!plan) return null;

  return (
    <div className="fdd-page">
      <PageHead
        title={copy.title}
        lede={copy.subtitle}
        aside={
          <p className="fdd-maturity">
            <span className="fdd-maturity__value">
              {plan.maturity.solidCount}/{plan.maturity.totalCount}
            </span>
            <span className="fdd-muted">{copy.maturityLabel}</span>
          </p>
        }
      />
      <div className="fdd-plan">
        {plan.sections.map((section) => (
          <Section key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
