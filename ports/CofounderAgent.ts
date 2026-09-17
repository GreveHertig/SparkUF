import type { Locale } from "@/i18n/context";

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
