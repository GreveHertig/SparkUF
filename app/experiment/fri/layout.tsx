import type { Metadata } from "next";
import type { ReactNode } from "react";
// Självhostade typsnitt via @fontsource (inget hämtas från en CDN).
import "@fontsource-variable/bricolage-grotesque/standard.css";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./fri.css";

// Designexperiment på grenen experiment/landning-fri. Mergas aldrig.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function FreeLandingLayout({ children }: { children: ReactNode }) {
  return children;
}
