import { isPlaceholderError } from "@/core/errors";

/**
 * För data som bara kompletterar en sida (den personliga spelboken, Min plan,
 * en förifylld fråga): ett platshållarfel ger `null` som `orNull`, men även
 * ett äkta fel ger `null`, så att sidans huvudinnehåll visas ändå. Det äkta
 * felet loggas med namn och sammanhang, aldrig med sitt meddelande, eftersom
 * det kan bära databasens svar. Använd `orNull` för sidans huvudinnehåll.
 */
export function optional<T>(promise: Promise<T>, what: string): Promise<T | null> {
  return promise.catch((error) => {
    if (!isPlaceholderError(error)) {
      console.error(`${what}: kunde inte läsas (${error instanceof Error ? error.name : "okänt fel"}).`);
    }
    return null;
  });
}
