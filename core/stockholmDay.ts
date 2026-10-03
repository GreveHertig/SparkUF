const ZONE = "Europe/Stockholm";

/** Hur många millisekunder Stockholms väggklocka ligger före UTC vid `at`. */
function stockholmOffsetMs(at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .map((part) => [part.type, part.value]),
  );
  const wall = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return wall - Math.floor(at.getTime() / 1000) * 1000;
}

/**
 * Midnatt i dag i Stockholm, som en UTC-tid i ISO-format. Används av
 * Medgrundarens dagliga kostnadstak (docs/beslut.md 2026-10-03), så att
 * "per dag" betyder grundarens kalenderdag och inte ett rullande dygn.
 * Klarar dagarna då sommartiden börjar eller slutar.
 */
export function stockholmDayStartIso(now: Date = new Date()): string {
  const offset = stockholmOffsetMs(now);
  const wallNow = new Date(now.getTime() + offset);
  const wallMidnight = Date.UTC(wallNow.getUTCFullYear(), wallNow.getUTCMonth(), wallNow.getUTCDate());
  // Offseten vid midnatt kan skilja sig från den nu (byte till eller från
  // sommartid under natten), så räkna om med offseten vid den gissade tiden.
  const guess = new Date(wallMidnight - offset);
  return new Date(wallMidnight - stockholmOffsetMs(guess)).toISOString();
}
