"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { engineFor } from "@/adapters/demo/journeyEngine";
import { cofounderScript } from "@/adapters/demo/cofounderScript";
import { jonasCofounderScript } from "@/adapters/demo/jonasCofounderScript";
import { FriChat, FriPageHead, FriPrompt, FriTimeSkip, FriToolRun } from "../../_components/FriParts";

/** Medgrundaren i kopian: samma samtal och sammanhang som /demo/app/medgrundaren. */
export default function FriCofounderPage() {
  const { t, locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);

  // Samma härledning som app/demo/app/medgrundaren/page.tsx.
  const data = useMemo(() => {
    const engine = engineFor(entry);
    const script = entry === "hasIdea" ? jonasCofounderScript : cofounderScript;
    const currentBeat = engine.getBeatAt(beatIndex);
    const context = engine.beats
      .slice(0, beatIndex)
      .filter((beat) => beat.momentKind === "after")
      .map((beat) => ({
        id: beat.id,
        text: beat.traceSummary?.[locale] ?? `${beat.momentLabel[locale]} — ${beat.nextStep[locale].title}`,
      }));
    return {
      context,
      moment: {
        id: currentBeat.id,
        momentLabel: `${currentBeat.stepNumber} · ${currentBeat.momentLabel[locale]}`,
        items: script[currentBeat.id] ?? [],
      },
    };
  }, [locale, beatIndex, entry]);

  return (
    <>
      <FriPageHead title={t.cofounderPage.title} lead={t.cofounderPage.subtitle} />
      <div className={data.context.length > 0 ? "fri-two-col" : undefined} style={{ marginTop: 48 }}>
        <section className="fri-convo">
          <p className="fri-mono fri-muted">
            {t.journeyPage.stepLabel} {data.moment.momentLabel}
          </p>
          <div data-tour-id="cofounder-moment" className="fri-convo-items">
            {data.moment.items.length === 0 && <p className="fri-muted">{t.cofounderPage.emptyStateBody}</p>}
            {data.moment.items.map((item, index) =>
              item.kind === "message" ? (
                <FriChat key={index} role={item.role} text={item.text[locale]} />
              ) : item.kind === "tool" ? (
                <FriToolRun key={index} label={item.label[locale]} steps={item.steps[locale]} />
              ) : (
                <FriTimeSkip key={index} label={item.label[locale]} />
              ),
            )}
          </div>
          <FriPrompt />
        </section>
        {data.context.length > 0 && (
          <aside>
            <h2 className="fri-ruled" style={{ fontSize: "1.1rem", fontWeight: 540 }}>
              {t.cofounderPage.contextTitle}
            </h2>
            <ol className="fri-context">
              {data.context.map((item) => (
                <li key={item.id}>{item.text}</li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </>
  );
}
