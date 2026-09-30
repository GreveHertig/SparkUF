"use client";

import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import type { Bolagsform, JuridisktKrav } from "@/core/domain";
import { Locked, PageHead, Pill, type PillTone } from "./blocks/PageBlocks";

/**
 * Datan skärmen behöver, redan hämtad av den monterande routen (via en
 * LegalAdvisor-adapter). `krav: null` betyder ett platshållarfel eller att
 * ingen bolagsform är vald än; en tom lista är ett ärligt tomläge.
 */
export type LegalData = {
  krav: JuridisktKrav[] | null;
};

/** Låst läge för hela kartan. Demot räknar ut det ur sitt moment; /app ur Resans steg när den finns. */
export type LegalLock = { unlocksAfterStep: number } | "notInScenario" | null;

/** Val av bolagsform i /app, som länkar (`?bolagsform=…`). Demot har inget val. */
export type BolagsformPicker = {
  current: Bolagsform | null;
  basePath: string;
};

const BOLAGSFORMER: Bolagsform[] = ["enskild_firma", "aktiebolag", "handelsbolag", "ekonomisk_forening"];

const statusTone: Record<JuridisktKrav["status"], PillTone> = {
  uppfyllt: "green",
  ej_uppfyllt: "orange",
  ej_tillämpligt: "neutral",
};

/**
 * Juridik (avsnitt 6, 2.4): den juridiska kartan med källa på varje krav, och
 * ansvarsbegränsningen (CLAUDE.md). Markup flyttad rakt av från demots
 * `app/demo/(app)/juridik/page.tsx` (PR 5, docs/plan-en-design.md).
 */
export function Legal({
  data,
  locked,
  bolagsformPicker,
}: {
  data: LegalData;
  locked: LegalLock;
  bolagsformPicker?: BolagsformPicker;
}) {
  const { t } = useI18n();
  const copy = t.legalPage;
  const { krav } = data;
  // Rubriken är bolagsformen: den valda i /app, annars det första kravets.
  const bolagsform = bolagsformPicker?.current ?? krav?.[0]?.gällerFör[0];
  const needsChoice = bolagsformPicker !== undefined && bolagsformPicker.current === null;

  return (
    <div className="fdd-page">
      <PageHead title={bolagsform ? t.common.bolagsformLabels[bolagsform] : copy.title} lede={copy.subtitle} />

      {bolagsformPicker && (
        <nav className="fdd-segmented fdd-segmented--wrap" aria-label={copy.bolagsformPickerLabel}>
          {BOLAGSFORMER.map((form) => (
            <Link
              key={form}
              href={`${bolagsformPicker.basePath}?bolagsform=${form}`}
              className="fdd-segmented__item"
              data-state={form === bolagsformPicker.current ? "active" : "inactive"}
              aria-current={form === bolagsformPicker.current ? "page" : undefined}
            >
              {t.common.bolagsformLabels[form]}
            </Link>
          ))}
        </nav>
      )}

      {locked ? (
        <Locked
          hint={
            locked === "notInScenario"
              ? t.homePage.notInThisScenario
              : `${t.homePage.unlocksAfterStepBefore} ${String(locked.unlocksAfterStep).padStart(2, "0")}`
          }
        />
      ) : needsChoice ? (
        <p className="fdd-muted">{copy.bolagsformPrompt}</p>
      ) : (
        <>
          <section className="fdd-block" aria-labelledby="fdd-legal-map">
            <h2 id="fdd-legal-map" className="fdd-block__title">
              {copy.title}
            </h2>
            {krav === null ? (
              <ComingSoon />
            ) : krav.length === 0 ? (
              <p className="fdd-muted">{copy.empty}</p>
            ) : (
              <ul className="fdd-rows" data-tour-id="legal-map">
                {krav.map((item) => (
                  <li key={item.id} className="fdd-rows__item">
                    <div className="fdd-rows__main">
                      <p className="fdd-rows__title">{item.rubrik}</p>
                      <p className="fdd-muted">{item.beskrivning}</p>
                      {item.källa?.namn && item.källa.hämtad ? (
                        <SourceTag source={item.källa} />
                      ) : (
                        // Saknas underlaget visas luckan, aldrig en påhittad källa.
                        <p className="fdd-muted">{copy.sourceMissing}</p>
                      )}
                    </div>
                    <Pill tone={statusTone[item.status]}>{copy.status[item.status]}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <p className="fdd-disclaimer">{copy.disclaimer}</p>
        </>
      )}
    </div>
  );
}
