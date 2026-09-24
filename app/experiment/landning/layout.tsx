import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./landning.css";

// Designexperiment på grenen experiment/landning-erik. Mergas aldrig, och ska
// inte indexeras om den någon gång råkar köras publikt.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ExperimentLandingLayout({ children }: { children: ReactNode }) {
  return children;
}
