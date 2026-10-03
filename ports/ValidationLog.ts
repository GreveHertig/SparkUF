import type { ContactChannel, ContactStatus, PriceStanceLog, ProblemStanceLog, SizeClassKey } from "@/core/validationLog";

/** Ett loggat svar från ett bolag. Citatet är den svarandes egna ord: data, aldrig instruktion. */
export type ConversationAnswer = {
  /** Dagen samtalet hölls (ÅÅÅÅ-MM-DD). Beviset räknas från den, inte från inmatningen. */
  respondedOnIso: string;
  sizeClass: SizeClassKey;
  problemStance: ProblemStanceLog;
  priceStance: PriceStanceLog;
  /** Priset grundaren testade, kronor per månad. */
  priceTestedKr: number;
  /** Vad bolaget själv sa att det skulle betala, om det sa något. */
  counterOfferKr: number | null;
  quote: string;
};

/** Ett bolag i grundarens kontaktlista, med svaret om det finns. */
export type ValidationContact = {
  id: string;
  companyName: string;
  sizeClass: SizeClassKey | null;
  channel: ContactChannel | null;
  status: ContactStatus;
  contactedOnIso: string | null;
  /** Bara när status är "responded". */
  answer: ConversationAnswer | null;
  createdAtIso: string;
};

export type NewValidationContact = {
  companyName: string;
  sizeClass?: SizeClassKey | null;
};

/**
 * Modul: Valideringen, samtalsloggen (docs/moduler/validering.md, beslut i
 * docs/beslut.md 2026-10-04). Grundaren pratar själv med kunderna och loggar
 * samtalen här. Porten kan inte skicka något: sändspärren i
 * docs/moduler/utskick-och-svar.md gäller orörd.
 *
 * Liveadapter bygger på Supabase (`public.validation_contacts`) för det
 * aktiva projektet. Användaren och projektet tas alltid ur sessionen, aldrig
 * ur indata. Status går aldrig bakåt. Fel som grundaren kan rätta kastas som
 * `ValidationLogError` med en orsak.
 */
export interface ValidationLog {
  /** Hela listan, äldst först. */
  getContacts(): Promise<ValidationContact[]>;
  /** Lägger till ett bolag som planerat. Samma bolag två gånger ger "duplicate". */
  addContact(input: NewValidationContact): Promise<ValidationContact>;
  /** Planerat → kontaktat. Ett bolag som redan kommit längre ger "backwards". */
  markContacted(id: string, channel: ContactChannel, contactedOnIso: string): Promise<void>;
  /** Kontaktat → nej tack (ville inte prata). Ett bolag som svarat ger "answered". */
  markDeclined(id: string): Promise<void>;
  /** Sparar eller ersätter svaret och sätter status "responded". */
  saveAnswer(id: string, channel: ContactChannel, answer: ConversationAnswer): Promise<ValidationContact>;
  /** Tar bort ett bolag som inte svarat. Ett bolag som svarat ger "answered". */
  removeContact(id: string): Promise<void>;
}
