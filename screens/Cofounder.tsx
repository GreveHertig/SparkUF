"use client";

import { ComingSoon } from "@/components/ui/ComingSoon";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { useI18n } from "@/i18n/context";
import type { TranscriptItem } from "@/ports/CofounderAgent";
import { mentionsConcept } from "@/core/concepts";
import { ChatLine, TimeSkipLine, ToolRun } from "./blocks/ChatBlocks";
import { PageHead } from "./blocks/PageBlocks";

/** Det aktuella momentet i samtalet: etiketten ("03 · Marknaden") och inslagen. */
export type CofounderMoment = {
  label: string;
  items: TranscriptItem[];
};

/** En kort, redan känd fakta eller ett redan taget beslut — en rad, aldrig chattbubblor. */
export type CofounderContextItem = {
  id: string;
  text: string;
};

/**
 * Platshållare per sektion (docs/plan-en-design.md): `null` ger "Kommer snart"
 * i just den sektionen. En tom `context` är ett ärligt tomläge och döljer
 * spalten, som i demot.
 */
export type CofounderData = {
  moment: CofounderMoment | null;
  context: CofounderContextItem[] | null;
};

/**
 * Medgrundaren (PR 10): det aktuella momentet i samtalet, och det som redan
 * är känt i en egen spalt. Skärmen vet inte att demots samtal är förskrivet —
 * den visar det moment och den kontext den fått in.
 */
export function Cofounder({ data }: { data: CofounderData }) {
  const { t, locale } = useI18n();
  const copy = t.cofounderPage;
  const { moment, context } = data;
  const showContext = context === null || context.length > 0;

  return (
    <div className="fdd-page">
      <PageHead title={copy.title} lede={copy.subtitle} />

      <div className={showContext ? "fdd-hero" : undefined}>
        <section className="fd-panel fdd-cofounder" aria-labelledby="fdd-moment-title">
          <h2 id="fdd-moment-title" className="fdd-label">
            {moment ? moment.label : copy.title}
          </h2>
          {!moment ? (
            <ComingSoon />
          ) : moment.items.length === 0 ? (
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

        {showContext && (
          <aside className="fdd-context" aria-labelledby="fdd-context-title">
            <h2 id="fdd-context-title" className="fdd-block__title">
              {copy.contextTitle}
            </h2>
            {context === null ? (
              <ComingSoon />
            ) : (
              <ol className="fdd-context__list">
                {context.map((item) => (
                  <li key={item.id}>
                    {item.text}
                    {mentionsConcept(item.text) && <ConceptBadge className="fdd-context__concept" />}
                  </li>
                ))}
              </ol>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
