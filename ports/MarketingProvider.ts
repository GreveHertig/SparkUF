import type { Locale } from "@/i18n/context";
import type { Källa } from "@/core/domain";

/**
 * Modul: Marknadsföring (docs/moduler/marknadsforing.md). Egen modul som
 * används i steg 11, Första kunderna. Liveadaptern bygger på Gemini.
 *
 * Spark marknadsför MED grundaren, inte ÅT hen: allt här är förslag och
 * utkast. Ingenting publiceras någonsin av porten.
 */
export interface MarketingProvider {
  /** Hela planen: budskapet, kanalerna och veckorna, med utfall där de finns. */
  getPlan(locale: Locale): Promise<MarketingPlan>;
  /** Ett utkast till en aktivitet i planen. Alltid ett utkast, aldrig publicerat. */
  draftContent(activityId: string, locale: Locale): Promise<ContentDraft>;
  /** Grundarens egna siffror för en aktivitet, efter att hen gjort den. */
  reportOutcome(activityId: string, outcome: MarketingOutcome): Promise<void>;
}

/** Ett budskap och beviset det bygger på. Inget budskap utan källa. */
export type MarketingMessage = {
  text: string;
  /** Kundens egna ord som budskapet vilar på, när det finns ett citat. */
  quote?: string;
  source: Källa;
};

export type ChannelChoice = {
  id: string;
  name: string;
  /** Rekommenderad nu, eller avrådd tills vidare (med skäl). */
  verdict: "recommended" | "notNow";
  why: string;
  source?: Källa;
};

export type MarketingActivity = {
  id: string;
  channelId: string;
  title: string;
};

export type MarketingWeek = {
  weekNumber: number;
  focus: string;
  activities: MarketingActivity[];
  /** Utfallet grundaren rapporterat för veckan, om veckan är gjord. */
  outcome?: MarketingWeekOutcome;
};

export type MarketingWeekOutcome = {
  posts: number;
  replies: number;
  meetings: number;
  newCustomers: number;
  /** Sparks läsning av utfallet: vad som fungerar och vad som ska bort. */
  takeaway: string;
  source: Källa;
};

export type MarketingPlan = {
  headline: MarketingMessage;
  supporting: MarketingMessage[];
  channels: ChannelChoice[];
  weeks: MarketingWeek[];
};

export type ContentDraft = {
  activityId: string;
  channelId: string;
  text: string;
  /** Bevisen utkastet bygger på. Aldrig tom. */
  basedOn: Källa[];
};

export type MarketingOutcome = {
  posts: number;
  replies: number;
  meetings: number;
  newCustomers: number;
  comment?: string;
};

/** Kastas när ett aktivitets-id inte finns i planen. */
export class UnknownMarketingActivityError extends Error {
  constructor(activityId: string) {
    super(`Okänd aktivitet i marknadsföringsplanen: "${activityId}".`);
    this.name = "UnknownMarketingActivityError";
  }
}
