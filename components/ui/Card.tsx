import type { HTMLAttributes, ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";
import { cn } from "@/design/cn";

type CardProps = {
  /** Rubriken, satt i samma `Eyebrow`-stil som resten av gränssnittet redan
   * använder som sektionsrubrik — inte en ny rubriknivå. */
  title?: ReactNode;
  /** Högerjusterat innehåll bredvid rubriken, t.ex. en kort not eller siffra
   * (artefaktens `chead(titel, höger)`). */
  right?: ReactNode;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>;

/**
 * Delat kortskal (artefaktens `card`/`chead`): vit yta, kant, skugga, en
 * valfri rubrikrad. Ersätter den upprepade
 * `rounded-md border border-slate-200 bg-white p-4 shadow-lg`-koden som
 * fanns på över tio ställen innan omgörningen mot artefaktens komposition.
 */
export function Card({ title, right, children, className, ...rest }: CardProps) {
  return (
    <section className={cn("rounded-md border border-slate-200 bg-white p-4 shadow-lg", className)} {...rest}>
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <Eyebrow>{title}</Eyebrow>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
