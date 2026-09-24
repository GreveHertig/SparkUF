import { z } from "zod";

/**
 * Svarsformen för Bolagsverkets API för värdefulla datamängder, VERIFIERAD mot
 * riktiga anrop 2026-09-23 (steg A, docs/dataspiken.md "Svarsformat, verifierat
 * mot riktiga anrop"). Till skillnad från lib/server/registrySchemas.ts är det
 * här inte en gissning, med undantagen som är märkta OVERIFIERAT nedan.
 *
 * Schemana är inte .strict(): svaret har ett fyrtiotal fält och Bolagsverket
 * kan lägga till fler utan förvarning. Zod släpper ändå aldrig igenom ett
 * okänt fält (standardläget tar bort dem), så bara det som står här når
 * transporten. Fält vi läser är .nullish() så att ett saknat delobjekt blir
 * "okänt" i stället för att hela bolaget faller bort.
 */

/** Token från portal.api.bolagsverket.se/oauth2/token (client credentials). */
export const TokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().regex(/^bearer$/i),
  expires_in: z.number().int().positive(),
});

/**
 * `fel` var null i varje delobjekt vi sett. Formen på ett ifyllt fel är
 * OVERIFIERAD, så allt som inte är null räknas som "uppgiften är felaktig".
 */
const fel = z.unknown().optional();

const CodeSchema = z.object({ kod: z.string(), klartext: z.string().nullish(), fel }).nullish();

export const OrganisationSchema = z.object({
  organisationsidentitet: z.object({
    identitetsbeteckning: z.string(),
    typ: z.object({ kod: z.string() }).nullish(),
  }),
  organisationsnamn: z
    .object({
      fel,
      organisationsnamnLista: z
        .array(z.object({ namn: z.string(), organisationsnamntyp: z.object({ kod: z.string() }).nullish() }))
        .nullish(),
    })
    .nullish(),
  /** Bolagsverkets kod, "AB" för aktiebolag. */
  organisationsform: CodeSchema,
  /** SCB:s kod, "49" = Övriga aktiebolag. */
  juridiskForm: CodeSchema,
  /** Alltid fem platser; tomma platser har kod = fem blanksteg. */
  naringsgrenOrganisation: z
    .object({ fel, sni: z.array(z.object({ kod: z.string(), klartext: z.string().nullish() })).nullish() })
    .nullish(),
  /** "JA" i alla svar vi sett. "NEJ" är OVERIFIERAT. */
  verksamOrganisation: CodeSchema,
  /** null i alla svar vi sett; formen när den är ifylld är OVERIFIERAD. */
  avregistreradOrganisation: z.unknown().optional(),
  pagaendeAvvecklingsEllerOmstruktureringsforfarande: z.unknown().optional(),
  /** null i alla svar vi sett; betydelsen av null och formen på en satt spärr är OVERIFIERADE. */
  reklamsparr: z.unknown().optional(),
  postadressOrganisation: z
    .object({
      fel,
      postadress: z.object({ postnummer: z.string().nullish(), postort: z.string().nullish() }).nullish(),
    })
    .nullish(),
  /** Extern fritext: alltid DATA, aldrig instruktion. */
  verksamhetsbeskrivning: z.object({ beskrivning: z.string().nullish(), fel }).nullish(),
});
export type RawOrganisation = z.infer<typeof OrganisationSchema>;

export const OrganisationerResponseSchema = z.object({ organisationer: z.array(OrganisationSchema) });

/**
 * `{ dokument: [] }` för alla tre bolagen i steg A. Formen på ett element är
 * OVERIFIERAD: det valideras bara som ett objekt och måste valideras på
 * riktigt innan något läses ur det (/dokument och iXBRL är uppskjutna).
 */
export const DokumentlistaResponseSchema = z.object({
  dokument: z.array(z.record(z.string(), z.unknown())),
});
