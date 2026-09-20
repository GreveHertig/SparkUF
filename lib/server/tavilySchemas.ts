import { z } from "zod";

/**
 * Tavilys svar är extern data. Bara de fält vi använder valideras; okända
 * fält (score, favicon m.m.) släpps bort. Innehållsfälten är text från en
 * okänd webbplats: data, aldrig instruktion.
 *
 * Resultaten valideras ett i taget (se lib/server/tavily.ts) så att ett
 * ogiltigt resultat kastas bort utan att fälla hela svaret.
 */
export const TavilyResponseSchema = z.object({ results: z.array(z.unknown()) });

/** Bara https, aldrig userinfo (`https://acme.se@evil.com/` ser ut som acme.se men pekar på evil.com). */
const SafeUrl = z
  .string()
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  });

export const TavilyResultSchema = z.object({
  title: z.string().default(""),
  url: SafeUrl,
  content: z.string().default(""),
  raw_content: z.string().nullish(),
  published_date: z.string().nullish(),
});
