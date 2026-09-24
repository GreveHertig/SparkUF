"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import type { BusinessPlan, BusinessPlanClaim, BusinessPlanSection, BusinessPlanStatus } from "@/core/businessPlan";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { getBusinessPlan } from "@/adapters/demo/businessPlan";
import { FriSource } from "../../_components/FriSource";
import { FriKpi, FriLocked, FriPageHead, FriStatus } from "../../_components/FriParts";

const statusTone: Record<BusinessPlanStatus, "ok" | "warn" | "muted"> = {
  solid: "ok",
  thin: "warn",
  missing: "muted",
};

function Claim({ claim }: { claim: BusinessPlanClaim }) {
  return (
    <li>
      <p>
        {claim.value !== undefined ? (
          <>
            <span style={{ fontWeight: 540 }}>{claim.text}</span> <span className="fri-mono fri-muted">{claim.value}</span>
          </>
        ) : (
          claim.text
        )}
      </p>
      <FriSource source={claim.source} dataType={claim.dataType} />
    </li>
  );
}

function Section({ section }: { section: BusinessPlanSection }) {
  const { t } = useI18n();
  const copy = t.businessPlanPage.sections[section.id];
  return (
    <section className="fri-plan-section">
      <div className="fri-plan-head">
        <h2 className="fri-h2-demo">{copy.title}</h2>
        <FriStatus tone={statusTone[section.status]}>{t.businessPlanPage.status[section.status]}</FriStatus>
      </div>
      <p className="fri-muted" style={{ marginTop: 8, maxWidth: "62ch" }}>
        {copy.description}
      </p>

      {section.claims.length > 0 && (
        <ul className="fri-claims">
          {section.claims.map((claim, index) => (
            <Claim key={index} claim={claim} />
          ))}
        </ul>
      )}

      {section.contradictions.map((contradiction, index) => (
        <div key={index} className="fri-contradiction">
          <p className="fri-mono">{t.businessPlanPage.contradictionLabel}</p>
          <ul className="fri-claims" style={{ marginTop: 8 }}>
            <Claim claim={contradiction.a} />
            <Claim claim={contradiction.b} />
          </ul>
        </div>
      ))}

      {section.gaps.length > 0 && (
        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          {section.gaps.map((gap, index) => (
            <FriLocked key={index} hint={t.businessPlanPage.requiresStepTemplate.replace("{step}", String(gap.requiredStepNumber))} />
          ))}
        </div>
      )}

      {section.lockedParts.length > 0 && (
        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          <p className="fri-mono fri-muted">{t.businessPlanPage.lockedPartsTitle}</p>
          {section.lockedParts.map((part) => (
            <FriLocked key={part.name} hint={`${part.name} · ${t.homePage.unlocksAfterStepBefore} ${part.unlocksAfterStep}`} />
          ))}
        </div>
      )}
    </section>
  );
}

/** Affärsplanen i kopian: samma plan ur samma adapter som /demo/app/affarsplan (screens/BusinessPlan). */
export default function FriBusinessPlanPage() {
  const { t, locale } = useI18n();
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
    <>
      <FriPageHead title={t.businessPlanPage.title} lead={t.businessPlanPage.subtitle} />
      <dl className="fri-kpis" style={{ gridTemplateColumns: "minmax(0, 280px)" }}>
        <FriKpi label={t.businessPlanPage.maturityLabel} value={`${plan.maturity.solidCount}/${plan.maturity.totalCount}`} />
      </dl>
      <div className="fri-section-demo">
        {plan.sections.map((section) => (
          <Section key={section.id} section={section} />
        ))}
      </div>
    </>
  );
}
