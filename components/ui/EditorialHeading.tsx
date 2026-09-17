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
      className={cn(
        "text-4xl font-extrabold tracking-tight text-slate-900",
        className,
      )}
    >
      {children}
    </Component>
  );
}

function Em({ children }: { children: ReactNode }) {
  return (
    <em
      className="font-normal text-slate-800"
      style={{ fontFamily: "var(--font-serif-italic)", fontStyle: "italic" }}
    >
      {children}
    </em>
  );
}

EditorialHeading.Em = Em;
