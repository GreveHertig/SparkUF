"use client";

import Link from "next/link";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LockedState } from "@/components/ui/LockedState";
import { SimulationCard } from "@/components/spark/SimulationCard";
import { VerdictCard } from "@/components/spark/VerdictCard";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { JourneyStepDetail } from "@/ports/JourneyRepository";

/** Stegets arbetsyta (/app/resan/[steg], avsnitt 6, 9.1): vad som ska göras,
 * pågår eller redan hänt, beroende på status och moment (före/körning/efter). */
export function JourneyStepScreen({ data, backHref }: { data: JourneyStepDetail; backHref: string }) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-[18px]">
      <div>
        <Link href={backHref} className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">
          ← {t.journeyPage.backToJourney}
        </Link>
        <Eyebrow className="mt-4">
          <span className="font-numeric">{t.journeyPage.stepLabel} {String(data.stepNumber).padStart(2, "0")}</span> ·{" "}
          {t.journeyPage.status[data.status]}
          {data.status !== "locked" && <> · {t.journeyPage.momentPill[data.momentKind]}</>}
        </Eyebrow>
        <EditorialHeading as="h1" className="mt-2">
          {data.title}
        </EditorialHeading>
        <p className="mt-2 text-sm leading-snug text-slate-600">{data.oneLiner}</p>
        <p className="mt-2 text-sm font-medium text-slate-600">
          {t.common.upToPointsBefore} <span className="font-numeric">{data.maxPoints}</span> {t.common.upToPointsAfter}
        </p>
      </div>

      {data.status === "locked" ? (
        <LockedState unlockHint={`${t.homePage.unlocksAfterStepBefore} ${data.stepNumber - 1}`}>
          <p className="text-sm">{data.oneLiner}</p>
        </LockedState>
      ) : (
        <div className={cn("flex flex-col gap-5 rounded-md border border-slate-200 bg-white p-5 shadow-lg")}>
          {data.why && (
            <section>
              <Eyebrow>{data.status === "current" ? t.journeyPage.whatsNext : t.journeyPage.whatHappened}</Eyebrow>
              <p className="mt-2 text-sm text-slate-700">{data.why}</p>
              {data.momentKind === "running" && (
                <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {t.journeyPage.runningHint}
                </p>
              )}
            </section>
          )}

          {data.verdict && data.scoreDelta && (
            <div data-tour-id="journey-verdict">
              <VerdictCard score={data.scoreDelta.total} headline={data.verdict.headline} reasoning={data.verdict.reasoning} />
            </div>
          )}

          {data.highlights.length > 0 && (
            <section data-tour-id="journey-highlights">
              <Eyebrow>{t.journeyPage.whatHappened}</Eyebrow>
              <ul className="mt-2 flex flex-col gap-1.5">
                {data.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2 text-sm text-slate-700">
                    <span aria-hidden="true">·</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.scoreDelta && data.scoreDelta.delta !== 0 && (
            <section>
              <Eyebrow>{t.journeyPage.scoreChangeTitle}</Eyebrow>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                <span className="font-numeric">
                  {data.scoreDelta.delta > 0 ? "+" : "−"}
                  {Math.abs(data.scoreDelta.delta)}
                </span>{" "}
                {data.scoreDelta.deltaReason}
              </p>
              <p className="font-numeric mt-1 text-xs text-slate-600">→ {data.scoreDelta.total}</p>
            </section>
          )}

          {data.newlyUnlockedParts.length > 0 && (
            <section>
              <Eyebrow>{t.journeyPage.unlockedTitle}</Eyebrow>
              <ul className="mt-2 flex flex-col gap-1.5">
                {data.newlyUnlockedParts.map((partName) => (
                  <li key={partName} className="flex gap-2 text-sm font-medium text-accent-700">
                    <span aria-hidden="true">·</span>
                    {partName}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.simulation && (
            <section className="flex flex-col gap-2.5">
              <Eyebrow>{t.journeyPage.simulationTitle}</Eyebrow>
              <SimulationCard simulation={data.simulation} />
            </section>
          )}

          {data.doneItems.length > 0 && (
            <section>
              <p
                className="text-xs font-semibold uppercase text-slate-600"
                style={{ letterSpacing: "var(--tracking-label)" }}
              >
                {t.common.doneItemsLabel}
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {data.doneItems.map((item) => (
                  <li key={item} className="text-sm text-slate-600">
                    ✓ {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
