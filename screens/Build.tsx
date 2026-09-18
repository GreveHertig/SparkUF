"use client";

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
  spec: ByggBrief | null;
};

const statusToneClasses: Record<BuildStatus, string> = {
  not_started: "bg-slate-100 text-slate-600",
  building: "bg-score-yellow-bg text-score-yellow",
  published: "bg-score-green-bg text-score-green",
};

/** Bygg (avsnitt 6, 2.3): Lovable-konceptet — spec, förhandsvisning och
 * publicering, alltid märkt som koncept. */
export function Build({ data }: { data: BuildData }) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>{t.appShell.nav.build}</Eyebrow>
          <EditorialHeading as="h1" className="mt-2">
            {t.buildPage.title}
          </EditorialHeading>
          <p className="mt-2 text-sm text-slate-600">{t.buildPage.subtitle}</p>
        </div>
        <ConceptBadge className="mt-1" />
      </div>

      {!data.spec ? (
        <LockedState unlockHint={`${t.homePage.unlocksAfterStepBefore} 07`} />
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
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
          </div>

          <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5">
            <Eyebrow>{t.buildPage.specTitle}</Eyebrow>
            <p className="text-sm leading-snug text-slate-800">{data.spec.sammanfattning}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500" style={{ letterSpacing: "var(--tracking-label)" }}>
                  {data.spec.målgrupp}
                </p>
              </div>
            </div>
            <ul className="flex flex-wrap gap-2">
              {data.spec.sidor.map((sida) => (
                <li key={sida} className="rounded-pill bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {sida}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
              {data.spec.underlag.map((bevis, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <p className="text-sm text-slate-700">{bevis.påstående}</p>
                  <SourceTag source={bevis.källa} />
                </div>
              ))}
            </div>
          </section>

          {data.status === "published" && (
            <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
              <Eyebrow>{t.buildPage.previewTitle}</Eyebrow>
              <p className="mt-2 text-sm leading-snug text-slate-600">{data.spec.sammanfattning}</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
