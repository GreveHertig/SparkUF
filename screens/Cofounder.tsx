"use client";

import { ChatMessage } from "@/components/spark/ChatMessage";
import { PromptBox } from "@/components/spark/PromptBox";
import { ToolRunCard } from "@/components/spark/ToolRunCard";
import { TimeSkip } from "@/components/spark/TimeSkip";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useI18n } from "@/i18n/context";
import type { TranscriptItem } from "@/adapters/demo/cofounderScript";

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

/** Chattytan (avsnitt 6, 8, 10): en ren yta för det aktuella momentet, inte
 * hela den tidigare chatthistoriken — tidigare beslut refereras kort i en
 * "Sedan tidigare"-rad i stället för att rullas upp (Medgrundaren tar också
 * tillbaka tidigare beslut i själva repliken, se cofounderScript.ts).
 * Skärmen vet inte att dialogen är förskriven — den bara renderar det
 * moment och den kontext den fått in. */
export function Cofounder({ data }: { data: CofounderData }) {
  const { locale, t } = useI18n();

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-[18px]">
      <div>
        <EditorialHeading as="h1">
          {data.moment ? data.moment.momentLabel : t.cofounderPage.title}
        </EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{t.cofounderPage.subtitle}</p>
      </div>

      {data.context.length > 0 && (
        <section className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-4">
          <Eyebrow>{t.cofounderPage.contextTitle}</Eyebrow>
          <ul className="flex flex-col gap-1">
            {data.context.map((item) => (
              <li key={item.id} className="text-sm leading-snug text-slate-600">
                {item.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!data.moment && <p className="text-sm text-slate-600">{t.cofounderPage.emptyStateBody}</p>}

      {data.moment && (
        <section data-tour-id="cofounder-moment" className="flex flex-col gap-2">
          <Eyebrow>{data.moment.momentLabel}</Eyebrow>
          {data.moment.items.map((item, index) =>
            item.kind === "message" ? (
              <ChatMessage key={index} role={item.role} text={item.text[locale]} />
            ) : item.kind === "tool" ? (
              <ToolRunCard key={index} label={item.label[locale]} steps={item.steps[locale]} />
            ) : (
              <TimeSkip key={index} label={item.label[locale]} />
            ),
          )}
        </section>
      )}

      <PromptBox />
    </div>
  );
}
