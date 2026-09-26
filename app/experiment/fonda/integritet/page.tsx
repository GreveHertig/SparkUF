"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { useI18n } from "@/i18n/context";

/** Den korta integritetstexten som mejlfältet på /experiment/fonda länkar till. */
export default function FondaPrivacyPage() {
  const { t } = useI18n();
  const copy = t.experimentFonda;

  return (
    <>
      <header className="fd-nav">
        <div className="fd-nav__inner">
          <Link href="/experiment/fonda" aria-label={copy.nav.home} className="fd-nav__logo">
            <Logo height={18} />
          </Link>
          <div className="fd-nav__actions">
            <LanguageSwitch />
          </div>
        </div>
      </header>

      <main className="fd-section fd-section--paper">
        <article className="fd-wrap fd-privacy" aria-labelledby="fd-privacy-title">
          <h1 id="fd-privacy-title" className="fd-h2">
            {copy.privacy.title}
          </h1>
          <p className="fd-lede">{copy.privacy.intro}</p>
          {copy.privacy.sections.map((section) => (
            <section key={section.heading} className="fd-privacy__section">
              <h2 className="fd-privacy__heading">{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          <Link href="/experiment/fonda#besked" className="fd-btn fd-btn--secondary fd-privacy__back">
            {copy.privacy.back}
          </Link>
        </article>
      </main>

      <footer className="fd-footer">
        <div className="fd-wrap fd-footer__inner">
          <Logo height={16} />
          <p>{copy.footer.note}</p>
        </div>
      </footer>
    </>
  );
}
