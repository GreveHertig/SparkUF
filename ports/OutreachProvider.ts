export type OutreachRecipient = {
  companyName: string;
  email: string;
};

export type OutreachStatus = "draft" | "sent" | "opened" | "responded";

/** Modul: Utskick och svar (avsnitt 14.3). Liveadapter bygger på Gmail (stub). */
export interface OutreachProvider {
  send(recipients: OutreachRecipient[], messageSv: string, messageEn: string): Promise<void>;
  getStatuses(): Promise<Record<string, OutreachStatus>>;
}
