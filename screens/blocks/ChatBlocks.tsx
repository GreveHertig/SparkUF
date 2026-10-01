"use client";

import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import type { Källa } from "@/core/domain";
import { cn } from "@/design/cn";
import type { DataType } from "@/design/tokens";
import { useI18n } from "@/i18n/context";
import { mentionsConcept } from "@/core/concepts";

/**
 * Samtalets byggstenar: en rad, en verktygskörning och ett tidshopp. Flyttade
 * hit i PR 10 (docs/plan-en-design.md) från `app/demo/_components/DemoBlocks.tsx`,
 * som exporterar dem vidare åt onboardingens sidor (PR 11). Ligger under
 * `screens/` — portregeln gäller.
 */

/** Källan för siffrorna i en rad eller en verktygskörning, när den har någon (PR 11). */
export type ChatSource = { source: Källa; dataType: DataType };

/** En rad i samtalet med Medgrundaren. Koncept får sin etikett, siffror sin källa. */
export function ChatLine({ role, text, source }: { role: "founder" | "cofounder"; text: string; source?: ChatSource }) {
  return (
    <div className={cn("fdd-chat", role === "founder" ? "fdd-chat--founder" : "fdd-chat--cofounder")}>
      <p className="fdd-chat__bubble">{text}</p>
      {mentionsConcept(text) && <ConceptBadge />}
      {source && <SourceTag source={source.source} dataType={source.dataType} />}
    </div>
  );
}

/** Ett verktyg som körts: delmomenten, alla klara. */
export function ToolRun({ label, steps, source }: { label: string; steps: string[]; source?: ChatSource }) {
  const { t } = useI18n();
  return (
    <div className="fdd-tool">
      <p className="fdd-tool__label">
        {t.cofounderPage.toolRunningLabel}: {label}
      </p>
      <ul className="fd-checks fd-checks--small">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
      {mentionsConcept(`${label} ${steps.join(" ")}`) && <ConceptBadge />}
      {source && <SourceTag source={source.source} dataType={source.dataType} />}
    </div>
  );
}

/** "4 dagar senare" i samtalet. */
export function TimeSkipLine({ label }: { label: string }) {
  return (
    <p className="fdd-skip">
      <span>{label}</span>
    </p>
  );
}
