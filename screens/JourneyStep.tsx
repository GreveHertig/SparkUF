"use client";

import Link from "next/link";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LockedState } from "@/components/ui/LockedState";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { JourneyStepDetail } from "@/ports/JourneyRepository";

/** Stegets arbetsyta (/app/resan/[steg], avsnitt 6): vad som gjorts eller
 * vad som ska göras, beroende på status. */
export function JourneyStepScreen({ data, backHref }: { data: JourneyStepDetail; backHref: string }) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link href={backHref} className="text-sm font-medium text-accent-700 hover:underline">
          ← {t.journeyPage.backToJourney}
        </Link>
        <Eyebrow className="mt-4">
          <span className="font-numeric">{t.journeyPage.stepLabel} {String(data.stepNumber).padStart(2, "0")}</span> ·{" "}
          {t.journeyPage.status[data.status]}
        </Eyebrow>
        <EditorialHeading as="h1" className="mt-2">
          {data.title}
        </EditorialHeading>
        <p className="mt-2 text-sm leading-snug text-slate-600">{data.oneLiner}</p>
        <p className="mt-2 text-sm font-medium text-accent-700">
          {t.common.upToPointsBefore} <span className="font-numeric">{data.maxPoints}</span> {t.common.upToPointsAfter}
        </p>
      </div>

      {data.status === "locked" ? (
        <LockedState unlockHint={`${t.homePage.unlocksAfterStepBefore} ${data.stepNumber - 1}`}>
          <p className="text-sm">{data.oneLiner}</p>
        </LockedState>
      ) : (
        <div className={cn("flex flex-col gap-5 rounded-lg border border-slate-200 bg-white p-5")}>
          {data.why && (
            <section>
              <Eyebrow>{data.status === "current" ? t.journeyPage.whatsNext : t.journeyPage.whatHappened}</Eyebrow>
              <p className="mt-2 text-sm text-slate-700">{data.why}</p>
            </section>
          )}

          {data.highlights.length > 0 && (
            <section>
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
