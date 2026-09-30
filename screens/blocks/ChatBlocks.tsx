"use client";

import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { mentionsConcept } from "@/core/concepts";

/**
 * Samtalets byggstenar: en rad, en verktygskörning och ett tidshopp. Flyttade
 * hit i PR 10 (docs/plan-en-design.md) från `app/demo/_components/DemoBlocks.tsx`,
 * som exporterar dem vidare åt onboardingens sidor (PR 11). Ligger under
 * `screens/` — portregeln gäller.
 */

/** En rad i samtalet med Medgrundaren. Koncept får sin etikett. */
export function ChatLine({ role, text }: { role: "founder" | "cofounder"; text: string }) {
  return (
    <div className={cn("fdd-chat", role === "founder" ? "fdd-chat--founder" : "fdd-chat--cofounder")}>
      <p className="fdd-chat__bubble">{text}</p>
      {mentionsConcept(text) && <ConceptBadge />}
    </div>
  );
}

/** Ett verktyg som körts: delmomenten, alla klara. */
export function ToolRun({ label, steps }: { label: string; steps: string[] }) {
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
