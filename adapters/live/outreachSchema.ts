import { z } from "zod";

/**
 * Geminis svar vid mejlsökningen. `.strict()` och ett strukturellt SAKNAT
 * url-/källfält: modellen kan inte ange en källa (den injiceras i kod från
 * Tavily-träffen), och ett smugglat extrafält gör att valideringen kastar i
 * stället för att fältet tyst plockas bort.
 */
export const EmailCandidatesSchema = z
  .object({
    candidates: z.array(z.object({ address: z.string().min(6).max(254) }).strict()).max(5),
  })
  .strict();

export type EmailCandidates = z.infer<typeof EmailCandidatesSchema>;
