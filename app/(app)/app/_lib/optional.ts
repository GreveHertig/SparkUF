import { unstable_rethrow } from "next/navigation";
import { isPlaceholderError } from "@/core/errors";

/**
 * För data som bara kompletterar en sida (den personliga spelboken, Min plan,
 * en förifylld fråga): ett platshållarfel ger `null` som `orNull`, men även
 * ett äkta fel ger `null`, så att sidans huvudinnehåll visas ändå. Det äkta
 * felet loggas med namn och sammanhang, aldrig med sitt meddelande, eftersom
 * det kan bära databasens svar. Använd `orNull` för sidans huvudinnehåll.
 *
 * Nexts egna signaler kastas alltid vidare (`unstable_rethrow`,
 * node_modules/next/dist/docs/01-app/03-api-reference/04-functions/unstable_rethrow.md):
 * `cookies()` under förrenderingen i `pnpm build` (DynamicServerError, som
 * gör sidan dynamisk), `redirect()` och `notFound()`. Annars sväljs signalen,
 * loggas som "kunde inte läsas (Error)", och en sida med bara `optional`
 * kunde förrenderas statiskt med tomma data.
 */
export function optional<T>(promise: Promise<T>, what: string): Promise<T | null> {
  return promise.catch((error) => {
    unstable_rethrow(error);
    if (!isPlaceholderError(error)) {
      console.error(`${what}: kunde inte läsas (${error instanceof Error ? error.name : "okänt fel"}).`);
    }
    return null;
  });
}
