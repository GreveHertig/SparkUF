import { z } from "zod";

/**
 * ANTAGANDEN — allt i den här filen är en OVERIFIERAD gissning om hur
 * Bolagsverkets och SCB:s API:er svarar. Vi har varken nycklar eller
 * API-specifikation (docs/dataspiken.md §6 rad 2–3; portalen gav 403).
 * Fälten är härledda ur vad dataspiken säger att registret innehåller (SCB:s
 * lista över 15 variabler, iXBRL-nyckeltal), inte ur ett faktiskt svar.
 *
 * När spiken är gjord (docs/dataspiken.md §3, "Föreslagen ordning") ska DEN
 * HÄR FILEN och lib/server/scb.ts + bolagsverket.ts skrivas om mot det
 * verkliga svaret. Adapterns domänlogik (filtrering, källstämpling, ärlighet
 * kring luckor) ska då inte behöva röras. Kontraktstestet grönt mot dessa
 * scheman bevisar vår mappning, inte att Bolagsverket/SCB ser ut så här.
 *
 * Uppdatering 2026-09-23: Bolagsverkets /organisationer och /dokumentlista är
 * verifierade mot riktiga anrop och ligger i lib/server/bolagsverketSchemas.ts.
 * Det som står här gäller fortfarande SCB:s bolagslista (RegistryRow) och
 * iXBRL-nyckeltalen (AnnualFigures), och båda är fortfarande gissningar.
 * AKTIEBOLAG_FORM = "AB" stämmer med Bolagsverkets organisationsform.kod.
 */

/** ANTAGANDE: bolagsformskoden för aktiebolag i registret. */
export const AKTIEBOLAG_FORM = "AB";

/** ANTAGANDE: en rad ur bolagsregistret (SCB/Bolagsverket). */
export const RegistryRowSchema = z
  .object({
    orgNr: z.string().regex(/^\d{10}$/),
    name: z.string().min(1),
    legalForm: z.string().min(1),
    sniCode: z.string().min(1),
    /** Null = okänt (SCB ger bara storleksklass; se dataspiken §2). */
    employees: z.number().int().nonnegative().nullable(),
    /** Null = går inte att härleda. Län är inget eget fält i registret. */
    county: z.string().nullable(),
    /** Verksamhetsbeskrivning: extern text, alltid DATA aldrig instruktion. */
    description: z.string().nullable(),
    deregistered: z.boolean(),
    /** Reklamspärr (SCB-variabel, dataspiken §2). */
    advertisingBlock: z.boolean(),
  })
  .strict();
export type RegistryRow = z.infer<typeof RegistryRowSchema>;

export const RegistryRowsResponseSchema = z.object({ companies: z.array(RegistryRowSchema) }).strict();

/** ANTAGANDE: nyckeltal ur senaste och föregående årsredovisning (iXBRL). Null = saknas. */
export const AnnualFiguresSchema = z
  .object({
    orgNr: z.string().regex(/^\d{10}$/),
    revenueKsek: z.number().nullable(),
    previousRevenueKsek: z.number().nullable(),
  })
  .strict();
export type AnnualFigures = z.infer<typeof AnnualFiguresSchema>;

export const AnnualFiguresResponseSchema = z.object({ reports: z.array(AnnualFiguresSchema) }).strict();
