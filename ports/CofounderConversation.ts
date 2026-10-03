import type { CofounderMessage } from "@/ports/CofounderAgent";

/**
 * Medgrundarens sparade samtal (docs/moduler/medgrundaren.md, version 1).
 * Liveadapter bygger på Supabase (`public.cofounder_messages`). Användaren tas
 * alltid ur sessionen, aldrig ur indata. Texten är data, aldrig instruktion.
 */
export interface CofounderConversationRepository {
  /** De senaste `limit` meddelandena, äldst först. */
  getRecentMessages(limit: number): Promise<CofounderMessage[]>;
  /**
   * Kostnadstaket: sparar grundarens meddelande om färre än `limit`
   * meddelanden från grundaren har sparats sedan `sinceIso`, och svarar då
   * true. Annars sparas inget och svaret är false. Räkning och sparande sker
   * i ett steg, så att två samtidiga anrop inte båda passerar taket. Anropas
   * innan modellen anropas, så att även ett misslyckat anrop räknas.
   */
  reserveFounderMessage(text: string, cap: { limit: number; sinceIso: string }): Promise<boolean>;
  /** Sparar Medgrundarens svar efter grundarens senaste meddelande. */
  appendCofounderReply(text: string): Promise<void>;
}

/** Längsta text som sparas per meddelande, i tecken. Samma gräns som i databasen. */
export const COFOUNDER_MESSAGE_MAX = 4000;
