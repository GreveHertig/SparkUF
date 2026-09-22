import type { ElementType, ReactNode } from "react";
import { cn } from "@/design/cn";

type EditorialHeadingProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
};

/**
 * Redaktionell rubrik i Fonda-stil: sans-serif som grund, med enstaka ord
 * kursiverade i serif för betoning via <EditorialHeading.Em>. Anropande kod
 * väljer vilka ord som betonas per språk — inget markup-format i i18n-strängar.
 */
export function EditorialHeading({
  children,
  as: Component = "h2",
  className,
}: EditorialHeadingProps) {
  return (
    <Component
      className={cn("text-3xl leading-[1.15] tracking-tight", className)}
    >
      {children}
    </Component>
  );
}

function Em({ children }: { children: ReactNode }) {
  // Ingen egen textfärg — ärver alltid rubrikens färg. En hårdkodad färg här
  // skulle kunna krocka med en färg satt via EditorialHeadings className,
  // eftersom Tailwind-utiliteter avgörs av CSS-källordning, inte av vilken
  // klass som står sist i className-strängen.
  return (
    <em
      className="font-normal"
      style={{ fontFamily: "var(--font-serif-italic)", fontStyle: "italic" }}
    >
      {children}
    </em>
  );
}

EditorialHeading.Em = Em;
