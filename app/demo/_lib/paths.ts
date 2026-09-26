/** Demots rutter. */
export const FONDA_DEMO_BASE = "/demo";

export const FONDA_DEMO_PATHS = {
  home: FONDA_DEMO_BASE,
  start: `${FONDA_DEMO_BASE}/start`,
  startProfile: `${FONDA_DEMO_BASE}/start/profil`,
  startIdea: `${FONDA_DEMO_BASE}/start/ide`,
  cofounder: `${FONDA_DEMO_BASE}/medgrundaren`,
  journey: `${FONDA_DEMO_BASE}/resan`,
  score: `${FONDA_DEMO_BASE}/poang`,
  market: `${FONDA_DEMO_BASE}/marknad`,
  validation: `${FONDA_DEMO_BASE}/validering`,
  pulse: `${FONDA_DEMO_BASE}/pulsen`,
  memory: `${FONDA_DEMO_BASE}/minnet`,
  legal: `${FONDA_DEMO_BASE}/juridik`,
  build: `${FONDA_DEMO_BASE}/bygg`,
  businessPlan: `${FONDA_DEMO_BASE}/affarsplan`,
} as const;

export function journeyStepPath(stepNumber: number): string {
  return `${FONDA_DEMO_PATHS.journey}/${stepNumber}`;
}

/** Sant på onboardingens sidor (ingen app-yta, inga steg). */
export function isStartPath(pathname: string | null): boolean {
  return pathname?.startsWith(FONDA_DEMO_PATHS.start) ?? false;
}

/**
 * Rundturens stopp (adapters/demo/tourSteps.ts, orörd) har kvar det gamla
 * demots rutter (/demo/app/…). Översätter dem till demots rutter.
 */
export function toFondaPath(route: string): string {
  if (route === "/demo/start") return FONDA_DEMO_PATHS.start;
  if (route === "/demo/app") return FONDA_DEMO_PATHS.home;
  if (route.startsWith("/demo/app/")) return `${FONDA_DEMO_BASE}/${route.slice("/demo/app/".length)}`;
  return FONDA_DEMO_PATHS.home;
}
