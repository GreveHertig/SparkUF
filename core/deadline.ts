/**
 * Sista ansökningsdag ur en artikels text (Pulsen v3, docs/moduler/min-plan.md).
 * Ren funktion utan modell: bara ett datum som står direkt efter en tydlig
 * fras ("sista ansökningsdag", "ansök senast", "senast den" …) räknas. Allt
 * annat ger `null`, aldrig en gissning. Datumets källa är artikeln.
 */

const MONTHS: Record<string, number> = {
  januari: 1, jan: 1,
  februari: 2, feb: 2,
  mars: 3, mar: 3,
  april: 4, apr: 4,
  maj: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  augusti: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  oktober: 10, okt: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

/** Fraser som måste stå strax före datumet. Gemener. */
const CUES = [
  "sista ansökningsdag",
  "sista ansökningsdagen",
  "sista dag att ansöka",
  "sista dag att söka",
  "sista dagen att ansöka",
  "sista dagen att söka",
  "ansök senast",
  "sök senast",
  "ansökan ska vara inne senast",
  "ansökan måste vara inne senast",
  "ansökningstiden går ut",
  "ansökningsperioden stänger",
  "utlysningen stänger",
  "senast den",
  "deadline",
];

/** Så långt efter frasen får datumet stå, i tecken. */
const WINDOW = 40;

/** Längst så här långt fram räknas ett datum, i dagar. Annat är troligen fel. */
const MAX_DAYS_AHEAD = 400;

function iso(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

/** Ett datum i början av `text`: "30 november 2026", "30 nov", "2026-11-30" eller "30/11". */
function parseDateAtStart(text: string, todayIso: string): string | null {
  const today = todayIso.slice(0, 10);
  const thisYear = Number(today.slice(0, 4));
  const withYear = (year: number | null, month: number, day: number): string | null => {
    if (year !== null) return iso(year, month, day);
    // Utan år: i år, eller nästa år om datumet redan har passerat.
    const candidate = iso(thisYear, month, day);
    if (candidate && candidate >= today) return candidate;
    return iso(thisYear + 1, month, day);
  };

  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return iso(Number(match[1]), Number(match[2]), Number(match[3]));

  match = text.match(/^(\d{1,2})\s+([a-zåäö]+)\.?(?:\s+(\d{4}))?/u);
  if (match && MONTHS[match[2]]) {
    return withYear(match[3] ? Number(match[3]) : null, MONTHS[match[2]], Number(match[1]));
  }

  match = text.match(/^(\d{1,2})\/(\d{1,2})(?:\s+(\d{4}))?/);
  if (match) return withYear(match[3] ? Number(match[3]) : null, Number(match[2]), Number(match[1]));

  return null;
}

/**
 * Första sista ansökningsdag i texten som ligger från och med `todayIso`
 * och högst ett drygt år fram, som "YYYY-MM-DD". Annars `null`.
 */
export function extractDeadline(text: string, todayIso: string): string | null {
  const lower = text.toLocaleLowerCase("sv-SE").replace(/\s+/g, " ");
  const today = todayIso.slice(0, 10);
  const latest = new Date(Date.parse(`${today}T00:00:00Z`) + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  for (const cue of CUES) {
    let from = 0;
    for (;;) {
      const at = lower.indexOf(cue, from);
      if (at < 0) break;
      from = at + cue.length;
      const after = lower.slice(from, from + WINDOW);
      // Hoppa över ord som "är", "den", ":" och "-" mellan frasen och datumet.
      for (let i = 0; i < after.length; i++) {
        if (!/\d/.test(after[i])) continue;
        const date = parseDateAtStart(after.slice(i), today);
        if (date && date >= today && date <= latest) return date;
        break;
      }
    }
  }
  return null;
}
