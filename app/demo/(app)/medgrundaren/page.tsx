"use client";

import { useMemo } from "react";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { engineFor } from "@/adapters/demo/journeyEngine";
import { cofounderScript } from "@/adapters/demo/cofounderScript";
import { jonasCofounderScript } from "@/adapters/demo/jonasCofounderScript";
import { ChatLine, PageHead, TimeSkipLine, ToolRun } from "../../_components/DemoBlocks";
import { mentionsConcept } from "../../_lib/concepts";

/**
 * Medgrundaren: det aktuella momentet i samtalet, och det som redan
 * är känt i en egen spalt. Samma urval som det riktiga demots route
 * (app/demo/app/medgrundaren/page.tsx).
 */
export default function FondaDemoCofounderPage() {
  const { t, locale } = useI18n();
  const copy = t.cofounderPage;
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);

  const { context, moment } = useMemo(() => {
    const engine = engineFor(entry);
    const script = entry === "hasIdea" ? jonasCofounderScript : cofounderScript;
    const currentBeat = engine.getBeatAt(beatIndex);
    return {
      context: engine.beats
        .slice(0, beatIndex)
        .filter((beat) => beat.momentKind === "after")
        .map((beat) => ({
          id: beat.id,
          text: beat.traceSummary?.[locale] ?? `${beat.momentLabel[locale]}: ${beat.nextStep[locale].title}`,
        })),
      moment: {
        label: `${String(currentBeat.stepNumber).padStart(2, "0")} · ${currentBeat.momentLabel[locale]}`,
        items: script[currentBeat.id] ?? [],
      },
    };
  }, [locale, beatIndex, entry]);

  return (
    <div className="fdd-page">
      <PageHead title={copy.title} lede={copy.subtitle} />

      <div className={context.length > 0 ? "fdd-hero" : undefined}>
        <section className="fd-panel fdd-cofounder" aria-labelledby="fdd-moment-title">
          <h2 id="fdd-moment-title" className="fdd-label">
            {moment.label}
          </h2>
          {moment.items.length === 0 ? (
            <p className="fdd-muted">{copy.emptyStateBody}</p>
          ) : (
            <div className="fdd-conversation" data-tour-id="cofounder-moment">
              {moment.items.map((item, index) =>
                item.kind === "message" ? (
                  <ChatLine key={index} role={item.role} text={item.text[locale]} />
                ) : item.kind === "tool" ? (
                  <ToolRun key={index} label={item.label[locale]} steps={item.steps[locale]} />
                ) : (
                  <TimeSkipLine key={index} label={item.label[locale]} />
                ),
              )}
            </div>
          )}
          <div className="fdd-prompt">
            <textarea
              disabled
              rows={1}
              placeholder={copy.promptPlaceholder}
              aria-label={copy.promptPlaceholder}
              className="fdd-prompt__input"
            />
            <button type="button" disabled className="fd-btn fd-btn--primary fd-btn--sm">
              {copy.promptSendLabel}
            </button>
          </div>
        </section>

        {context.length > 0 && (
          <aside className="fdd-context" aria-labelledby="fdd-context-title">
            <h2 id="fdd-context-title" className="fdd-block__title">
              {copy.contextTitle}
            </h2>
            <ol className="fdd-context__list">
              {context.map((item) => (
                <li key={item.id}>
                  {item.text}
                  {mentionsConcept(item.text) && <ConceptBadge className="fdd-context__concept" />}
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </div>
  );
}
