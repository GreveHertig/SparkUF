"use client";

import { useEffect, useState } from "react";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { demoBuildProvider } from "@/adapters/demo/BuildProvider";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { ByggBrief } from "@/core/domain";
import type { BuildStatus } from "@/ports/BuildProvider";
import { Locked, PageHead, Pill, type PillTone } from "../../_components/DemoBlocks";

type BuildData = { status: BuildStatus; url?: string; creditsUsed?: number; spec: ByggBrief | null };

const statusTone: Record<BuildStatus, PillTone> = {
  not_started: "neutral",
  building: "yellow",
  published: "green",
};

/** Bygg i kopian: Lovable-konceptet, alltid märkt koncept. Specen, underlaget och status. */
export default function FondaDemoBuildPage() {
  const { t, locale } = useI18n();
  const copy = t.buildPage;
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const notInScenario = entry === "hasIdea";
  const [data, setData] = useState<BuildData | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([demoBuildProvider.getStatus(), demoBuildProvider.getSpec(locale)]).then(([status, spec]) => {
      if (!cancelled) setData({ status: status.status, url: status.url, creditsUsed: status.creditsUsed, spec });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!data) return null;
  const { spec } = data;

  return (
    <div className="fdd-page">
      <PageHead
        title={spec ? spec.sammanfattning : copy.title}
        lede={copy.subtitle}
        aside={<ConceptBadge />}
      />

      {!spec ? (
        <Locked hint={notInScenario ? t.homePage.notInThisScenario : `${t.homePage.unlocksAfterStepBefore} 07`} />
      ) : (
        <>
          <div className={`fdd-gate fdd-gate--${data.status}`} data-tour-id="build-gate">
            <Pill tone={statusTone[data.status]}>{copy.status[data.status]}</Pill>
            {data.url && (
              <a href={data.url} target="_blank" rel="noreferrer" className="fdd-link">
                {copy.publishedUrlLabel}: {data.url}
              </a>
            )}
            {data.creditsUsed !== undefined && (
              <span className="fdd-gate__credits">
                {copy.creditsUsedLabel}: {data.creditsUsed}
              </span>
            )}
          </div>

          <div className="fdd-build">
            <section className="fd-panel" aria-labelledby="fdd-build-spec">
              <div className="fdd-panel__head">
                <h2 id="fdd-build-spec" className="fdd-panel__title">
                  {copy.specTitle}
                </h2>
                <span className="fdd-muted">{copy.scopeStepNote}</span>
              </div>
              <p className="fdd-label">{spec.målgrupp}</p>
              <ul className="fdd-tags">
                {spec.sidor.map((sida) => (
                  <li key={sida} className="fdd-pill fdd-pill--neutral">
                    {sida}
                  </li>
                ))}
              </ul>
            </section>

            <section className="fdd-browser" aria-labelledby="fdd-build-preview" data-tour-id="build-spec">
              <div className="fdd-browser__bar">
                <span className="fdd-browser__url">{data.url ?? "lovable.dev/projects/spark"}</span>
                <ConceptBadge />
              </div>
              <div className="fdd-browser__body">
                <h2 id="fdd-build-preview" className="fdd-label">
                  {data.status === "published" ? copy.previewTitle : copy.specTitle}
                </h2>
                {data.status === "published" && <p className="fdd-body">{spec.sammanfattning}</p>}
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
          </div>
        </>
      )}
    </div>
  );
}
