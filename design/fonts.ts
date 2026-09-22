import localFont from "next/font/local";

// Självhostade typsnittsfiler under design/fonts/ — inget hämtas från en CDN
// vid vare sig build eller körning, så demot fungerar utan internet.

// Castoro är --font-sans (brödtext/rubriker). Bara vikt 400 finns
// (@fontsource/castoro har ingen fetare snitt) — font-bold/font-extrabold är
// därför borttaget från alla rubriker (Formgivningspass mot artefakten,
// uppgift 1). Hierarkin byggs i stället med grad, radavstånd och kursiv,
// som i artefakten. Se DESIGN.md.
export const sans = localFont({
  src: "./fonts/castoro/Castoro-Regular.woff2",
  variable: "--font-sans",
  weight: "400",
  display: "swap",
});

export const serifItalic = localFont({
  src: "./fonts/instrument-serif/InstrumentSerif-Italic.woff2",
  variable: "--font-serif-italic",
  weight: "400",
  style: "italic",
  display: "swap",
});
