import localFont from "next/font/local";

// Självhostade typsnittsfiler under design/fonts/ — inget hämtas från en CDN
// vid vare sig build eller körning, så demot fungerar utan internet.

export const sans = localFont({
  src: "./fonts/manrope/Manrope-Variable.woff2",
  variable: "--font-sans",
  weight: "400 800",
  display: "swap",
});

export const serifItalic = localFont({
  src: "./fonts/instrument-serif/InstrumentSerif-Italic.woff2",
  variable: "--font-serif-italic",
  weight: "400",
  style: "italic",
  display: "swap",
});
