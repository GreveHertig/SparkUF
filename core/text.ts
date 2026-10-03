/**
 * Extern text: ta bort styr-, format- (nollbredd, bidi) och radseparatortecken,
 * kollapsa blanksteg, korta på teckenvärden (delar aldrig ett surrogatpar).
 * Delas av Registret och Utskick-förberedelsen. All text från en extern källa
 * är data, aldrig instruktion.
 */
export function cleanText(text: string, max: number): string {
  const flat = text.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]+/gu, " ").replace(/\s+/g, " ").trim();
  const chars = Array.from(flat);
  return chars.length > max ? `${chars.slice(0, max - 1).join("").trimEnd()}…` : flat;
}

/**
 * Som `cleanText`, men behåller radbrytningar (högst en tom rad i följd). För
 * samtalstext som visas som ren text, t.ex. Medgrundarens svar. Tar bort styr-
 * och formattecken (nollbredd, bidi) och kortar på teckenvärden.
 */
export function cleanMultilineText(text: string, max: number): string {
  const normalized = text
    .replace(/\r\n?|[\p{Zl}\p{Zp}]/gu, "\n")
    .replace(/[\p{Cc}\p{Cf}]/gu, (char) => (char === "\n" ? "\n" : " "))
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const chars = Array.from(normalized);
  return chars.length > max ? `${chars.slice(0, max - 1).join("").trimEnd()}…` : normalized;
}
