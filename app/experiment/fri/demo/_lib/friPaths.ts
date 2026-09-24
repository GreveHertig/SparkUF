// Sökvägar i kopian. Rundturens stopp (adapters/demo/tourSteps.ts) pekar på
// det riktiga demots rutter; toFriRoute översätter dem till kopians, så att
// rundturen stannar i kopian.

export const FRI_DEMO_BASE = "/experiment/fri/demo";
export const FRI_DEMO_START = `${FRI_DEMO_BASE}/start`;

export function toFriRoute(realRoute: string): string {
  if (realRoute === "/demo/app") return FRI_DEMO_BASE;
  if (realRoute.startsWith("/demo/app/")) return `${FRI_DEMO_BASE}/${realRoute.slice("/demo/app/".length)}`;
  if (realRoute.startsWith("/demo/start")) return `${FRI_DEMO_START}${realRoute.slice("/demo/start".length)}`;
  return realRoute;
}

export function isInFriStart(pathname: string | null): boolean {
  return pathname?.startsWith(FRI_DEMO_START) ?? false;
}
