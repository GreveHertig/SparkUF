"use client";

import { Card } from "@/components/ui/Card";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LockedState } from "@/components/ui/LockedState";
import { SourceTag } from "@/components/ui/SourceTag";
import { KpiRow } from "@/components/spark/KpiRow";
import { KpiTile } from "@/components/spark/KpiTile";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { BusinessPlan, BusinessPlanClaim, BusinessPlanSection, BusinessPlanStatus } from "@/core/businessPlan";

export type BusinessPlanData = {
  plan: BusinessPlan;
};

const statusToneClasses: Record<BusinessPlanStatus, string> = {
  solid: "border-score-green bg-score-green-bg text-score-green",
  thin: "border-score-yellow bg-score-yellow-bg text-score-yellow",
  missing: "border-dashed border-slate-300 bg-slate-50 text-slate-500",
};

function ClaimRow({ claim }: { claim: BusinessPlanClaim }) {
  return (
    <div className="flex flex-col gap-1">
      {claim.value !== undefined ? (
        <p className="text-sm text-slate-800">
          <span className="font-medium">{claim.text}</span>{" "}
          <span className="font-numeric text-slate-600">{claim.value}</span>
        </p>
      ) : (
        <p className="text-sm text-slate-800">{claim.text}</p>
      )}
      <SourceTag source={claim.source} dataType={claim.dataType} />
    </div>
  );
}

function SectionCard({ section }: { section: BusinessPlanSection }) {
  const { t } = useI18n();
  const copy = t.businessPlanPage.sections[section.id];

  return (
    <Card
      title={copy.title}
      right={
        <span
          className={cn("rounded-pill border px-2 py-0.5 text-xs font-semibold uppercase", statusToneClasses[section.status])}
          style={{ letterSpacing: "var(--tracking-label)" }}
        >
          {t.businessPlanPage.status[section.status]}
        </span>
      }
    >
      <p className="mb-3 text-sm text-slate-600">{copy.description}</p>

      {section.claims.length > 0 && (
        <div className="flex flex-col gap-3">
          {section.claims.map((claim, index) => (
            <ClaimRow key={index} claim={claim} />
          ))}
        </div>
      )}

      {section.contradictions.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {section.contradictions.map((contradiction, index) => (
            <div key={index} className="rounded-md border border-dashed border-score-orange bg-score-orange-bg p-3">
              <Eyebrow tone="warning">{t.businessPlanPage.contradictionLabel}</Eyebrow>
              <div className="mt-2 flex flex-col gap-2">
                <ClaimRow claim={contradiction.a} />
                <ClaimRow claim={contradiction.b} />
              </div>
            </div>
          ))}
        </div>
      )}

      {section.gaps.length > 0 && (
        <div className={cn("flex flex-col gap-2", section.claims.length > 0 && "mt-3")}>
          {section.gaps.map((gap, index) => (
            <LockedState
              key={index}
              unlockHint={t.businessPlanPage.requiresStepTemplate.replace("{step}", String(gap.requiredStepNumber))}
            />
          ))}
        </div>
      )}

      {section.lockedParts.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <Eyebrow>{t.businessPlanPage.lockedPartsTitle}</Eyebrow>
          {section.lockedParts.map((part) => (
            <LockedState key={part.name} unlockHint={`${part.name} · ${t.homePage.unlocksAfterStepBefore} ${part.unlocksAfterStep}`} />
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Affärsplanen (docs/uppdrag.md avsnitt 15): sätts samman i kod ur det
 * grundaren redan bevisat, aldrig genererad. Samma kortskal, typografiska
 * skala och källchips som resten av /demo/app — ett avsnitt utan underlag
 * visas som ett ärligt tomt läge (LockedState), inte en tom ruta.
 */
export function BusinessPlan({ data }: { data: BusinessPlanData }) {
  const { t } = useI18n();
  const { maturity, sections } = data.plan;

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-[18px]">
      <div>
        <EditorialHeading as="h1">{t.businessPlanPage.title}</EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{t.businessPlanPage.subtitle}</p>
      </div>

      <KpiRow>
        <KpiTile label={t.businessPlanPage.maturityLabel} value={`${maturity.solidCount}/${maturity.totalCount}`} />
      </KpiRow>

      <div className="flex flex-col gap-[18px]">
        {sections.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
