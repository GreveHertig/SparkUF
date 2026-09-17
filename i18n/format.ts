import type { Locale } from "./context";

// en-GB (inte en-US) ger "14 September" i stället för "September 14", vilket
// är formatet uppdraget kräver.
const localeTag: Record<Locale, string> = {
  sv: "sv-SE",
  en: "en-GB",
};

/** "4,2 Mkr" (sv) / "SEK 4.2M" (en) — beloppet anges i kronor. */
export function formatSek(amountInKr: number, locale: Locale): string {
  const millions = amountInKr / 1_000_000;
  const number = new Intl.NumberFormat(localeTag[locale], {
    maximumFractionDigits: 1,
    minimumFractionDigits: millions !== 0 && Math.abs(millions) < 100 ? 1 : 0,
  }).format(millions);

  return locale === "sv" ? `${number} Mkr` : `SEK ${number}M`;
}

/** "14 september" (sv) / "14 September" (en). */
export function formatDate(iso: string, locale: Locale): string {
  const date = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat(localeTag[locale], {
    day: "numeric",
    month: "long",
  }).format(date);
}

/** "312" / "312" — samma i båda språken, men via Intl för tusentalsavgränsare. */
export function formatCount(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag[locale]).format(value);
}
