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
};

/** Modul: Medgrundaren (avsnitt 14.3). Liveadapter bygger på Gemini. */
export interface CofounderAgent {
  sendMessage(
    message: string,
    history: CofounderMessage[],
    locale: Locale,
  ): Promise<CofounderMessage>;
}
