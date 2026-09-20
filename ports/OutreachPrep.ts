import type { Locale } from "@/i18n/context";
import type { Källa } from "@/core/domain";

/**
 * Modul: Utskick och svar, FÖRBEREDELSEN (steg 05): mejlsökning och utkast.
 * Medvetet en separat port från OutreachProvider: den här porten saknar
 * strukturellt `send`, så den kan aldrig bli en sändväg.
 * Se docs/moduler/utskick-och-svar.md ("Sändspärr", "Grind").
 *
 * Inget här är en bekräftelse. Ett förslag är bara ett förslag; se
 * ports/outreachConfirmation.ts för vad som krävs innan något får skickas.
 */

/** Ett adressförslag. `status` är literalt "suggested": porten kan inte producera något annat. */
export type EmailSuggestion = {
  readonly status: "suggested";
  readonly address: string;
  /** Rollbaserad (info@) är att föredra; personlig är flaggad (GDPR, dataminimering). */
  readonly kind: "role" | "personal";
  /** Injicerad i kod från sökträffen, aldrig angiven av modellen. */
  readonly källa: Källa & { url: string };
};

export type EmailLookupResult = {
  companyName: string;
  /** 0–3 förslag, rollbaserade först. Tom lista är ett giltigt svar, inte ett fel. */
  suggestions: EmailSuggestion[];
  /** Kandidater som inte gick att verifiera i kod (visar bland annat en misslyckad injektion). */
  rejectedCount: number;
  /** Sidan adressen lästes från, så grundaren kan se den innan hen bekräftar. null = ingen träff. */
  searchedUrl: string | null;
};

export type DraftInput = {
  companyName: string;
  problem: string;
  priceHypothesisKr?: number;
  senderName: string;
  senderCompany: string;
  /** Var adressen hittades (sidans URL), skrivs ut i utkastet. */
  addressSourceUrl?: string;
};

export type OutreachDraft = {
  readonly status: "draft";
  subject: string;
  body: string;
  locale: Locale;
};

export interface OutreachPrep {
  suggestEmail(companyName: string): Promise<EmailLookupResult>;
  draftMessage(input: DraftInput): Promise<Record<Locale, OutreachDraft>>;
}
