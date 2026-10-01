import type { Locale } from "@/i18n/context";
import type { Källa } from "@/core/domain";
import {
  UnknownMarketingActivityError,
  type ContentDraft,
  type MarketingOutcome,
  type MarketingPlan,
  type MarketingProvider,
  type MarketingWeekOutcome,
} from "@/ports/MarketingProvider";
import { useDemoStore } from "./demoStore";
import { findBeatIndexById } from "./sara";

/**
 * Marknadsföring i Saras scenario (Kvittojakten, steg 11). Allt är påhittad
 * demodata och märks så på sidan. Budskapen vilar på citaten ur
 * OutreachProvider.ts och på Saras egna steg, aldrig på nya påståenden.
 *
 * Utfallen visas successivt: veckorna 1–2 när Medgrundaren kör steg 11,
 * alla fyra när steget är klart (samma idé som Pulsens REVEAL_AFTER_BEAT_ID).
 */

const källa = (namn: string, hämtad: string): Källa => ({ namn, hämtad });

const SOURCES: Record<Locale, Record<"calls" | "profile" | "scope" | "price" | "plan", Källa>> = {
  sv: {
    calls: källa("Kundsamtal, steg 05", "2026-01-20"),
    profile: källa("Kundprofilen, steg 04", "2026-01-12"),
    scope: källa("Omfånget, steg 08", "2026-02-03"),
    price: källa("Affärsfallet, steg 07", "2026-01-28"),
    plan: källa("Saras rapport, Marknadsföring", "2026-03-18"),
  },
  en: {
    calls: källa("Customer calls, step 05", "2026-01-20"),
    profile: källa("The customer profile, step 04", "2026-01-12"),
    scope: källa("The scope, step 08", "2026-02-03"),
    price: källa("The business case, step 07", "2026-01-28"),
    plan: källa("Sara's report, Marketing", "2026-03-18"),
  },
};

type WeekOutcomeData = Omit<MarketingWeekOutcome, "source">;

const OUTCOMES: Record<Locale, WeekOutcomeData[]> = {
  sv: [
    { posts: 2, replies: 4, meetings: 2, newCustomers: 0, takeaway: "Inlägget om två förlorade dagar fick flest svar. Fortsätt med byråernas egna ord." },
    { posts: 2, replies: 6, meetings: 3, newCustomers: 2, takeaway: "Två av pilotbyråerna blev betalande. Nätverket ger fler möten än LinkedIn per timme." },
    { posts: 1, replies: 3, meetings: 2, newCustomers: 1, takeaway: "Nyföretagarcentrum gav ett möte men ingen kund. Lägg den tiden i nätverket i stället." },
    { posts: 2, replies: 5, meetings: 3, newCustomers: 2, takeaway: "Fem betalande byråer. Nästa månad: be kunderna om en rekommendation var." },
  ],
  en: [
    { posts: 2, replies: 4, meetings: 2, newCustomers: 0, takeaway: "The post about two lost days got the most replies. Keep using the firms' own words." },
    { posts: 2, replies: 6, meetings: 3, newCustomers: 2, takeaway: "Two of the pilot firms became paying. The network gives more meetings per hour than LinkedIn." },
    { posts: 1, replies: 3, meetings: 2, newCustomers: 1, takeaway: "Nyföretagarcentrum gave one meeting but no customer. Put that time into the network instead." },
    { posts: 2, replies: 5, meetings: 3, newCustomers: 2, takeaway: "Five paying firms. Next month: ask each customer for one referral." },
  ],
};

function basePlan(locale: Locale): MarketingPlan {
  const s = SOURCES[locale];
  if (locale === "en") {
    return {
      headline: {
        text: "Stop chasing receipts. Get two days back every month-end.",
        quote: "We spend at least two full days every month-end chasing receipts. Absolutely a real problem.",
        source: s.calls,
      },
      supporting: [
        {
          text: "Built in Sweden for Swedish firms, simple enough to start the same day.",
          quote: "We've tried similar solutions before but none were Swedish and simple enough.",
          source: s.calls,
        },
        {
          text: "Your clients upload through a text-message link. No account, no app.",
          source: s.scope,
        },
        {
          text: "SEK 1,190 a month excluding VAT, tested against what the firms themselves said.",
          source: s.price,
        },
      ],
      channels: [
        {
          id: "linkedin",
          name: "LinkedIn",
          verdict: "recommended",
          why: "Owners of firms with 5–19 employees are there, and the customer profile says they are the ones who decide.",
          source: s.profile,
        },
        {
          id: "network",
          name: "Industry network for accounting consultants",
          verdict: "recommended",
          why: "Firms trust other firms. A short talk there reaches many decision-makers at once.",
          source: s.calls,
        },
        {
          id: "instagram",
          name: "Instagram and TikTok",
          verdict: "notNow",
          why: "Firm owners don't look for suppliers there. Wait until the first two channels are working.",
        },
      ],
      weeks: [
        {
          weekNumber: 1,
          focus: "Show up",
          activities: [
            { id: "w1-profile", channelId: "linkedin", title: "Update your LinkedIn profile around the headline" },
            { id: "w1-post", channelId: "linkedin", title: "Post: two lost days every month-end" },
          ],
        },
        {
          weekNumber: 2,
          focus: "Meet people",
          activities: [
            { id: "w2-network", channelId: "network", title: "Join the network and introduce yourself" },
            { id: "w2-pilots", channelId: "linkedin", title: "Ask the three pilot firms to become paying customers" },
          ],
        },
        {
          weekNumber: 3,
          focus: "Proof",
          activities: [
            { id: "w3-case", channelId: "linkedin", title: "Post a short case from a pilot firm (with permission)" },
            { id: "w3-talk", channelId: "network", title: "Offer a 10-minute talk at the next network meeting" },
          ],
        },
        {
          weekNumber: 4,
          focus: "Follow up",
          activities: [
            { id: "w4-followup", channelId: "linkedin", title: "Follow up everyone you met, with one clear offer" },
            { id: "w4-referral", channelId: "network", title: "Ask each customer for one referral" },
          ],
        },
      ],
    };
  }

  return {
    headline: {
      text: "Sluta jaga kvitton. Få två dagar tillbaka varje månadsskifte.",
      quote: "Vi lägger minst två hela dagar varje månadsskifte på att jaga kvitton. Absolut ett problem.",
      source: s.calls,
    },
    supporting: [
      {
        text: "Byggt i Sverige för svenska byråer, enkelt nog att komma igång samma dag.",
        quote: "Vi har testat liknande lösningar förut men ingen har varit svensk och enkel nog.",
        source: s.calls,
      },
      {
        text: "Kunderna laddar upp via en sms-länk. Inget konto, ingen app.",
        source: s.scope,
      },
      {
        text: "1 190 kr i månaden exklusive moms, prövat mot vad byråerna själva sagt.",
        source: s.price,
      },
    ],
    channels: [
      {
        id: "linkedin",
        name: "LinkedIn",
        verdict: "recommended",
        why: "Ägarna till byråer med 5–19 anställda finns där, och kundprofilen säger att det är de som bestämmer.",
        source: s.profile,
      },
      {
        id: "network",
        name: "Branschnätverk för redovisningskonsulter",
        verdict: "recommended",
        why: "Byråer litar på andra byråer. En kort dragning där når många beslutsfattare på en gång.",
        source: s.calls,
      },
      {
        id: "instagram",
        name: "Instagram och TikTok",
        verdict: "notNow",
        why: "Byråägare letar inte leverantörer där. Vänta tills de två första kanalerna fungerar.",
      },
    ],
    weeks: [
      {
        weekNumber: 1,
        focus: "Synas",
        activities: [
          { id: "w1-profile", channelId: "linkedin", title: "Uppdatera LinkedIn-profilen kring huvudbudskapet" },
          { id: "w1-post", channelId: "linkedin", title: "Inlägg: två förlorade dagar varje månadsskifte" },
        ],
      },
      {
        weekNumber: 2,
        focus: "Träffa folk",
        activities: [
          { id: "w2-network", channelId: "network", title: "Gå med i nätverket och presentera dig" },
          { id: "w2-pilots", channelId: "linkedin", title: "Be de tre pilotbyråerna bli betalande kunder" },
        ],
      },
      {
        weekNumber: 3,
        focus: "Bevis",
        activities: [
          { id: "w3-case", channelId: "linkedin", title: "Kort kundcase från en pilotbyrå (med lov)" },
          { id: "w3-talk", channelId: "network", title: "Erbjud en tiominutersdragning på nästa nätverksträff" },
        ],
      },
      {
        weekNumber: 4,
        focus: "Följ upp",
        activities: [
          { id: "w4-followup", channelId: "linkedin", title: "Följ upp alla du träffat, med ett tydligt erbjudande" },
          { id: "w4-referral", channelId: "network", title: "Be varje kund om en rekommendation" },
        ],
      },
    ],
  };
}

const DRAFTS: Record<Locale, Record<string, { text: string; basedOn: Array<keyof (typeof SOURCES)["sv"]> }>> = {
  sv: {
    "w1-profile": {
      text: "Grundare av Kvittojakten. Jag hjälper redovisningsbyråer att sluta jaga kvitton, så att månadsskiftet tar timmar i stället för dagar.",
      basedOn: ["calls"],
    },
    "w1-post": {
      text:
        "”Vi lägger minst två hela dagar varje månadsskifte på att jaga kvitton.”\n\nDet sa en byråägare till mig i januari. Nio byråer har sagt samma sak.\n\nDärför bygger jag Kvittojakten: kunden får en sms-länk, laddar upp kvittot och byrån ser direkt vad som saknas.\n\nDriver du en byrå med 5–19 anställda? Jag visar gärna hur det fungerar på tio minuter.",
      basedOn: ["calls", "scope"],
    },
    "w2-network": {
      text: "Hej! Jag heter Sara och bygger Kvittojakten, ett svenskt verktyg för att samla in kvitton från byråns småföretagskunder via sms-länk. Jag vill gärna höra hur ni löser det i dag.",
      basedOn: ["calls", "scope"],
    },
    "w2-pilots": {
      text: "Hej! Tack för att ni testat Kvittojakten. Vill ni fortsätta som betalande kund för 1 190 kr i månaden? Allt ni lagt upp finns kvar.",
      basedOn: ["price"],
    },
    "w3-case": {
      text: "En av våra pilotbyråer samlade in kvittona från sina minsta kunder på en förmiddag i stället för två dagar. Så här gjorde de:",
      basedOn: ["calls", "scope"],
    },
    "w3-talk": {
      text: "Förslag på dragning (10 min): ”Två dagar varje månadsskifte” — vad nio byråer berättat om kvittojakten, och hur en sms-länk löser det.",
      basedOn: ["calls"],
    },
    "w4-followup": {
      text: "Hej! Tack för samtalet förra veckan. Vill ni testa Kvittojakten på era tre största kunder den här månaden? Jag sätter upp det åt er på tio minuter.",
      basedOn: ["calls", "price"],
    },
    "w4-referral": {
      text: "Hej! Vad roligt att Kvittojakten sparar er tid. Känner ni en byrå till som jagar kvitton varje månadsskifte? Då hör jag gärna av mig till dem.",
      basedOn: ["calls"],
    },
  },
  en: {
    "w1-profile": {
      text: "Founder of Kvittojakten. I help accounting firms stop chasing receipts, so month-end takes hours instead of days.",
      basedOn: ["calls"],
    },
    "w1-post": {
      text:
        "“We spend at least two full days every month-end chasing receipts.”\n\nA firm owner told me that in January. Nine firms have said the same.\n\nThat's why I'm building Kvittojakten: the client gets a text-message link, uploads the receipt and the firm sees right away what's missing.\n\nDo you run a firm with 5–19 employees? I'm happy to show you how it works in ten minutes.",
      basedOn: ["calls", "scope"],
    },
    "w2-network": {
      text: "Hi! I'm Sara and I'm building Kvittojakten, a Swedish tool for collecting receipts from a firm's small-business clients through a text-message link. I'd love to hear how you handle it today.",
      basedOn: ["calls", "scope"],
    },
    "w2-pilots": {
      text: "Hi! Thanks for trying Kvittojakten. Would you like to continue as a paying customer for SEK 1,190 a month? Everything you've uploaded stays.",
      basedOn: ["price"],
    },
    "w3-case": {
      text: "One of our pilot firms collected the receipts from its smallest clients in a morning instead of two days. Here's how they did it:",
      basedOn: ["calls", "scope"],
    },
    "w3-talk": {
      text: "Suggested talk (10 min): “Two days every month-end” — what nine firms said about chasing receipts, and how a text-message link solves it.",
      basedOn: ["calls"],
    },
    "w4-followup": {
      text: "Hi! Thanks for the call last week. Would you like to try Kvittojakten on your three biggest clients this month? I'll set it up for you in ten minutes.",
      basedOn: ["calls", "price"],
    },
    "w4-referral": {
      text: "Hi! Great to hear Kvittojakten saves you time. Do you know another firm that chases receipts every month-end? I'd be happy to reach out to them.",
      basedOn: ["calls"],
    },
  },
};

/** Hur många veckors utfall som syns i Saras nuvarande moment. */
function revealedWeeks(): number {
  const beatIndex = useDemoStore.getState().beatIndex;
  const after = findBeatIndexById("11-forsta-kunderna-efter");
  if (after !== -1 && beatIndex >= after) return 4;
  const running = findBeatIndexById("11-forsta-kunderna-korning");
  if (running !== -1 && beatIndex >= running) return 2;
  return 0;
}

export const demoMarketingProvider: MarketingProvider = {
  async getPlan(locale) {
    const plan = basePlan(locale);
    const shown = revealedWeeks();
    return {
      ...plan,
      weeks: plan.weeks.map((week, index) =>
        index < shown ? { ...week, outcome: { ...OUTCOMES[locale][index], source: SOURCES[locale].plan } } : week,
      ),
    };
  },

  async draftContent(activityId, locale): Promise<ContentDraft> {
    const draft = DRAFTS[locale][activityId];
    const activity = basePlan(locale)
      .weeks.flatMap((week) => week.activities)
      .find((item) => item.id === activityId);
    if (!draft || !activity) throw new UnknownMarketingActivityError(activityId);
    return {
      activityId,
      channelId: activity.channelId,
      text: draft.text,
      basedOn: draft.basedOn.map((key) => SOURCES[locale][key]),
    };
  },

  // Demot sparar inget: utfallen är förskrivna och följer Saras moment.
  async reportOutcome(activityId: string, outcome: MarketingOutcome) {
    void outcome;
    const exists = basePlan("sv")
      .weeks.flatMap((week) => week.activities)
      .some((item) => item.id === activityId);
    if (!exists) throw new UnknownMarketingActivityError(activityId);
  },
};
