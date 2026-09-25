"use client";

import { useEffect, useState } from "react";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { demoLegalAdvisor } from "@/adapters/demo/LegalAdvisor";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { JuridisktKrav } from "@/core/domain";
import { Locked, PageHead, Pill, type PillTone } from "../../_components/DemoBlocks";

const statusTone: Record<JuridisktKrav["status"], PillTone> = {
  uppfyllt: "green",
  ej_uppfyllt: "orange",
  ej_tillämpligt: "neutral",
};

/** Juridik i kopian: den juridiska kartan med källa på varje krav, och ansvarsbegränsningen. */
export default function FondaDemoLegalPage() {
  const { t } = useI18n();
  const copy = t.legalPage;
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const notInScenario = entry === "hasIdea";
  const [krav, setKrav] = useState<JuridisktKrav[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoLegalAdvisor.getLegalMap("enskild_firma").then((result) => {
      if (!cancelled) setKrav(result);
    });
    return () => {
      cancelled = true;
    };
  }, [beatIndex, entry]);

  if (!krav) return null;
  const bolagsform = krav[0]?.gällerFör[0];

  return (
    <div className="fdd-page">
      <PageHead title={bolagsform ? t.common.bolagsformLabels[bolagsform] : copy.title} lede={copy.subtitle} />

      {krav.length === 0 ? (
        <Locked hint={notInScenario ? t.homePage.notInThisScenario : `${t.homePage.unlocksAfterStepBefore} 04`} />
      ) : (
        <>
          <section className="fdd-block" aria-labelledby="fdd-legal-map">
            <h2 id="fdd-legal-map" className="fdd-block__title">
              {copy.title}
            </h2>
            <ul className="fdd-rows" data-tour-id="legal-map">
              {krav.map((item) => (
                <li key={item.id} className="fdd-rows__item">
                  <div className="fdd-rows__main">
                    <p className="fdd-rows__title">{item.rubrik}</p>
                    <p className="fdd-muted">{item.beskrivning}</p>
                    <SourceTag source={item.källa} />
                  </div>
                  <Pill tone={statusTone[item.status]}>{copy.status[item.status]}</Pill>
                </li>
              ))}
            </ul>
          </section>
          <p className="fdd-disclaimer">{copy.disclaimer}</p>
        </>
      )}
    </div>
  );
}
