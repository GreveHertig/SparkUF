/**
 * Sidomenyns ikoner (Formgivningspass mot artefakten, uppgift 2: "navigerings-
 * poster med ikoner"). Artefakten har bara sex navposter (Hem/Medgrundaren/
 * Marknaden/Valideringen/Bygget/Profilen) med egna ikoner i sitt eget
 * ICONS-register — vi har nio, så fyra (Resan/Poäng/Pulsen/Juridik) är nya
 * ikoner i samma visuella språk (24×24, stroke 1.9, ingen fyllning), inte
 * kopierade linjeformer ur artefakten.
 */
export type NavIconName =
  | "home"
  | "cofounder"
  | "journey"
  | "score"
  | "market"
  | "validation"
  | "pulse"
  | "memory"
  | "legal"
  | "build";

const PATHS: Record<NavIconName, string> = {
  home: "M4 11.5 12 4l8 7.5M6 10v9.5h5V15h2v4.5h5V10",
  cofounder: "M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4 4v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  journey: "M5 19c3 0 3-5 6-5s3 5 6 5M5 5c3 0 3 5 6 5s3-5 6-5M12 4v16",
  score: "M12 3v3M12 18v3M3 12h3M18 12h3M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M6.3 17.7l2.1-2.1M15.6 8.4l2.1-2.1",
  market: "M4 20V10M10 20V4M16 20v-7M4 20h16",
  validation: "M12 3 5 6v5c0 4.4 3 8.2 7 9 4-.8 7-4.6 7-9V6l-7-3Z",
  pulse: "M3 12h4l2-6 4 12 2-6h6",
  memory: "M9 4a4 4 0 0 0-3.9 5 3.5 3.5 0 0 0 0 6.8A4 4 0 1 0 13 18V6a4 4 0 0 0-4-2Zm6 2v12a4 4 0 1 0 3.9-5 3.5 3.5 0 0 0 0-6.8A4 4 0 0 0 15 6Z",
  legal: "M12 3v18M6 7l-3 6a3 3 0 0 0 6 0ZM18 7l-3 6a3 3 0 0 0 6 0ZM5 21h14M4 7l8-3 8 3",
  build: "m14.5 6.5-8 8a2.1 2.1 0 0 0 3 3l8-8M18 9l1.5-1.5a2.1 2.1 0 0 0-3-3L15 6M4 20l3-1 8.5-8.5-2-2L5 17l-1 3Z",
};

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={15}
      height={15}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
