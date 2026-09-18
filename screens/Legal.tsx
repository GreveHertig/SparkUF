"use client";

import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LockedState } from "@/components/ui/LockedState";
import { LegalMap } from "@/components/spark/LegalMap";
import { useI18n } from "@/i18n/context";
import type { JuridisktKrav } from "@/core/domain";

export type LegalData = {
  krav: JuridisktKrav[];
};

/** Juridik (avsnitt 6, 2.4): den juridiska kartan, med ansvarsbegränsning
 * (CLAUDE.md: en ansvarsbegränsning på juridiska ytor). */
export function Legal({ data }: { data: LegalData }) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Eyebrow>{t.appShell.nav.legal}</Eyebrow>
        <EditorialHeading as="h1" className="mt-2">
          {t.legalPage.title}
        </EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{t.legalPage.subtitle}</p>
      </div>

      {data.krav.length === 0 ? (
        <LockedState unlockHint={`${t.homePage.unlocksAfterStepBefore} 04`} />
      ) : (
        <>
          <LegalMap krav={data.krav} />
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-600">
            {t.legalPage.disclaimer}
          </p>
        </>
      )}
    </div>
  );
}
