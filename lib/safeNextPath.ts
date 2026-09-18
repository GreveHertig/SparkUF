/**
 * Skydd mot open redirect: efter inloggning/utloggning accepteras bara mål
 * som faktiskt hör till plattformen. Delas av proxy.ts (optimistisk
 * omdirigering) och app/(auth)/actions.ts (Server Actions) så regeln bara
 * finns på ett ställe.
 */
export function safeNextPath(path: string | null | undefined, fallback = "/app"): string {
  if (typeof path !== "string") return fallback;
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (!(path.startsWith("/app") || path.startsWith("/start"))) return fallback;
  return path;
}
