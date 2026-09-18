import type { Locale } from "@/i18n/context";

export type OutreachRecipient = {
  companyName: string;
  email: string;
};

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

/** Modul: Utskick och svar (avsnitt 14.3). Liveadapter bygger på Gmail (stub). */
export interface OutreachProvider {
  send(recipients: OutreachRecipient[], messageSv: string, messageEn: string): Promise<void>;
  getStatuses(): Promise<Record<string, OutreachStatus>>;
  getCampaign(locale: Locale): Promise<CampaignRow[]>;
}
