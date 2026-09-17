import { z } from "zod";
import { KällaSchema } from "@/lib/schemas/evidence";
import { LEGAL_TOPIC_IDS, type LegalTopicId } from "@/adapters/live/legalSources";
import type { Bolagsform, JuridisktKrav } from "@/core/domain";

/** Speglar Bolagsform (types/legal.ts) — hålls i synk via kompileringskontrollen nedan. */
export const BolagsformSchema = z.enum([
  "enskild_firma",
  "aktiebolag",
  "handelsbolag",
  "ekonomisk_forening",
]);

// Typkontroll: om Bolagsform ändras i types/legal.ts utan att schemat följer med
// slutar den här filen kompilera (kontroll i båda riktningarna).
const _bolagsformSchemaMatchesType: Bolagsform[] = [] as z.infer<typeof BolagsformSchema>[];
const _bolagsformTypeMatchesSchema: z.infer<typeof BolagsformSchema>[] = [] as Bolagsform[];
void _bolagsformSchemaMatchesType;
void _bolagsformTypeMatchesSchema;

/**
 * Geminis svarsschema. Innehåller MEDVETET inget `källa`-fält — modellen kan
 * strukturellt inte producera en källa, en avgift, en deadline eller en
 * myndighet. `.strict()` gör att om modellen ändå bifogar extra fält
 * (t.ex. en påhittad url) så misslyckas valideringen i stället för att fältet
 * tyst plockas bort. Se adapters/live/legalSources.ts för varför.
 */
export const GeminiKravSchema = z
  .object({
    topicId: z.enum(LEGAL_TOPIC_IDS as [LegalTopicId, ...LegalTopicId[]]),
    rubrik: z.string().min(3).max(120),
    beskrivning: z.string().min(10).max(600),
    tillamplighet: z.enum(["applicable", "not_applicable"]),
  })
  .strict()
  .refine((krav) => !/(https?:\/\/|www\.)/i.test(krav.rubrik), {
    message: "rubrik får inte innehålla en url — modellen ska aldrig ange en källa själv.",
    path: ["rubrik"],
  })
  .refine((krav) => !/(https?:\/\/|www\.)/i.test(krav.beskrivning), {
    message: "beskrivning får inte innehålla en url — modellen ska aldrig ange en källa själv.",
    path: ["beskrivning"],
  });

export const GeminiSvarSchema = z
  .object({
    krav: z.array(GeminiKravSchema).max(25),
  })
  .strict();

export type GeminiSvar = z.infer<typeof GeminiSvarSchema>;

/**
 * Slutgiltigt domänschema — det som faktiskt lämnar adaptern. Bygger på
 * `KällaSchema` (lib/schemas/evidence.ts) så att Datalöftets krav ("inget
 * påstående utan källa") är strukturellt garanterat, inte bara förhoppning.
 */
export const JuridisktKravSchema = z.object({
  id: z.string().min(1),
  rubrik: z.string().min(1),
  beskrivning: z.string().min(1),
  gällerFör: z.array(BolagsformSchema).min(1),
  källa: KällaSchema.extend({
    namn: z.string().min(1),
    hämtad: z.iso.date(),
  }),
  status: z.enum(["uppfyllt", "ej_uppfyllt", "ej_tillämpligt"]),
  deadline: z.iso.date().optional(),
  kostnadKr: z.number().int().nonnegative().optional(),
  myndighet: z.string().min(1).optional(),
});

// Typkontroll: JuridisktKravSchema och JuridisktKrav (types/legal.ts) får inte glida isär.
const _kravCheck: JuridisktKrav[] = [] as z.infer<typeof JuridisktKravSchema>[];
void _kravCheck;
