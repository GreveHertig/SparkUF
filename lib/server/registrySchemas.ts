import { z } from "zod";

/**
 * Svarsformen från SCB:s allmänna företagsregister-API, AFR
 * (https://apiafr.scb.se/swagger/v1/swagger.json). Verifierad mot riktiga
 * anrop 2026-09-30, se docs/dataspiken.md, "SCB AFR, provkörning 2026-09-30".
 * Ersätter de tidigare antagandena om en `{ companies: [...] }`-lista.
 *
 * Bara fälten vi läser valideras. Övriga fält (postAdress, kommunSate,
 * telefon- och e-postspärr med flera) släpps igenom av schemat men läses
 * aldrig och lämnar aldrig transporten. Allt är DATA, aldrig instruktion.
 *
 * Kodtabellerna (samma källa):
 * - anstKl: 0 uppgift saknas, 1 = 0, 2 = 1–4, 3 = 5–9, 4 = 10–19, 5 = 20–49,
 *   6 = 50–99, 7 = 100–199, 8 = 200–499, 9 = 500–999, 10 = 1000–1499,
 *   11 = 1500–1999, 12 = 2000–2999, 13 = 3000–3999, 14 = 4000–4999,
 *   15 = 5000–9999, 16 = 10000–
 * - jurform: 41, 42, 43, 49 aktiebolag; 10 fysiska personer; 91 dödsbon
 * - ftgStat: 0 aldrig verksam, 1 verksam, 9 inte längre verksam
 * - reklamSparrTyp: 1 tar emot reklam, 2 har frånsagt sig reklam
 * - lanSate: 01–25, 00 län okänt, 99 ej svenskt län
 */

/** SCB:s koder för aktiebolag (jurformkoder). */
export const AKTIEBOLAG_JURFORM = new Set(["41", "42", "43", "49"]);
/** Fysiska personer och dödsbon: lämnar aldrig transporten (dataspiken §6 fråga 4). */
export const PERSON_JURFORM = new Set(["10", "91"]);

/** Kod som sträng; API:t ger strängar, men ett tal godtas och görs om. */
const code = z.union([z.string(), z.number()]).transform((value) => String(value).trim());

export const AfrLegalUnitSchema = z.object({
  orgNr: z.string().regex(/^\d{10}$/),
  namn: z.string(),
  primarNaringsgren: z
    .object({
      naringsgren: code,
      rangordning: z.number().optional(),
    })
    .nullable()
    .optional(),
  lanSate: code.nullable().optional(),
  anstKl: code.nullable().optional(),
  ftgStat: code.nullable().optional(),
  jurform: code.nullable().optional(),
  reklamSparrTyp: z.union([z.number(), z.string()]).nullable().optional(),
});
export type AfrLegalUnit = z.infer<typeof AfrLegalUnitSchema>;

export const AfrPageSchema = z.object({
  jes: z.array(z.unknown()),
  pagination: z.object({
    nextCursorId: z.union([z.number(), z.string()]).nullable().optional(),
    limit: z.number().optional(),
    hasMore: z.boolean(),
  }),
});

export const AfrCountSchema = z.object({ count: z.number().int().nonnegative() });

/** Storleksklasserna i AFR som antal anställda. `null` = uppgift saknas. */
export const EMPLOYEE_CLASSES: Readonly<Record<string, { min: number; max: number }>> = {
  "1": { min: 0, max: 0 },
  "2": { min: 1, max: 4 },
  "3": { min: 5, max: 9 },
  "4": { min: 10, max: 19 },
  "5": { min: 20, max: 49 },
  "6": { min: 50, max: 99 },
  "7": { min: 100, max: 199 },
  "8": { min: 200, max: 499 },
  "9": { min: 500, max: 999 },
  "10": { min: 1000, max: 1499 },
  "11": { min: 1500, max: 1999 },
  "12": { min: 2000, max: 2999 },
  "13": { min: 3000, max: 3999 },
  "14": { min: 4000, max: 4999 },
  "15": { min: 5000, max: 9999 },
  "16": { min: 10000, max: Number.POSITIVE_INFINITY },
};

/** Länskoderna (SCB:s lankoder). 00 och 99 finns inte här: de betyder okänt. */
export const COUNTY_NAMES: Readonly<Record<string, string>> = {
  "01": "Stockholms län",
  "03": "Uppsala län",
  "04": "Södermanlands län",
  "05": "Östergötlands län",
  "06": "Jönköpings län",
  "07": "Kronobergs län",
  "08": "Kalmar län",
  "09": "Gotlands län",
  "10": "Blekinge län",
  "12": "Skåne län",
  "13": "Hallands län",
  "14": "Västra Götalands län",
  "17": "Värmlands län",
  "18": "Örebro län",
  "19": "Västmanlands län",
  "20": "Dalarnas län",
  "21": "Gävleborgs län",
  "22": "Västernorrlands län",
  "23": "Jämtlands län",
  "24": "Västerbottens län",
  "25": "Norrbottens län",
};

/** Stockholms län, som etiketten "Finns i Stockholms län" lovar. */
export const STOCKHOLM_COUNTY_CODE = "01";
