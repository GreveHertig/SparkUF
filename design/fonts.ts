import localFont from "next/font/local";

// Självhostade typsnittsfiler under design/fonts/ — inget hämtas från en CDN
// vid vare sig build eller körning, så demot fungerar utan internet.

// Tokenbyte (artefakten): Castoro är nu --font-sans (brödtext/rubriker).
// Bara vikt 400 finns (@fontsource/castoro har ingen fetare snitt) — fetstil
// (font-bold/font-extrabold på befintliga rubriker) blir därför webbläsarens
// syntetiska fetstil, inte ett riktigt snitt. Se DESIGN.md.
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

// Neutral sans för tabeller, diagramaxlar och nyckeltal (.font-numeric i
// app/globals.css) — Funnel Display, kvar från designuppdateringen men med ny
// roll. Ingen ny typsnittsfil hämtad för det här. JetBrains Mono (tidigare
// --font-mono) är borttagen: allt som använde den bytte till --font-data.
export const dataSans = localFont({
  src: "./fonts/funnel-display/FunnelDisplay-Variable.woff2",
  variable: "--font-data",
  weight: "300 800",
  display: "swap",
});
