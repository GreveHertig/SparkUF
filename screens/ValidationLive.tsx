"use client";

import { useState } from "react";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import { formatDate } from "@/i18n/format";
import type { Källa } from "@/core/domain";
import {
  answerWarnings,
  freshAnswers,
  logStats,
  nextAction,
  step06Progress,
  type ValidationNextAction,
} from "@/core/validationLog";
import type { ValidationContact } from "@/ports/ValidationLog";
import type { VerdictReport } from "@/ports/VerdictProvider";
import { Figures, VerdictBlock, type Figure } from "./blocks/DataBlocks";
import { Locked, PageHead } from "./blocks/PageBlocks";
import { ValidationContacts, type ValidationLogActions } from "./blocks/ValidationContacts";

/**
 * Datan /app/validering behöver, redan hämtad av routen. `contacts: null`
 * betyder att samtalsloggen inte går att nå (tabellen saknas eller inget
 * aktivt projekt) och ger "Kommer snart". `verdict: null` betyder att det
 * inte finns något svar att döma på än.
 */
export type ValidationLiveData = {
  contacts: ValidationContact[] | null;
  verdict: VerdictReport | null;
  /** Projektets namn, till samtalsguidens första meddelande. */
  projectName: string | null;
  todayIso: string;
};

/** Låst tills grundaren har ett projekt (steg 02). Beslut i docs/beslut.md 2026-10-04. */
export type ValidationLiveLock = { unlocksAfterStep: number } | null;

const STEP06_HREF = "/app/resan/6";
const SCORE_HREF = "/app/poang";

function nextText(action: ValidationNextAction, copy: ReturnType<typeof useI18n>["t"]["validationLog"]): string {
  switch (action.code) {
    case "addContacts":
      return fill(copy.next.addContacts, { missing: action.missing });
    case "reachOut":
      return fill(copy.next.reachOut, { planned: action.planned });
    case "moreAnswers":
      return fill(copy.next.moreAnswers, { missing: action.missing });
    case "readVerdict":
      return copy.next.readVerdict;
  }
}

/** Källan på siffror ur loggen: grundarens egen uppgift, med dagen för den senaste händelsen. */
function logSource(contacts: ValidationContact[], name: string): Källa | undefined {
  const dates = contacts.flatMap((contact) => [contact.contactedOnIso, contact.answer?.respondedOnIso]).filter(
    (date): date is string => typeof date === "string",
  );
  const latest = dates.sort().at(-1);
  return latest ? { namn: name, hämtad: latest } : undefined;
}

function Progress({ contacts, todayIso }: { contacts: ValidationContact[]; todayIso: string }) {
  const { t } = useI18n();
  const copy = t.validationLog;
  const progress = step06Progress(contacts, todayIso);
  const source = logSource(contacts, copy.sourceName);
  const rows = [
    { label: fill(copy.progressAnswers, { count: progress.answers, min: progress.minAnswers }), value: progress.answers, max: progress.minAnswers },
    {
      label: fill(copy.progressCompanies, { count: progress.companies, min: progress.minCompanies }),
      value: progress.companies,
      max: progress.minCompanies,
    },
  ];
  return (
    <div className="fdd-stack fdd-stack--tight">
      <p className="fdd-vlog__label">{copy.progressTitle}</p>
      <div className="fdd-bars">
        {rows.map((row) => (
          <div key={row.label} className="fdd-vlog__bar">
            <span className="fdd-bars__label">{row.label}</span>
            <span
              className="fdd-bars__track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={row.max}
              aria-valuenow={Math.min(row.value, row.max)}
              aria-label={row.label}
            >
              <span style={{ width: `${Math.min(100, (row.value / row.max) * 100)}%` }} />
            </span>
          </div>
        ))}
      </div>
      {source && <SourceTag source={source} dataType="user" />}
      {progress.reached && (
        <p className="fdd-body">
          {copy.progressReached} <Link href={STEP06_HREF}>{copy.progressStepLink}</Link>
        </p>
      )}
    </div>
  );
}

function Guide({ projectName }: { projectName: string | null }) {
  const { t } = useI18n();
  const guide = t.validationLog.guide;
  const message = fill(guide.message, { project: projectName ?? "…" });
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const list = (title: string, items: string[]) => (
    <div className="fdd-stack fdd-stack--tight">
      <p className="fdd-vlog__label">{title}</p>
      <ul className="fdd-vlog__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <details className="fd-panel fdd-vlog__guide">
      <summary className="fdd-block__title">{guide.title}</summary>
      <div className="fdd-stack">
        <p className="fdd-muted">{guide.lede}</p>
        {list(guide.findTitle, guide.find)}
        {list(guide.questionsTitle, guide.questions)}
        {list(guide.priceTitle, guide.price)}
        {list(guide.avoidTitle, guide.avoid)}
        <div className="fdd-stack fdd-stack--tight">
          <p className="fdd-vlog__label">{guide.messageTitle}</p>
          <p className="fdd-note">{message}</p>
          <button type="button" className="fd-btn fd-btn--secondary fd-btn--sm fdd-self-start" onClick={copy}>
            {copied ? guide.copied : guide.copy}
          </button>
        </div>
      </div>
    </details>
  );
}

/**
 * Valideringen i /app (docs/moduler/validering.md): grundaren pratar själv
 * med kunderna och loggar samtalen. Sidan visar nästa steg, hur långt det är
 * kvar till steg 06, varningar om underlaget, nyckeltalen, domen (räknad i
 * kod av core/verdict.ts), svaren och kontaktlistan. Siffror ur loggen bär
 * källan "Din samtalslogg" som grundarens egen uppgift; svaren bär bolaget
 * som källa. Domen visas utan poäng.
 */
export function ValidationLive({
  data,
  locked,
  actions,
}: {
  data: ValidationLiveData;
  locked: ValidationLiveLock;
  actions: ValidationLogActions;
}) {
  const { t, locale } = useI18n();
  const v = t.validationPage;
  const copy = t.validationLog;

  if (locked) {
    return (
      <div className="fdd-page">
        <PageHead title={v.title} lede={copy.lede} />
        <Locked hint={`${t.homePage.unlocksAfterStepBefore} ${String(locked.unlocksAfterStep).padStart(2, "0")}`} />
      </div>
    );
  }

  const contacts = data.contacts;
  if (!contacts) {
    return (
      <div className="fdd-page">
        <PageHead title={v.title} lede={copy.lede} />
        <ComingSoon />
      </div>
    );
  }

  const stats = logStats(contacts);
  const source = logSource(contacts, copy.sourceName);
  const warnings = answerWarnings(contacts, data.todayIso);
  const answered = freshAnswers(contacts, data.todayIso).sort((a, b) =>
    b.answer!.respondedOnIso.localeCompare(a.answer!.respondedOnIso),
  );

  const figures: Figure[] = [
    { label: copy.contactedLabel, value: stats.contacted, source, dataType: "user" },
    { label: copy.respondedLabel, value: stats.responded, source, dataType: "user" },
  ];
  if (stats.responseRate !== null) {
    figures.push({ label: copy.responseRateLabel, value: stats.responseRate, unit: "%", source, dataType: "user" });
  }
  if (stats.declined > 0) {
    figures.push({ label: copy.declinedLabel, value: stats.declined, source, dataType: "user" });
  }

  return (
    <div className="fdd-page">
      <PageHead title={v.title} lede={copy.lede} />

      <section className="fdd-block fd-panel fdd-vlog__next" aria-labelledby="fdd-vlog-next">
        <h2 id="fdd-vlog-next" className="fdd-block__title">
          {copy.nextTitle}
        </h2>
        <p className="fdd-body fdd-vlog__nexttext">{nextText(nextAction(contacts, data.todayIso), copy)}</p>
        <Progress contacts={contacts} todayIso={data.todayIso} />
        {warnings.length > 0 && (
          <div className="fdd-stack fdd-stack--tight" role="note">
            <p className="fdd-vlog__label">{copy.warningsTitle}</p>
            <ul className="fdd-vlog__list">
              {warnings.map((warning) => (
                <li key={warning}>{copy.warnings[warning]}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {stats.contacted > 0 && (
        <section className="fdd-block" aria-labelledby="fdd-vlog-kpi">
          <h2 id="fdd-vlog-kpi" className="fdd-block__title">
            {copy.kpiTitle}
          </h2>
          <Figures items={figures} />
        </section>
      )}

      {data.verdict && (
        <section className="fdd-block" aria-labelledby="fdd-vlog-verdict">
          <h2 id="fdd-vlog-verdict" className="fdd-block__title">
            {copy.verdictTitle}
          </h2>
          <p className="fdd-muted">{copy.verdictLede}</p>
          <VerdictBlock headline={data.verdict.presentation.headline} reasoning={data.verdict.presentation.reasoning} />
          {data.verdict.quotes.length > 0 && (
            <ul className="fdd-quotes">
              {data.verdict.quotes.map((quote) => (
                <li key={`${quote.companyName}-${quote.dateIso}`} className="fd-panel fdd-quote">
                  <p className="fdd-rows__title">{quote.companyName}</p>
                  <blockquote className="fdd-quote__text">”{quote.quote}”</blockquote>
                  <SourceTag source={quote.source} dataType="user" />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {answered.length > 0 && (
        <section className="fdd-block" aria-labelledby="fdd-vlog-answers">
          <h2 id="fdd-vlog-answers" className="fdd-block__title">
            {copy.quotesTitle}
          </h2>
          <ul className="fdd-quotes">
            {answered.map((contact) => (
              <li key={contact.id} className="fd-panel fdd-quote">
                <div className="fdd-quote__head">
                  <div>
                    <p className="fdd-rows__title">{contact.companyName}</p>
                    <p className="fdd-muted">
                      {copy.answer.problem[contact.answer!.problemStance]} · {copy.answer.price[contact.answer!.priceStance]} ·{" "}
                      {formatDate(contact.answer!.respondedOnIso, locale)}
                    </p>
                  </div>
                </div>
                <blockquote className="fdd-quote__text">”{contact.answer!.quote}”</blockquote>
                <SourceTag source={{ namn: contact.companyName, hämtad: contact.answer!.respondedOnIso }} dataType="user" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="fdd-block" aria-labelledby="fdd-vlog-list">
        <h2 id="fdd-vlog-list" className="fdd-block__title">
          {copy.listTitle}
        </h2>
        <ValidationContacts contacts={contacts} todayIso={data.todayIso} scoreHref={SCORE_HREF} actions={actions} />
      </section>

      <Guide projectName={data.projectName} />
    </div>
  );
}
