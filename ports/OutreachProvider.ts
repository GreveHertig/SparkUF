import type { Locale } from "@/i18n/context";
import type { ConfirmedOutreach } from "./outreachConfirmation";

export type OutreachStatus = "draft" | "sent" | "opened" | "responded";

/** En rad i kundlistan för /app/kunder (avsnitt 6, 9.3 steg 04–06). */
export type CampaignRow = {
  companyName: string;
  sniCode: string;
  employees: number;
  revenueKsek: number;
  status: OutreachStatus;
  quote?: string;
};

/**
 * Modul: Utskick och svar (avsnitt 14.3). Liveadapter bygger på Gmail (stub).
 *
 * SÄNDNING ÄR AVSTÄNGD (docs/moduler/utskick-och-svar.md, "Sändspärr").
 * `send` tar bara `ConfirmedOutreach`: adress OCH text som grundaren manuellt
 * bekräftat. Typen kan inte skapas av någon kod (ports/outreachConfirmation.ts),
 * så ett adressförslag eller ett utkast kan aldrig matas in här; det är ett
 * kompileringsfel, inte en policy.
 */
export interface OutreachProvider {
  send(confirmed: ConfirmedOutreach[]): Promise<void>;
  getStatuses(): Promise<Record<string, OutreachStatus>>;
  getCampaign(locale: Locale): Promise<CampaignRow[]>;
}
