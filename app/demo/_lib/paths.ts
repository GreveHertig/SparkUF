/** Demots rutter. */
export const DEMO_BASE = "/demo";

export const DEMO_PATHS = {
  home: DEMO_BASE,
  start: `${DEMO_BASE}/start`,
  startProfile: `${DEMO_BASE}/start/profil`,
  startIdea: `${DEMO_BASE}/start/ide`,
  cofounder: `${DEMO_BASE}/medgrundaren`,
  journey: `${DEMO_BASE}/resan`,
  score: `${DEMO_BASE}/poang`,
  market: `${DEMO_BASE}/marknad`,
  validation: `${DEMO_BASE}/validering`,
  pulse: `${DEMO_BASE}/pulsen`,
  memory: `${DEMO_BASE}/minnet`,
  legal: `${DEMO_BASE}/juridik`,
  build: `${DEMO_BASE}/bygg`,
  businessPlan: `${DEMO_BASE}/affarsplan`,
  marketing: `${DEMO_BASE}/marknadsforing`,
} as const;

/** Sant på onboardingens sidor (ingen app-yta, inga steg). */
export function isStartPath(pathname: string | null): boolean {
  return pathname?.startsWith(DEMO_PATHS.start) ?? false;
}

/**
 * Rundturens stopp (adapters/demo/tourSteps.ts, orörd) har kvar det gamla
 * demots rutter (/demo/app/…). Översätter dem till demots rutter.
 */
export function toDemoPath(route: string): string {
  if (route === "/demo/start") return DEMO_PATHS.start;
  if (route === "/demo/app") return DEMO_PATHS.home;
  if (route.startsWith("/demo/app/")) return `${DEMO_BASE}/${route.slice("/demo/app/".length)}`;
  return DEMO_PATHS.home;
}
