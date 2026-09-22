"use client";

import { Card } from "@/components/ui/Card";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import { LockedState } from "@/components/ui/LockedState";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { ByggBrief } from "@/core/domain";
import type { BuildStatus } from "@/ports/BuildProvider";

export type BuildData = {
  status: BuildStatus;
  url?: string;
  creditsUsed?: number;
  spec: ByggBrief | null;
};

const statusToneClasses: Record<BuildStatus, string> = {
  not_started: "bg-slate-100 text-slate-600",
  building: "bg-score-yellow-bg text-score-yellow",
  published: "bg-score-green-bg text-score-green",
};

/** Grindraden (artefaktens `gatebar`) — samma tre lägen som statuspillen,
 * bara som en färgad banner i stället för en neutral rad. */
const gateToneClasses: Record<BuildStatus, string> = {
  not_started: "border-slate-200 bg-slate-50",
  building: "border-score-yellow bg-score-yellow-bg",
  published: "border-score-green bg-score-green-bg",
};

/** Bygg (avsnitt 6, 2.3): Lovable-konceptet — spec, förhandsvisning och
 * publicering, alltid märkt som koncept. */
export function Build({ data, notInScenario }: { data: BuildData; notInScenario?: boolean }) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-[18px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <EditorialHeading as="h1">{data.spec ? data.spec.sammanfattning : t.buildPage.title}</EditorialHeading>
          <p className="mt-2 text-sm text-slate-600">{t.buildPage.subtitle}</p>
        </div>
        <ConceptBadge className="mt-1" />
      </div>

      {!data.spec ? (
        <LockedState
          unlockHint={notInScenario ? t.homePage.notInThisScenario : `${t.homePage.unlocksAfterStepBefore} 07`}
        />
      ) : (
        <>
          <div
            data-tour-id="build-gate"
            className={cn("flex items-center gap-3 rounded-md border p-4 shadow-lg", gateToneClasses[data.status])}
          >
            <span
              className={cn("rounded-pill px-2.5 py-1 text-xs font-semibold uppercase", statusToneClasses[data.status])}
              style={{ letterSpacing: "var(--tracking-label)" }}
            >
              {t.buildPage.status[data.status]}
            </span>
            {data.url && (
              <a href={data.url} target="_blank" rel="noreferrer" className="text-sm text-accent-700 underline underline-offset-2">
                {t.buildPage.publishedUrlLabel}: {data.url}
              </a>
            )}
            {data.creditsUsed !== undefined && (
              <span className="ml-auto text-sm font-medium text-slate-600">
                {t.buildPage.creditsUsedLabel}: {data.creditsUsed}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[300px_1fr]">
            <Card
              title={t.buildPage.specTitle}
              right={<span className="text-xs text-slate-500">{t.buildPage.scopeStepNote}</span>}
            >
              <p
                className="text-xs font-semibold uppercase text-slate-500"
                style={{ letterSpacing: "var(--tracking-label)" }}
              >
                {data.spec.målgrupp}
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {data.spec.sidor.map((sida) => (
                  <li key={sida} className="rounded-pill bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {sida}
                  </li>
                ))}
              </ul>
            </Card>

            <section
              data-tour-id="build-spec"
              className="flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                </span>
                <span className="font-numeric text-xs text-slate-500">
                  {data.url ?? "lovable.dev/projects/spark"}
                </span>
                <ConceptBadge className="ml-auto" />
              </div>

              <div className="flex flex-col gap-4 p-5">
                {data.status === "published" ? (
                  <div>
                    <Eyebrow>{t.buildPage.previewTitle}</Eyebrow>
                    <p className="mt-2 text-sm leading-snug text-slate-600">{data.spec.sammanfattning}</p>
                  </div>
                ) : (
                  <Eyebrow>{t.buildPage.specTitle}</Eyebrow>
                )}
                <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                  {data.spec.underlag.map((bevis, index) => (
                    <div key={index} className="flex flex-col gap-1">
                      <p className="text-sm text-slate-700">{bevis.påstående}</p>
                      <SourceTag source={bevis.källa} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
