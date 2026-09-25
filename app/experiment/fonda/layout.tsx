import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./fonda.css";

// Designexperiment på grenen experiment/landning-fonda. Mergas aldrig, och ska
// inte indexeras om den någon gång råkar köras publikt.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function FondaLayout({ children }: { children: ReactNode }) {
  return <div className="fd">{children}</div>;
}
