"use client";

import Link from "next/link";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { OnboardingEntry as EntryChoice } from "@/core/domain";

export type OnboardingEntryData = {
  /** "/demo/start" eller "/start" — skärmen känner inte till vilket läge den är i. */
  basePath: string;
  /** Bara demot behöver veta vilken ingång som valdes (demoStore). Plattformen
   * har inget att spara det till än (P1). */
  onChoose?: (entry: EntryChoice) => void;
};

/**
 * Val av ingång (avsnitt 2.1, 6): två stora valkort. Ingen data att hämta —
 * bara navigation, så skärmen tar bara emot vart korten ska länka.
 */
export function OnboardingEntry({ data }: { data: OnboardingEntryData }) {
  const { t } = useI18n();
  const { basePath, onChoose } = data;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-16">
      <div className="text-center">
        <Eyebrow>{t.onboarding.entry.eyebrow}</Eyebrow>
        <EditorialHeading as="h1" className="mt-2">
          {t.onboarding.entry.title}
        </EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{t.onboarding.entry.subtitle}</p>
      </div>

      <div data-tour-id="entry-cards" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <EntryCard
          title={t.onboarding.entry.noIdea.title}
          body={t.onboarding.entry.noIdea.body}
          cta={t.onboarding.entry.noIdea.cta}
          href={`${basePath}/profil`}
          onClick={() => onChoose?.("noIdea")}
        />
        <EntryCard
          title={t.onboarding.entry.hasIdea.title}
          body={t.onboarding.entry.hasIdea.body}
          cta={t.onboarding.entry.hasIdea.cta}
          href={`${basePath}/ide`}
          onClick={() => onChoose?.("hasIdea")}
        />
      </div>
    </div>
  );
}

function EntryCard({
  title,
  body,
  cta,
  href,
  onClick,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-6 text-left shadow-lg transition-colors hover:border-accent-300 hover:bg-accent-50 focus-visible:outline-2 focus-visible:outline-accent-300",
      )}
      style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
    >
      <p className="text-2xl text-slate-900">{title}</p>
      <p className="text-sm leading-snug text-slate-600">{body}</p>
      <span className="mt-2 inline-flex w-fit items-center gap-1 text-sm font-semibold text-accent-700">
        {cta} →
      </span>
    </Link>
  );
}
