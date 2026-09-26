"use client";

import { useEffect, useState } from "react";
import { SourceTag } from "@/components/ui/SourceTag";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import { demoMarketingProvider } from "@/adapters/demo/MarketingProvider";
import { getCurrentStepNumber, useDemoStore } from "@/adapters/demo/demoStore";
import type { ContentDraft, MarketingMessage, MarketingPlan } from "@/ports/MarketingProvider";
import { ExampleLabel, Locked, PageHead, Pill } from "../../_components/DemoBlocks";

/** Steget där modulen används (docs/moduler/marknadsforing.md). */
const USED_IN_STEP = 11;

const OUTCOME_KEYS = ["posts", "replies", "meetings", "newCustomers"] as const;

function MessageRow({ message, label }: { message: MarketingMessage; label?: string }) {
  return (
    <li className="fdd-rows__item">
      <div className="fdd-rows__main">
        {label && <p className="fdd-muted">{label}</p>}
        <p className="fdd-rows__title">{message.text}</p>
        {message.quote && <blockquote className="fdd-quote__text">”{message.quote}”</blockquote>}
        <SourceTag source={message.source} dataType="customer" />
      </div>
    </li>
  );
}

/**
 * Marknadsföring: budskapet med bevis, kanalerna, 30-dagarsplanen, ett
 * utkast per aktivitet och uppföljningen vecka för vecka. Används i steg 11
 * och låses upp där. Utkasten publiceras aldrig av Spark.
 */
export default function FondaDemoMarketingPage() {
  const { t, locale } = useI18n();
  const copy = t.marketingPage;
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const notInScenario = entry === "hasIdea";
  const unlocked = !notInScenario && getCurrentStepNumber() >= USED_IN_STEP;

  const [plan, setPlan] = useState<MarketingPlan | null>(null);
  const [activityId, setActivityId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContentDraft | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    demoMarketingProvider.getPlan(locale).then((result) => {
      if (cancelled) return;
      setPlan(result);
      setActivityId((current) => current ?? result.weeks[0]?.activities[0]?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [unlocked, locale, beatIndex]);

  useEffect(() => {
    if (!activityId) return;
    let cancelled = false;
    demoMarketingProvider.draftContent(activityId, locale).then((result) => {
      if (cancelled) return;
      setDraft(result);
      setCopied(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activityId, locale]);

  async function copyDraft() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft.text);
      setCopied(true);
    } catch {
      // Urklipp kan vara spärrat (t.ex. i en inbäddad vy). Texten går att markera ändå.
    }
  }

  if (!unlocked) {
    return (
      <div className="fdd-page">
        <PageHead context={copy.context} title={copy.title} lede={copy.subtitle} />
        <Locked
          hint={notInScenario ? t.homePage.notInThisScenario : `${t.homePage.unlocksAfterStepBefore} ${String(USED_IN_STEP - 1).padStart(2, "0")}`}
        />
      </div>
    );
  }

  if (!plan) return null;

  const channelName = new Map(plan.channels.map((channel) => [channel.id, channel.name]));
  const weeksWithOutcome = plan.weeks.filter((week) => week.outcome);

  return (
    <div className="fdd-page">
      <PageHead context={copy.context} title={copy.title} lede={copy.subtitle} />
      <ExampleLabel />

      <section className="fdd-block" aria-labelledby="fdd-mkt-message">
        <h2 id="fdd-mkt-message" className="fdd-block__title">
          {copy.messageTitle}
        </h2>
        <ul className="fdd-rows">
          <MessageRow message={plan.headline} label={copy.headlineLabel} />
          {plan.supporting.map((message, index) => (
            <MessageRow key={message.text} message={message} label={index === 0 ? copy.supportingLabel : undefined} />
          ))}
        </ul>
      </section>

      <section className="fdd-block" aria-labelledby="fdd-mkt-channels">
        <h2 id="fdd-mkt-channels" className="fdd-block__title">
          {copy.channelsTitle}
        </h2>
        <ul className="fdd-rows">
          {plan.channels.map((channel) => (
            <li key={channel.id} className="fdd-rows__item">
              <div className="fdd-rows__main">
                <p className="fdd-rows__title">{channel.name}</p>
                <p className="fdd-muted">{channel.why}</p>
                {channel.source && <SourceTag source={channel.source} />}
              </div>
              <Pill tone={channel.verdict === "recommended" ? "green" : "neutral"}>
                {copy.channelVerdict[channel.verdict]}
              </Pill>
            </li>
          ))}
        </ul>
      </section>

      <section className="fdd-block" aria-labelledby="fdd-mkt-plan">
        <h2 id="fdd-mkt-plan" className="fdd-block__title">
          {copy.planTitle}
        </h2>
        <ul className="fdd-rows">
          {plan.weeks.map((week) => (
            <li key={week.weekNumber} className="fdd-rows__item">
              <div className="fdd-rows__main">
                <p className="fdd-rows__title">
                  {fill(copy.weekLabel, { week: week.weekNumber })} · {week.focus}
                </p>
                <ul className="fdd-stack fdd-stack--tight">
                  {week.activities.map((activity) => {
                    const selected = activity.id === activityId;
                    return (
                      <li key={activity.id}>
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setActivityId(activity.id)}
                          className={cn("fd-btn fd-btn--sm fdd-activity", selected ? "fd-btn--primary" : "fd-btn--secondary")}
                        >
                          {activity.title}
                        </button>{" "}
                        <span className="fdd-muted">{channelName.get(activity.channelId)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {week.outcome && <Pill tone="green">{copy.outcomeLabels.newCustomers}: {week.outcome.newCustomers}</Pill>}
            </li>
          ))}
        </ul>
      </section>

      <section className="fdd-block" aria-labelledby="fdd-mkt-draft">
        <div className="fdd-block__head">
          <h2 id="fdd-mkt-draft" className="fdd-block__title">
            {copy.draftTitle}
          </h2>
          <p className="fdd-muted">{copy.draftHint}</p>
        </div>
        {draft && (
          <div className="fd-panel fdd-quote" aria-live="polite">
            <div className="fdd-quote__head">
              <p className="fdd-rows__title">{channelName.get(draft.channelId)}</p>
              <button type="button" onClick={copyDraft} className="fd-btn fd-btn--sm fd-btn--secondary">
                {copied ? copy.copiedLabel : copy.copyLabel}
              </button>
            </div>
            <div className="fdd-stack fdd-stack--tight">
              {draft.text.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <p className="fdd-muted">{copy.basedOnLabel}:</p>
            <div className="fdd-tags">
              {draft.basedOn.map((source) => (
                <SourceTag key={source.namn} source={source} />
              ))}
            </div>
            <p className="fdd-note">{copy.draftNote}</p>
          </div>
        )}
      </section>

      <section className="fdd-block" aria-labelledby="fdd-mkt-outcome">
        <h2 id="fdd-mkt-outcome" className="fdd-block__title">
          {copy.outcomeTitle}
        </h2>
        {weeksWithOutcome.length === 0 ? (
          <p className="fdd-note">{copy.outcomeEmpty}</p>
        ) : (
          <>
            <div className="fdd-table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">{copy.weekColumn}</th>
                    {OUTCOME_KEYS.map((key) => (
                      <th key={key} scope="col" className="fdd-num">
                        {copy.outcomeLabels[key]}
                      </th>
                    ))}
                    <th scope="col">{copy.takeawayLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {weeksWithOutcome.map((week) => (
                    <tr key={week.weekNumber}>
                      <td>{fill(copy.weekLabel, { week: week.weekNumber })}</td>
                      {OUTCOME_KEYS.map((key) => (
                        <td key={key} className="fdd-num">
                          {week.outcome![key]}
                        </td>
                      ))}
                      <td className="fdd-muted">{week.outcome!.takeaway}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SourceTag source={weeksWithOutcome[0].outcome!.source} dataType="customer" />
          </>
        )}
      </section>
    </div>
  );
}
