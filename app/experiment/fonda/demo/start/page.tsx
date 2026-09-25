"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { FONDA_DEMO_PATHS } from "../_lib/paths";

/** Val av ingång: två vägar in i samma resa. */
export default function FondaDemoStartPage() {
  const { t } = useI18n();
  const copy = t.onboarding.entry;
  const setEntry = useDemoStore((state) => state.setEntry);

  const choices = [
    { entry: "noIdea" as const, href: FONDA_DEMO_PATHS.startProfile, ...copy.noIdea },
    { entry: "hasIdea" as const, href: FONDA_DEMO_PATHS.startIdea, ...copy.hasIdea },
  ];

  return (
    <div className="fdd-page fdd-onboarding">
      <header className="fdd-head fdd-head--center">
        <h1 className="fd-h2">{copy.title}</h1>
        <p className="fd-lede">{copy.subtitle}</p>
      </header>

      <div className="fdd-entries" data-tour-id="entry-cards">
        {choices.map((choice) => (
          <Link key={choice.entry} href={choice.href} onClick={() => setEntry(choice.entry)} className="fdd-entry">
            <span className="fdd-entry__title">{choice.title}</span>
            <span className="fdd-entry__body">{choice.body}</span>
            <span className="fdd-entry__cta">
              {choice.cta} <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
