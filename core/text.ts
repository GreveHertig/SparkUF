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
