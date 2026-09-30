"use client";

import { ComingSoon } from "@/components/ui/ComingSoon";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import type { ByggBrief, Källa } from "@/core/domain";
import type { DataType } from "@/design/tokens";
import type { BuildStatus } from "@/ports/BuildProvider";
import { Locked, PageHead, Pill, type PillTone } from "./blocks/PageBlocks";

/** Byggets status, som `BuildProvider.getStatus` ger den. */
export type BuildStatusView = { status: BuildStatus; url?: string; creditsUsed?: number };

/**
 * Platshållare per sektion (docs/plan-en-design.md): `null` ger "Kommer snart"
 * i just den sektionen. `spec: "none"` betyder att porten svarat att ingen
 * spec finns än — ett ärligt tomläge, inte en stubbe.
 */
export type BuildData = {
  status: BuildStatusView | null;
  spec: ByggBrief | "none" | null;
  /** Källan för `creditsUsed`, som porten inte bär. Bara demot sätter den:
   * talet är påhittat och får en exempelkälla (PR 11). */
  creditsSource?: { source: Källa; dataType: DataType };
};

/** Samma form som `ValidationLock` och `MarketLock`. */
export type BuildLock = { unlocksAfterStep: number } | "notInScenario" | null;

const statusTone: Record<BuildStatus, PillTone> = {
  not_started: "neutral",
  building: "yellow",
  published: "green",
};

/** Bygg (PR 10): Lovable-konceptet, alltid märkt koncept. Specen, underlaget och status. */
export function Build({ data, locked }: { data: BuildData; locked: BuildLock }) {
  const { t } = useI18n();
  const copy = t.buildPage;
  const { status } = data;
  const spec = data.spec === "none" ? null : data.spec;

  return (
    <div className="fdd-page">
      <PageHead title={spec ? spec.sammanfattning : copy.title} lede={copy.subtitle} aside={<ConceptBadge />} />

      {locked ? (
        <Locked
          hint={
            locked === "notInScenario"
              ? t.homePage.notInThisScenario
              : `${t.homePage.unlocksAfterStepBefore} ${String(locked.unlocksAfterStep).padStart(2, "0")}`
          }
        />
      ) : (
        <>
          {status ? (
            <div className={`fdd-gate fdd-gate--${status.status}`} data-tour-id="build-gate">
              <Pill tone={statusTone[status.status]}>{copy.status[status.status]}</Pill>
              {status.url && (
                <a href={status.url} target="_blank" rel="noreferrer" className="fdd-link">
                  {copy.publishedUrlLabel}: {status.url}
                </a>
              )}
              {status.creditsUsed !== undefined && (
                <span className="fdd-gate__credits">
                  {copy.creditsUsedLabel}: {status.creditsUsed}
                  {data.creditsSource && (
                    <>
                      {" "}
                      <SourceTag source={data.creditsSource.source} dataType={data.creditsSource.dataType} />
                    </>
                  )}
                </span>
              )}
            </div>
          ) : (
            <ComingSoon />
          )}

          <div className="fdd-build">
            <section className="fd-panel" aria-labelledby="fdd-build-spec">
              <div className="fdd-panel__head">
                <h2 id="fdd-build-spec" className="fdd-panel__title">
                  {copy.specTitle}
                </h2>
                <span className="fdd-muted">{copy.scopeStepNote}</span>
              </div>
              {spec ? (
                <>
                  <p className="fdd-label">{spec.målgrupp}</p>
                  <ul className="fdd-tags">
                    {spec.sidor.map((sida) => (
                      <li key={sida} className="fdd-pill fdd-pill--neutral">
                        {sida}
                      </li>
                    ))}
                  </ul>
                </>
              ) : data.spec === "none" ? (
                <p className="fdd-muted">{copy.specEmpty}</p>
              ) : (
                <ComingSoon />
              )}
            </section>

            {spec && (
              <section className="fdd-browser" aria-labelledby="fdd-build-preview" data-tour-id="build-spec">
                <div className="fdd-browser__bar">
                  <span className="fdd-browser__url">{status?.url ?? "lovable.dev/projects/spark"}</span>
                  <ConceptBadge />
                </div>
                <div className="fdd-browser__body">
                  <h2 id="fdd-build-preview" className="fdd-label">
                    {status?.status === "published" ? copy.previewTitle : copy.specTitle}
                  </h2>
                  {status?.status === "published" && <p className="fdd-body">{spec.sammanfattning}</p>}
                  <ul className="fdd-evidence">
                    {spec.underlag.map((bevis, index) => (
                      <li key={index}>
                        <p>{bevis.påstående}</p>
                        <SourceTag source={bevis.källa} />
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
