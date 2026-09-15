import { z } from "zod";

export const KällaSchema = z.object({
  namn: z.string().min(1),
  hämtad: z.string().date(),
  url: z.string().url().optional(),
});

export const BevisSchema = z.object({
  påstående: z.string().min(1),
  källa: KällaSchema,
  citat: z.string().optional(),
});

export const PoängDelNamn = z.enum([
  "Marknad",
  "Konkurrens",
  "Passform",
  "Problem",
  "Betalningsvilja",
  "Produkt",
  "Traktion",
  "Genomförbarhet",
]);

export const PoängDelSchema = z.object({
  namn: PoängDelNamn,
  vikt: z.number().positive(),
  poäng: z.number().min(0).max(100),
  underlag: z.array(BevisSchema),
});

export const PoängSchema = z.object({
  totalt: z.number().min(1).max(100),
  delar: z.array(PoängDelSchema),
  beräknad: z.string().date(),
});

export type BevisInput = z.infer<typeof BevisSchema>;
