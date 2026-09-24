"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { FRI_DEMO_START } from "../_lib/friPaths";

/** Ingångsvalet i kopian (= /demo/start, screens/OnboardingEntry). */
export default function FriStartPage() {
  const { t } = useI18n();
  const setEntry = useDemoStore((state) => state.setEntry);
  const cards = [
    { entry: "noIdea" as const, copy: t.onboarding.entry.noIdea, href: `${FRI_DEMO_START}/profil` },
    { entry: "hasIdea" as const, copy: t.onboarding.entry.hasIdea, href: `${FRI_DEMO_START}/ide` },
  ];

  return (
    <div className="fri-start-entry">
      <h1 className="fri-display fri-start-title">{t.onboarding.entry.title}</h1>
      <p className="fri-lead" style={{ marginTop: 20 }}>
        {t.onboarding.entry.subtitle}
      </p>
      <div className="fri-entry-cards" data-tour-id="entry-cards">
        {cards.map((card) => (
          <Link key={card.entry} href={card.href} className="fri-entry-card" onClick={() => setEntry(card.entry)}>
            <span className="title">{card.copy.title}</span>
            <span className="fri-muted">{card.copy.body}</span>
            <span className="cta">{card.copy.cta}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
