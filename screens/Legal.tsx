"use client";

import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { LockedState } from "@/components/ui/LockedState";
import { LegalMap } from "@/components/spark/LegalMap";
import { useI18n } from "@/i18n/context";
import type { JuridisktKrav } from "@/core/domain";

export type LegalData = {
  krav: JuridisktKrav[];
};

/** Juridik (avsnitt 6, 2.4): den juridiska kartan, med ansvarsbegränsning
 * (CLAUDE.md: en ansvarsbegränsning på juridiska ytor). */
export function Legal({ data, notInScenario }: { data: LegalData; notInScenario?: boolean }) {
  const { t } = useI18n();
  // Rubriken beskriver den faktiska bolagsformen i stället för att upprepa
  // "Juridik" (uppgift 2) — hämtad ur det första kravets `gällerFör`.
  const bolagsform = data.krav[0]?.gällerFör[0];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <EditorialHeading as="h1">
          {bolagsform ? t.common.bolagsformLabels[bolagsform] : t.legalPage.title}
        </EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{t.legalPage.subtitle}</p>
      </div>

      {data.krav.length === 0 ? (
        <LockedState
          unlockHint={notInScenario ? t.homePage.notInThisScenario : `${t.homePage.unlocksAfterStepBefore} 04`}
        />
      ) : (
        <>
          <div data-tour-id="legal-map">
            <LegalMap krav={data.krav} />
          </div>
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3.5 text-xs leading-snug text-slate-600">
            {t.legalPage.disclaimer}
          </p>
        </>
      )}
    </div>
  );
}
