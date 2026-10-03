import type { Locale } from "@/i18n/context";

/**
 * Ett inslag i ett förskrivet medgrundarsamtal, som skärmen Cofounder visar
 * det: ett meddelande, en verktygskörning eller ett tidshopp.
 */
export type TranscriptItem =
  | { kind: "message"; role: "founder" | "cofounder"; text: Record<Locale, string> }
  | { kind: "tool"; label: Record<Locale, string>; steps: Record<Locale, string[]> }
  | { kind: "timeSkip"; label: Record<Locale, string> };

export type CofounderMessage = {
  role: "founder" | "cofounder";
  text: string;
  /**
   * Spec v4 §3.1: den konkreta uppgift i verkligheten som Medgrundarens svar
   * slutar med, en handling inom sju dagar och aldrig en fråga. Bara på
   * Medgrundarens svar. Valfri i porten: liveadaptern ger den alltid, demon
   * aldrig. Ändrad port, beslut Erik 2026-10-03 (docs/beslut.md).
   */
  nextTask?: string;
};

/** Modul: Medgrundaren (avsnitt 14.3). Liveadapter bygger på Gemini. */
export interface CofounderAgent {
  sendMessage(
    message: string,
    history: CofounderMessage[],
    locale: Locale,
  ): Promise<CofounderMessage>;
}
