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

export type CofounderData = {
  moments: CofounderMoment[];
};

/** Chattytan (avsnitt 6, 8, 10): förskriven dialog som går att klicka igenom
 * via demoraden, med ToolRunCard när ett verktyg körs. Skärmen vet inte att
 * dialogen är förskriven — den bara renderar de moment den fått in. */
export function Cofounder({ data }: { data: CofounderData }) {
  const { locale, t } = useI18n();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Eyebrow>{t.appShell.nav.cofounder}</Eyebrow>
        <EditorialHeading as="h1" className="mt-2">
          {t.cofounderPage.title}
        </EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{t.cofounderPage.subtitle}</p>
      </div>

      {data.moments.length === 0 && <p className="text-sm text-slate-600">{t.cofounderPage.emptyStateBody}</p>}

      <div className="flex flex-col gap-6">
        {data.moments.map((moment) => (
          <section key={moment.id} className="flex flex-col gap-2">
            <Eyebrow>{moment.momentLabel}</Eyebrow>
            {moment.items.map((item, index) =>
              item.kind === "message" ? (
                <ChatMessage key={index} role={item.role} text={item.text[locale]} />
              ) : item.kind === "tool" ? (
                <ToolRunCard key={index} label={item.label[locale]} steps={item.steps[locale]} />
              ) : (
                <TimeSkip key={index} label={item.label[locale]} />
              ),
            )}
          </section>
        ))}
      </div>

      <PromptBox />
    </div>
  );
}
