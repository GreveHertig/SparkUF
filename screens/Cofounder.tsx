"use client";

import { ComingSoon } from "@/components/ui/ComingSoon";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import type { CofounderMessage, TranscriptItem } from "@/ports/CofounderAgent";
import { mentionsConcept } from "@/core/concepts";
import { ChatLine, TimeSkipLine, ToolRun, type ChatSource } from "./blocks/ChatBlocks";
import { CofounderChat, type SendCofounderMessage } from "./blocks/CofounderChat";
import { PageHead } from "./blocks/PageBlocks";

/** Det aktuella momentet i samtalet: etiketten ("03 · Marknaden") och inslagen. */
export type CofounderMoment = {
  label: string;
  items: TranscriptItem[];
  /** Källan för siffrorna i varje inslag, i samma ordning som `items`. Porten
   * bär ingen; demot sätter en exempelkälla på inslag med siffror (PR 11). */
  itemSources?: (ChatSource | null)[];
};

/** En kort, redan känd fakta eller ett redan taget beslut — en rad, aldrig chattbubblor. */
export type CofounderContextItem = {
  id: string;
  text: string;
  /** Källan för radens siffror, när den har några (PR 11). */
  source?: ChatSource;
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
 * Den levande chatten (/app, docs/moduler/medgrundaren.md): det sparade
 * samtalet och en server action som skickar nästa meddelande. Utan den visar
 * skärmen momentets inslag och ett avstängt promptfält, som i demot.
 */
export type CofounderLive = {
  messages: CofounderMessage[];
  onSend: SendCofounderMessage;
};

/**
 * Medgrundaren (PR 10): det aktuella momentet i samtalet, och det som redan
 * är känt i en egen spalt. Skärmen vet inte att demots samtal är förskrivet —
 * den visar det moment och den kontext den fått in. Med `live` (bara /app)
 * blir samtalet en riktig chatt under momentets etikett.
 */
export function Cofounder({ data, live }: { data: CofounderData; live?: CofounderLive }) {
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
          {moment && live ? (
            <CofounderChat initialMessages={live.messages} onSend={live.onSend} />
          ) : !moment ? (
            <ComingSoon />
          ) : moment.items.length === 0 ? (
            <p className="fdd-muted">{copy.emptyStateBody}</p>
          ) : (
            <div className="fdd-conversation" data-tour-id="cofounder-moment">
              {moment.items.map((item, index) =>
                item.kind === "message" ? (
                  <ChatLine key={index} role={item.role} text={item.text[locale]} source={moment.itemSources?.[index] ?? undefined} />
                ) : item.kind === "tool" ? (
                  <ToolRun
                    key={index}
                    label={item.label[locale]}
                    steps={item.steps[locale]}
                    source={moment.itemSources?.[index] ?? undefined}
                  />
                ) : (
                  <TimeSkipLine key={index} label={item.label[locale]} />
                ),
              )}
            </div>
          )}
          {!(moment && live) && (
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
          )}
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
                    {item.source && (
                      <>
                        {" "}
                        <SourceTag source={item.source.source} dataType={item.source.dataType} />
                      </>
                    )}
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
