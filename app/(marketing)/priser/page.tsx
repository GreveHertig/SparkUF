"use client";

import Link from "next/link";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";

type Tier = {
  name: string;
  price: string;
  priceUnit: string;
  description: string;
  features: string[];
  cta: string;
  badge?: string;
};

function TierCard({ tier, href, highlighted }: { tier: Tier; href: string; highlighted?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border p-6",
        highlighted ? "border-accent-600 bg-white shadow-lg" : "border-slate-200 bg-white",
      )}
    >
      {tier.badge && (
        <span
          className="mb-3 inline-flex w-fit items-center rounded-pill bg-accent-100 px-2.5 py-1 text-xs font-semibold uppercase text-accent-700"
          style={{ letterSpacing: "var(--tracking-label)" }}
        >
          {tier.badge}
        </span>
      )}
      <p className="text-lg font-bold text-slate-900">{tier.name}</p>
      <p className="mt-2 flex items-baseline gap-1">
        <span className="font-numeric text-3xl font-semibold text-slate-900">{tier.price}</span>
        {tier.priceUnit && <span className="text-sm text-slate-500">{tier.priceUnit}</span>}
      </p>
      <p className="mt-2 text-sm leading-snug text-slate-600">{tier.description}</p>
      <ul className="mt-5 flex flex-col gap-2">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
            <CheckIcon />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={cn(
          "mt-6 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors",
          highlighted
            ? "bg-accent-600 text-white hover:bg-accent-700"
            : "border border-slate-300 text-slate-900 hover:border-slate-500",
        )}
      >
        {tier.cta}
      </Link>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-score-green">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PricingPage() {
  const { t } = useI18n();

  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <Eyebrow>{t.pricingPage.eyebrow}</Eyebrow>
        <EditorialHeading as="h1" className="mt-3 text-4xl sm:text-5xl">
          {t.pricingPage.title}
        </EditorialHeading>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">{t.pricingPage.subtitle}</p>
        <span
          className="mt-4 inline-flex items-center rounded-pill border border-dashed border-slate-400 px-3 py-1 text-xs font-semibold uppercase text-slate-600"
          style={{ letterSpacing: "var(--tracking-label)" }}
        >
          {t.pricingPage.proposalNote}
        </span>
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        <TierCard tier={t.pricingPage.free} href="/skapa-konto" />
        <TierCard tier={t.pricingPage.founder} href="/skapa-konto" highlighted />
        <TierCard tier={t.pricingPage.build} href="/demo" />
      </div>

      <p className="mx-auto mt-14 max-w-3xl text-center text-sm text-slate-500">
        {t.pricingPage.faqLinkLabel}{" "}
        <Link href="/#faq" className="font-medium text-accent-700 underline">
          {t.landingPage.faq.eyebrow}
        </Link>
      </p>
    </div>
  );
}
