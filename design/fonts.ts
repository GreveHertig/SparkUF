import localFont from "next/font/local";

// Självhostade typsnittsfiler under design/fonts/ — inget hämtas från en CDN
// vid vare sig build eller körning, så demot fungerar utan internet.

export const sans = localFont({
  src: "./fonts/funnel-display/FunnelDisplay-Variable.woff2",
  variable: "--font-sans",
  weight: "300 800",
  display: "swap",
});

export const serifItalic = localFont({
  src: "./fonts/instrument-serif/InstrumentSerif-Italic.woff2",
  variable: "--font-serif-italic",
  weight: "400",
  style: "italic",
  display: "swap",
});

export const mono = localFont({
  src: "./fonts/jetbrains-mono/JetBrainsMono-Variable.woff2",
  variable: "--font-mono",
  weight: "400 700",
  display: "swap",
});
