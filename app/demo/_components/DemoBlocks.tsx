"use client";

import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { mentionsConcept } from "@/core/concepts";

// Flyttade till screens/blocks/ i PR 5; exporteras vidare åt demots sidor
// som inte är flyttade till screens/ än.
export { Locked, PageHead, Pill, type PillTone } from "@/screens/blocks/PageBlocks";
// Flyttade till screens/blocks/ i PR 7, av samma skäl.
export { ExampleLabel, Figures, SimulationBlock, VerdictBlock, type Figure } from "@/screens/blocks/DataBlocks";

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
