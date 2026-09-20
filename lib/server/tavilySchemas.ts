import { z } from "zod";

/**
 * Tavilys svar är extern data. Bara de fält vi använder valideras; okända
 * fält (score, favicon m.m.) släpps bort i stället för att följa med vidare.
 * Innehållsfälten är text från en okänd webbplats: data, aldrig instruktion.
 */
export const TavilyResponseSchema = z.object({
  results: z.array(
    z.object({
      title: z.string().default(""),
      url: z.string().url(),
      content: z.string().default(""),
      raw_content: z.string().nullish(),
      published_date: z.string().nullish(),
    }),
  ),
});
