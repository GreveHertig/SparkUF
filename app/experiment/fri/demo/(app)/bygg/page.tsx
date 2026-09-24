"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import type { ByggBrief } from "@/core/domain";
import type { BuildStatus } from "@/ports/BuildProvider";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { demoBuildProvider } from "@/adapters/demo/BuildProvider";
import { FriSource } from "../../_components/FriSource";
import { FriConcept, FriLocked, FriPageHead, FriStatus } from "../../_components/FriParts";

type BuildData = { status: BuildStatus; url?: string; creditsUsed?: number; spec: ByggBrief | null };

const statusTone: Record<BuildStatus, "muted" | "warn" | "ok"> = {
  not_started: "muted",
  building: "warn",
  published: "ok",
};

/** Bygg i kopian: samma status och brief som /demo/app/bygg (screens/Build). Lovable märks som koncept. */
export default function FriBuildPage() {
  const { t, locale } = useI18n();
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

  return (
    <>
      <FriPageHead
        title={data.spec ? data.spec.sammanfattning : t.buildPage.title}
        lead={t.buildPage.subtitle}
        right={<FriConcept />}
      />
      {!data.spec ? (
        <div className="fri-section-demo">
          <FriLocked hint={notInScenario ? t.homePage.notInThisScenario : `${t.homePage.unlocksAfterStepBefore} 07`} />
        </div>
      ) : (
        <>
          <div className="fri-build-gate fri-section-demo" data-tour-id="build-gate">
            <FriStatus tone={statusTone[data.status]}>{t.buildPage.status[data.status]}</FriStatus>
            {data.url && (
              <a href={data.url} target="_blank" rel="noreferrer" className="fri-link">
                {t.buildPage.publishedUrlLabel}: {data.url}
              </a>
            )}
            {data.creditsUsed !== undefined && (
              <span className="fri-mono fri-muted" style={{ marginLeft: "auto" }}>
                {t.buildPage.creditsUsedLabel}: {data.creditsUsed}
              </span>
            )}
          </div>

          <div className="fri-build-grid fri-section-demo">
            <section className="fri-ruled">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 540 }}>{t.buildPage.specTitle}</h2>
                <span className="fri-muted" style={{ fontSize: "0.85rem" }}>
                  {t.buildPage.scopeStepNote}
                </span>
              </div>
              <p className="fri-mono fri-muted" style={{ marginTop: 14 }}>
                {data.spec.målgrupp}
              </p>
              <ul className="fri-chips-row">
                {data.spec.sidor.map((sida) => (
                  <li key={sida}>{sida}</li>
                ))}
              </ul>
            </section>

            <section className="fri-window" data-tour-id="build-spec">
              <div className="fri-window-bar">
                <span className="fri-mono fri-muted">{data.url ?? "lovable.dev/projects/spark"}</span>
                <FriConcept />
              </div>
              <div className="fri-window-body">
                {data.status === "published" ? (
                  <>
                    <p className="fri-mono fri-muted">{t.buildPage.previewTitle}</p>
                    <p style={{ marginTop: 8 }}>{data.spec.sammanfattning}</p>
                  </>
                ) : (
                  <p className="fri-mono fri-muted">{t.buildPage.specTitle}</p>
                )}
                <ul className="fri-claims">
                  {data.spec.underlag.map((bevis, index) => (
                    <li key={index}>
                      <p>{bevis.påstående}</p>
                      <FriSource source={bevis.källa} />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
