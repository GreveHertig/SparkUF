"use client";

import { ChatMessage } from "@/components/spark/ChatMessage";
import { PromptBox } from "@/components/spark/PromptBox";
import { ToolRunCard } from "@/components/spark/ToolRunCard";
import { TimeSkip } from "@/components/spark/TimeSkip";
import { Card } from "@/components/ui/Card";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { useI18n } from "@/i18n/context";
import type { TranscriptItem } from "@/ports/CofounderAgent";

export type CofounderMoment = {
  id: string;
  momentLabel: string;
  items: TranscriptItem[];
};

/** En kort, redan känd fakta eller ett redan taget beslut (Spårets
 * "-efter"-sammanfattningar) — visas som en rad, aldrig som chattbubblor. */
export type CofounderContextItem = {
  id: string;
  text: string;
};

export type CofounderData = {
  /** Sedan tidigare (avsnitt 10): kort, redan känt — inte scrollbar historik. */
  context: CofounderContextItem[];
  /** Bara det aktuella momentet — `null` om inget skript finns för det
   * (ska i praktiken aldrig hända för en nådd beat). */
  moment: CofounderMoment | null;
};

/**
 * Chattytan (avsnitt 6, 8, 10, artefaktens `vyMedgrundaren`): huvudspalten
 * visar det aktuella momentet, inte hela den tidigare chatthistoriken —
 * "Sedan tidigare" fyller sidospaltens plats i stället för att rullas upp
 * ovanför chatten (samma platsroll som Hjärnan har i originalet, utan att
 * duplicera Minnets data). Skärmen vet inte att dialogen är förskriven —
 * den bara renderar det moment och den kontext den fått in.
 */
export function Cofounder({ data }: { data: CofounderData }) {
  const { locale, t } = useI18n();

  return (
    // Artefaktens vyMedgrundaren har en statisk pagehead ("Medgrundaren" +
    // en generell beskrivning) — det aktuella momentets etikett hör hemma
    // på chattkortets egen rubrik (nedan), inte på sidans h1.
    <div className="mx-auto flex max-w-[1080px] flex-col gap-[18px]">
      <div>
        <EditorialHeading as="h1">{t.cofounderPage.title}</EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{t.cofounderPage.subtitle}</p>
      </div>

      <div className={data.context.length > 0 ? "grid grid-cols-1 gap-[18px] lg:grid-cols-[2fr_316px]" : undefined}>
        <Card title={data.moment ? data.moment.momentLabel : t.cofounderPage.title}>
          {!data.moment && <p className="text-sm text-slate-600">{t.cofounderPage.emptyStateBody}</p>}

          {data.moment && (
            <div data-tour-id="cofounder-moment" className="flex flex-col gap-2">
              {data.moment.items.map((item, index) =>
                item.kind === "message" ? (
                  <ChatMessage key={index} role={item.role} text={item.text[locale]} />
                ) : item.kind === "tool" ? (
                  <ToolRunCard key={index} label={item.label[locale]} steps={item.steps[locale]} />
                ) : (
                  <TimeSkip key={index} label={item.label[locale]} />
                ),
              )}
            </div>
          )}

          <PromptBox className="mt-4" />
        </Card>

        {data.context.length > 0 && (
          <Card title={t.cofounderPage.contextTitle}>
            <ul className="flex flex-col gap-2">
              {data.context.map((item) => (
                <li key={item.id} className="text-sm leading-snug text-slate-600">
                  {item.text}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
