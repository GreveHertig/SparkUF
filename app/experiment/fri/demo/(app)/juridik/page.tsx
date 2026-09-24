"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import type { JuridisktKrav } from "@/core/domain";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { demoLegalAdvisor } from "@/adapters/demo/LegalAdvisor";
import { FriLegalMap, FriLocked, FriPageHead, FriSectionTitle } from "../../_components/FriParts";

/** Juridik i kopian: samma krav och ansvarsbegränsning som /demo/app/juridik (screens/Legal). */
export default function FriLegalPage() {
  const { t } = useI18n();
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
    <>
      <FriPageHead title={bolagsform ? t.common.bolagsformLabels[bolagsform] : t.legalPage.title} lead={t.legalPage.subtitle} />
      {krav.length === 0 ? (
        <div className="fri-section-demo">
          <FriLocked hint={notInScenario ? t.homePage.notInThisScenario : `${t.homePage.unlocksAfterStepBefore} 04`} />
        </div>
      ) : (
        <>
          <section className="fri-section-demo" data-tour-id="legal-map">
            <FriSectionTitle title={t.legalPage.title} />
            <FriLegalMap krav={krav} />
          </section>
          <p className="fri-locked fri-section-demo" style={{ fontSize: "0.92rem" }}>
            {t.legalPage.disclaimer}
          </p>
        </>
      )}
    </>
  );
}
