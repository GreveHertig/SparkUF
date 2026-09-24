"use client";

import Link from "next/link";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { Logo } from "@/components/ui/Logo";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { formatCount } from "@/i18n/format";
import { ScoreProof } from "./ScoreProof";
import { SignupForm } from "./SignupForm";

// Platshållarpris enligt uppdraget för experimentet — märkt TBD på sidan.
// docs/uppdrag.md avsnitt 6 anger 199 kr/mån för Grundare; skillnaden är avsiktlig.
const PLACEHOLDER_PRICE_SEK = 149;

const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-8";

export default function ExperimentLandingPage() {
  const { locale, t } = useI18n();
  const copy = t.experimentLanding;

  return (
    <div className="xl-root flex min-h-[100dvh] flex-col">
      <header className={`${container} flex h-16 items-center justify-between gap-4`}>
        <Link href="/experiment/landning" aria-label={copy.nav.home} className="rounded-sm">
          <Logo height={17} />
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            href="/demo"
            className="text-[0.95rem] text-slate-700 underline decoration-slate-300 hover:text-ink-900 hover:decoration-ink-900"
          >
            {copy.hero.demoCta}
          </Link>
          <LanguageSwitch />
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero: vad Spark är, för vem, och mekanismen direkt i första vyn. */}
        <section className={`${container} grid items-center gap-12 pb-20 pt-10 sm:pt-16 lg:grid-cols-12 lg:gap-10 lg:pb-28`}>
          <div className="lg:col-span-7 lg:pr-6">
            <h1 className="max-w-[17ch] text-balance text-[clamp(2.35rem,1.35rem+3.3vw,4.15rem)] leading-[1.06] tracking-[-0.022em] text-ink-900">
              {copy.hero.titleBefore}
              <em className="xl-em">{copy.hero.titleEm}</em>
              {copy.hero.titleAfter}
            </h1>
            <p className="mt-6 max-w-[38ch] text-pretty text-lg leading-relaxed text-slate-700 sm:text-xl">
              {copy.hero.lead}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/demo"
                aria-describedby="xl-demo-note"
                className="xl-press inline-flex h-12 items-center rounded-pill bg-navy px-6 text-base text-paper-50 hover:bg-ink-900"
              >
                {copy.hero.demoCta}
              </Link>
              <a
                href="#besked"
                className="xl-press inline-flex h-12 items-center rounded-pill border border-slate-300 px-6 text-base text-ink-900 hover:border-ink-900"
              >
                {copy.hero.signupCta}
              </a>
            </div>
            <p id="xl-demo-note" className="mt-3 pl-1 text-sm">
              <span className="inline-block rounded-pill border border-dashed border-slate-400 px-2.5 py-0.5 text-slate-700">
                {copy.hero.demoNote}
              </span>
            </p>
          </div>
          <div className="lg:col-span-5">
            <ScoreProof />
          </div>
        </section>

        {/* Registret: samma fråga, tre svar. Inga siffror, bara formen. */}
        <section className="border-t border-slate-200">
          <div className={`${container} grid gap-10 py-20 lg:grid-cols-12 lg:gap-10 lg:py-28`}>
            <div className="lg:col-span-5">
              <h2 className="max-w-[16ch] text-balance text-[clamp(1.9rem,1.3rem+1.8vw,2.9rem)] leading-[1.1] tracking-[-0.018em] text-ink-900">
                {copy.register.title}
              </h2>
              <p className="xl-em mt-8 text-2xl text-slate-700">“{copy.register.question}”</p>
            </div>
            <ol className="divide-y divide-slate-200 border-y border-slate-200 lg:col-span-7">
              <li className="grid gap-2 py-7 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <span className="text-sm text-slate-700">{copy.register.guess.label}</span>
                <div>
                  <p className="text-xl leading-snug text-slate-700 line-through decoration-slate-500 decoration-1">
                    {copy.register.guess.quote}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{copy.register.guess.verdict}</p>
                </div>
              </li>
              <li className="grid gap-2 py-7 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <span className="text-sm text-slate-700">{copy.register.sourced.label}</span>
                <div className="flex flex-col items-start gap-3">
                  <p className="text-xl leading-snug text-ink-900">{copy.register.sourced.quote}</p>
                  <SourceTag source={{ namn: "Bolagsverket", hämtad: "2026-09-14" }} />
                </div>
              </li>
              <li className="grid gap-2 py-7 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <span className="text-sm text-slate-700">{copy.register.unknown.label}</span>
                <p className="text-xl leading-snug text-ink-900">{copy.register.unknown.quote}</p>
              </li>
            </ol>
          </div>
        </section>

        {/* Poängen: tre regler, som text och inte som kort. */}
        <section className="border-t border-slate-200 bg-white">
          <div className={`${container} py-20 lg:py-28`}>
            <h2 className="max-w-[20ch] text-balance text-[clamp(1.9rem,1.3rem+1.8vw,2.9rem)] leading-[1.1] tracking-[-0.018em] text-ink-900">
              {copy.score.titleBefore}
              <em className="xl-em">{copy.score.titleEm}</em>
              {copy.score.titleAfter}
            </h2>
            <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-slate-700">{copy.score.lead}</p>
            <dl className="mt-14 grid gap-x-10 gap-y-10 md:grid-cols-3">
              {(["counts", "simulations", "contradictions"] as const).map((rule) => (
                <div key={rule} className="border-t border-ink-900 pt-5">
                  <dt className="text-xl text-ink-900">{copy.score.rules[rule].title}</dt>
                  <dd className="mt-2 max-w-[34ch] leading-relaxed text-slate-700">
                    {copy.score.rules[rule].body}
                  </dd>
                </div>
              ))}
            </dl>
            <a
              href="#exempel"
              className="mt-12 inline-block text-[0.95rem] text-ink-900 underline decoration-slate-300 hover:decoration-ink-900"
            >
              {copy.score.backToExample}
            </a>
          </div>
        </section>

        {/* För vem: ett uttalande, förskjutet i rutnätet. */}
        <section className="border-t border-slate-200">
          <div className={`${container} grid py-24 lg:grid-cols-12 lg:py-32`}>
            <div className="lg:col-span-9 lg:col-start-4">
              <p className="max-w-[22ch] text-balance text-[clamp(1.9rem,1.2rem+2.2vw,3.25rem)] leading-[1.12] tracking-[-0.018em] text-ink-900">
                {copy.audience.title}
              </p>
              <p className="mt-6 max-w-[50ch] text-pretty text-lg leading-relaxed text-slate-700">
                {copy.audience.body}
              </p>
            </div>
          </div>
        </section>

        {/* Avslut: pris och mejlfält på den mörka ytan, sidfoten under. */}
        <section id="besked" className="xl-dark scroll-mt-8 bg-navy text-paper-50">
          <div className={`${container} grid gap-14 py-20 lg:grid-cols-12 lg:gap-10 lg:py-28`}>
            <div className="lg:col-span-5">
              <p className="text-sm text-slate-300">{copy.close.priceLabel}</p>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="font-numeric text-[clamp(3.5rem,2.5rem+3vw,5.5rem)] leading-none tracking-[-0.03em]">
                  {copy.close.priceTemplate.replace("{amount}", formatCount(PLACEHOLDER_PRICE_SEK, locale))}
                </span>
                <span className="text-xl text-slate-300">{copy.close.priceUnit}</span>
              </p>
              <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-300">
                <span className="rounded-pill border border-dashed border-accent-300 px-2.5 py-0.5 text-accent-200">
                  {copy.close.tbd}
                </span>
                {copy.close.tbdNote}
              </p>
              <p className="mt-6 max-w-[34ch] text-slate-200">{copy.close.priceNote}</p>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <h2 className="text-balance text-[clamp(1.9rem,1.3rem+1.8vw,2.9rem)] leading-[1.1] tracking-[-0.018em]">
                {copy.close.title}
              </h2>
              <SignupForm className="mt-8" />
            </div>
          </div>
          <footer className="border-t border-slate-700">
            <div className={`${container} flex flex-col gap-4 py-8 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between`}>
              <Logo tone="light" height={14} />
              <div className="flex flex-col gap-1 sm:items-end sm:text-right">
                <p>{copy.footer.experiment}</p>
                <p className="max-w-[60ch]">{copy.footer.fiction}</p>
              </div>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
