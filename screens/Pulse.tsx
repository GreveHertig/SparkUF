"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { cn } from "@/design/cn";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import type { PulseFeedbackVerdict, PulseLearning, PulseSignal, PulseWatch } from "@/core/domain";
import { formatDateWithYear } from "@/i18n/format";
import type { DataType } from "@/design/tokens";
import type { ChatSource } from "./blocks/ChatBlocks";
import { PageHead, Pill } from "./blocks/PageBlocks";

/**
 * Datan skärmen behöver, redan hämtad och språkvald av den monterande routen.
 * `signals: null` när signalerna inte gick att hämta (platshållarfel): listan
 * visar då "Kommer snart", och rubriken blir sidans namn. En tom lista är ett
 * ärligt tomläge ("Ingen signal än"), inte en lucka.
 *
 * `sourceDataType` sätter källtaggarnas datatyp (docs/beslut.md, 2026-10-01):
 * demot skickar `"example"` (påhittade signaler, etiketten "Exempel"), `/app`
 * skickar `"media"` (artiklar, etiketten "Media"). Utelämnad blir taggen
 * `SourceTag`s standard, `"register"`, som bara får användas för register.
 */
export type PulseData = {
  signals: PulseSignal[] | null;
  sourceDataType?: DataType;
};

/** Svaret när en bevakning sparas. `reason` blir en text ur i18n. */
export type PulseWatchResult = { ok: true } | { ok: false; reason: "too_short" | "too_many" | "no_project" | "failed" };

/**
 * Egna bevakningar (bara i /app). `items: null` när tabellen saknas eller
 * inte gick att läsa: då visas ingen del för bevakningar alls.
 */
export type PulseWatches = {
  items: PulseWatch[];
  max: number;
  onAdd: (kind: PulseWatch["kind"], term: string) => Promise<PulseWatchResult>;
  onRemove: (id: string) => Promise<void>;
};

/** En rad om grundaren överst i spelboken. En rad med en siffra har källan "Din uppgift". */
export type PulsePersonalFact = { id: string; text: string; source?: ChatSource };

/**
 * Det grundaren redan har berättat, per sort av signal (bara i /app,
 * app/(app)/app/pulsen/personal.ts). Ingen modell: grundarens egen text och
 * läget i Resan. Utelämnad eller tom: spelboken ser ut som förut.
 */
export type PulsePersonal = { risk: PulsePersonalFact[]; opportunity: PulsePersonalFact[] };

/** En spelbok som ska bli uppgifter i Min plan. Stegen hämtas ur i18n på servern. */
export type AddPlaybookRequest = {
  signalId: string;
  kind: "risk" | "opportunity";
  area: string;
  headline: string;
};

export type AddPlaybookResult = { ok: true; added: number } | { ok: false; reason: "full" | "failed" };

type FeedbackState = "relevant" | "hidden" | "failed";
type PlanState = "adding" | "added" | "already" | "full" | "failed";

/** Det som bara /app skickar till spelboken. Allt är valfritt. */
type PlaybookExtras = {
  personal?: PulsePersonal | null;
  /** Medgrundarens sida. Länken får `?signal=<id>`, och sidan förifyller frågan. */
  cofounderHref?: string;
  /** Server action för "Lägg till stegen i min plan". Utelämnad: ingen knapp. */
  onAddToPlan?: (request: AddPlaybookRequest) => Promise<AddPlaybookResult>;
  /** Resan, där planen visas. */
  planHref?: string;
};

type PulseProps = {
  data: PulseData;
  /** Omdömet under varje signal (bara i /app). Utelämnad: inga knappar. */
  onFeedback?: (signalId: string, verdict: PulseFeedbackVerdict) => Promise<void>;
  /** Egna bevakningar (bara i /app). Utelämnad: ingen del för bevakningar. */
  watches?: PulseWatches | null;
  /** Vad Pulsen har lärt sig av omdömena (bara i /app). Utelämnad: ingen ruta. */
  learning?: PulseLearning | null;
} & PlaybookExtras;

/**
 * Pulsen: signalflödet, nyast först. Rubriken är den senaste signalen. Markup
 * flyttad rakt av från demots `app/demo/(app)/pulsen/page.tsx` (steg 6,
 * docs/plan-en-design.md).
 *
 * Risker (signaler med `risk`) visas först, under "Risker att bevaka", sedan
 * möjligheter (`opportunity`), sedan nyheterna. Varje risk och möjlighet har
 * område, förslag och en utfällbar spelbok (i18n, märkt som ogranskad
 * vägledning). Finns varken risker eller möjligheter (som i demot i dag) ser
 * sidan ut precis som förut: en lista, ingen extra rubrik.
 *
 * I /app finns dessutom omdömet under varje signal ("Relevant" / "Inte
 * relevant") och grundarens egna bevakningar. Demot skickar inget av dem.
 */
export function Pulse({
  data,
  onFeedback,
  watches,
  learning,
  personal,
  cofounderHref,
  onAddToPlan,
  planHref,
}: PulseProps) {
  const { t } = useI18n();
  const { signals } = data;
  const latest = signals?.[0];
  const risks = signals?.filter((signal) => signal.risk) ?? [];
  const opportunities = signals?.filter((signal) => signal.opportunity && !signal.risk) ?? [];
  const news = signals?.filter((signal) => !signal.risk && !signal.opportunity) ?? [];

  const [feedback, setFeedback] = useState<Record<string, FeedbackState>>({});
  const give = onFeedback
    ? (signalId: string, verdict: PulseFeedbackVerdict) => {
        onFeedback(signalId, verdict).then(
          () => setFeedback((current) => ({ ...current, [signalId]: verdict === "relevant" ? "relevant" : "hidden" })),
          () => setFeedback((current) => ({ ...current, [signalId]: "failed" })),
        );
      }
    : undefined;
  const [plan, setPlan] = useState<Record<string, PlanState>>({});
  const addToPlan = onAddToPlan
    ? (request: AddPlaybookRequest) => {
        setPlan((current) => ({ ...current, [request.signalId]: "adding" }));
        onAddToPlan(request).then(
          (result) => {
            const state: PlanState = result.ok ? (result.added > 0 ? "added" : "already") : result.reason;
            setPlan((current) => ({ ...current, [request.signalId]: state }));
          },
          () => setPlan((current) => ({ ...current, [request.signalId]: "failed" })),
        );
      }
    : undefined;
  const list = { dataType: data.sourceDataType, feedback, give, personal, cofounderHref, plan, addToPlan, planHref };

  return (
    <div className="fdd-page">
      <PageHead
        context={latest?.category}
        title={latest?.headline ?? t.pulsePage.title}
        lede={latest?.whyItMatters ?? t.pulsePage.subtitle}
      />

      {learning && signals && signals.length > 0 && <LearningNote learning={learning} />}

      {signals === null ? (
        <ComingSoon />
      ) : signals.length === 0 ? (
        <p className="fdd-muted">{t.pulsePage.emptyState}</p>
      ) : risks.length === 0 && opportunities.length === 0 ? (
        <SignalList signals={news} tourId="pulse-list" {...list} />
      ) : (
        <>
          {risks.length > 0 && (
            <section className="fdd-block" aria-labelledby="fdd-pulse-risks">
              <h2 id="fdd-pulse-risks" className="fdd-block__title">
                {t.pulsePage.risksTitle}
              </h2>
              <p className="fdd-muted">{t.pulsePage.risksIntro}</p>
              <SignalList signals={risks} tourId="pulse-list" {...list} />
            </section>
          )}
          {opportunities.length > 0 && (
            <section className="fdd-block" aria-labelledby="fdd-pulse-opportunities">
              <h2 id="fdd-pulse-opportunities" className="fdd-block__title">
                {t.pulsePage.opportunitiesTitle}
              </h2>
              <p className="fdd-muted">{t.pulsePage.opportunitiesIntro}</p>
              <SignalList signals={opportunities} tourId={risks.length === 0 ? "pulse-list" : undefined} {...list} />
            </section>
          )}
          {news.length > 0 && (
            <section className="fdd-block" aria-labelledby="fdd-pulse-news">
              <h2 id="fdd-pulse-news" className="fdd-block__title">
                {t.pulsePage.newsTitle}
              </h2>
              <SignalList signals={news} {...list} />
            </section>
          )}
        </>
      )}

      {watches && <WatchesSection watches={watches} />}
    </div>
  );
}

function SignalList({
  signals,
  dataType,
  tourId,
  feedback,
  give,
  personal,
  cofounderHref,
  plan,
  addToPlan,
  planHref,
}: {
  signals: PulseSignal[];
  dataType?: DataType;
  tourId?: string;
  feedback: Record<string, FeedbackState>;
  give?: (signalId: string, verdict: PulseFeedbackVerdict) => void;
  personal?: PulsePersonal | null;
  cofounderHref?: string;
  plan: Record<string, PlanState>;
  addToPlan?: (request: AddPlaybookRequest) => void;
  planHref?: string;
}) {
  const { t, locale } = useI18n();
  const p = t.pulsePage;
  return (
    <ul
      className={cn("fdd-signals", signals.length === 1 && "fdd-signals--1", signals.length === 2 && "fdd-signals--2")}
      data-tour-id={tourId}
    >
      {signals.map((signal, index) => {
        const state = signal.id ? feedback[signal.id] : undefined;
        if (state === "hidden") {
          return (
            <li key={`${signal.headline}-${index}`} className="fd-panel fdd-signal">
              <p className="fdd-muted" role="status">
                {p.feedback.hidden}
              </p>
            </li>
          );
        }
        // En signal är en risk, en möjlighet eller en vanlig nyhet. Risken vinner om båda skulle vara satta.
        const insight = signal.risk
          ? {
              kind: "risk" as const,
              area: signal.risk.area as string,
              facts: personal?.risk ?? [],
              label: p.riskLabel,
              tone: "orange" as const,
              texts: p.riskAreas[signal.risk.area],
              actions: signal.risk.actions,
              impactTitle: p.playbook.riskImpactTitle,
              solveTitle: p.playbook.riskSolveTitle,
            }
          : signal.opportunity
            ? {
                kind: "opportunity" as const,
                area: signal.opportunity.area as string,
                facts: personal?.opportunity ?? [],
                label: p.opportunityLabel,
                tone: "green" as const,
                texts: p.opportunityAreas[signal.opportunity.area],
                actions: signal.opportunity.actions,
                impactTitle: p.playbook.opportunityImpactTitle,
                solveTitle: p.playbook.opportunitySolveTitle,
              }
            : null;
        return (
          <li key={`${signal.headline}-${index}`} className="fd-panel fdd-signal">
            {/* Bara kategorin: adapterns fasta "3 dagar sedan" stämde inte med
                källans datum (docs/buggar-2026-09.md punkt 11). Datumet står i källan. */}
            <p className="fdd-signal__meta">
              {insight ? (
                <>
                  <Pill tone={insight.tone}>{insight.label}</Pill>{" "}
                  <span className="fdd-signal__category">{insight.texts.name}</span>
                </>
              ) : (
                <span className="fdd-signal__category">{signal.category}</span>
              )}
            </p>
            {signal.boosted && <p className="fdd-signal__boosted">{p.boosted}</p>}
            <p className="fdd-signal__headline">{signal.headline}</p>
            <p className="fd-nextstep__why">
              {t.common.pulseWhyItMattersPrefix} {signal.whyItMatters}
            </p>
            {signal.whyByAi && <p className="fdd-muted fdd-signal__ai">{p.aiWhy}</p>}
            {signal.deadline && (
              <p className="fdd-signal__deadline">
                {p.deadline}: <strong>{formatDateWithYear(signal.deadline, locale)}</strong>{" "}
                <SourceTag source={signal.source} dataType={dataType} />
              </p>
            )}
            {insight && insight.actions.length > 0 && (
              <div className="fdd-risk-actions">
                <p className="fdd-label">{p.actionsTitle}</p>
                <ul>
                  {insight.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
            {insight && (
              <details className="fdd-playbook">
                <summary>{p.playbook.toggle}</summary>
                <div className="fdd-playbook__body">
                  {insight.facts.length > 0 && (
                    <div className="fdd-playbook__personal">
                      <p className="fdd-label">{p.playbook.personalTitle}</p>
                      <ul>
                        {insight.facts.map((fact) => (
                          <li key={fact.id}>
                            {fact.text}
                            {fact.source && (
                              <>
                                {" "}
                                <SourceTag source={fact.source.source} dataType={fact.source.dataType} />
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="fdd-label">{insight.impactTitle}</p>
                  <ul>
                    {insight.texts.playbook.impact.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="fdd-label">{insight.solveTitle}</p>
                  <ol>
                    {insight.texts.playbook.solve.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                  {signal.id && (cofounderHref || addToPlan) && (
                    <PlaybookActions
                      request={{ signalId: signal.id, kind: insight.kind, area: insight.area, headline: signal.headline }}
                      cofounderHref={cofounderHref}
                      state={plan[signal.id]}
                      addToPlan={addToPlan}
                      planHref={planHref}
                    />
                  )}
                  <p className="fdd-muted fdd-playbook__note">{p.playbook.note}</p>
                </div>
              </details>
            )}
            {give && signal.id && (
              <div className="fdd-feedback">
                {state === "relevant" ? (
                  <p className="fdd-muted" role="status">
                    {p.feedback.thanks}
                  </p>
                ) : (
                  <>
                    <span className="fdd-muted">{p.feedback.question}</span>
                    <button
                      type="button"
                      className="fd-btn fd-btn--secondary fd-btn--sm"
                      onClick={() => give(signal.id!, "relevant")}
                    >
                      {p.feedback.relevant}
                    </button>
                    <button
                      type="button"
                      className="fd-btn fd-btn--secondary fd-btn--sm"
                      onClick={() => give(signal.id!, "not_relevant")}
                    >
                      {p.feedback.notRelevant}
                    </button>
                    {state === "failed" && (
                      <span className="fdd-muted" role="alert">
                        {p.feedback.failed}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
            <SourceTag source={signal.source} dataType={dataType} />
          </li>
        );
      })}
    </ul>
  );
}

/**
 * "Pulsen lär sig av dig" (bara i /app): vad omdömena har ändrat, så att
 * knapparna Relevant och Inte relevant märks. Inga antal, bara namn.
 */
function LearningNote({ learning }: { learning: PulseLearning }) {
  const { t } = useI18n();
  const copy = t.pulsePage.learning;
  const learned = learning.areas.length > 0 || learning.terms.length > 0;
  return (
    <aside className="fdd-learning" aria-labelledby="fdd-pulse-learning">
      <p id="fdd-pulse-learning" className="fdd-label">
        {copy.title}
      </p>
      {learned ? (
        <>
          {learning.areas.length > 0 && <p>{fill(copy.areas, { list: learning.areas.join(", ") })}</p>}
          {learning.terms.length > 0 && <p>{fill(copy.terms, { list: learning.terms.join(", ") })}</p>}
          <p className="fdd-muted">{copy.hidden}</p>
        </>
      ) : (
        <p className="fdd-muted">{copy.empty}</p>
      )}
    </aside>
  );
}

/**
 * Spelbokens två vägar vidare (bara i /app): gå igenom signalen med
 * Medgrundaren, eller lägg stegen i Min plan. Länken bär bara signalens id;
 * frågan byggs på servern ur grundarens egna signaler.
 */
function PlaybookActions({
  request,
  cofounderHref,
  state,
  addToPlan,
  planHref,
}: {
  request: AddPlaybookRequest;
  cofounderHref?: string;
  state?: PlanState;
  addToPlan?: (request: AddPlaybookRequest) => void;
  planHref?: string;
}) {
  const { t } = useI18n();
  const pb = t.pulsePage.playbook;
  const message =
    state === "added"
      ? pb.addedToPlan
      : state === "already"
        ? pb.alreadyInPlan
        : state === "full"
          ? pb.planFull
          : state === "failed"
            ? pb.planFailed
            : null;
  return (
    <div className="fdd-playbook__actions">
      {cofounderHref && (
        <Link
          href={`${cofounderHref}?signal=${encodeURIComponent(request.signalId)}`}
          className="fd-btn fd-btn--primary fd-btn--sm"
        >
          {pb.askCofounder}
        </Link>
      )}
      {addToPlan && state !== "added" && state !== "already" && (
        <button
          type="button"
          className="fd-btn fd-btn--secondary fd-btn--sm"
          disabled={state === "adding"}
          onClick={() => addToPlan(request)}
        >
          {state === "adding" ? pb.adding : pb.addToPlan}
        </button>
      )}
      {message && (
        <p className="fdd-muted fdd-playbook__status" role={state === "added" || state === "already" ? "status" : "alert"}>
          {message}
          {(state === "added" || state === "already" || state === "full") && planHref && (
            <>
              {" "}
              <Link href={planHref} className="fdd-link">
                {pb.seePlan}
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function WatchesSection({ watches }: { watches: PulseWatches }) {
  const { t } = useI18n();
  const w = t.pulsePage.watches;
  const [kind, setKind] = useState<PulseWatch["kind"]>("competitor");
  const [term, setTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const full = watches.items.length >= watches.max;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    watches
      .onAdd(kind, term)
      .then(
        (result) => {
          if (result.ok) setTerm("");
          else setError(w.errors[result.reason]);
        },
        () => setError(w.errors.failed),
      )
      .finally(() => setBusy(false));
  }

  return (
    <section className="fdd-block" aria-labelledby="fdd-pulse-watches">
      <h2 id="fdd-pulse-watches" className="fdd-block__title">
        {w.title}
      </h2>
      <p className="fdd-muted">{w.intro}</p>
      {watches.items.length === 0 ? (
        <p className="fdd-muted">{w.empty}</p>
      ) : (
        <ul className="fdd-watches">
          {watches.items.map((watch) => (
            <li key={watch.id} className="fdd-watch">
              <span className="fdd-watch__kind">
                {watch.kind === "competitor" ? w.kindCompetitor : w.kindKeyword}
              </span>
              <span>{watch.term}</span>
              <button
                type="button"
                className="fdd-watch__remove"
                aria-label={fill(w.remove, { term: watch.term })}
                onClick={() => {
                  watches.onRemove(watch.id).catch(() => setError(w.errors.failed));
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {full ? (
        <p className="fdd-muted">{fill(w.limit, { max: watches.max })}</p>
      ) : (
        <form className="fdd-sni" onSubmit={submit}>
          <label className="fdd-sni__label" htmlFor="fdd-watch-term">
            {w.termLabel}
          </label>
          <div className="fdd-sni__row">
            <select
              className="fdd-input fdd-watch__select"
              aria-label={w.kindLabel}
              value={kind}
              onChange={(event) => setKind(event.target.value as PulseWatch["kind"])}
            >
              <option value="competitor">{w.kindCompetitor}</option>
              <option value="keyword">{w.kindKeyword}</option>
            </select>
            <input
              id="fdd-watch-term"
              className="fdd-input"
              value={term}
              maxLength={60}
              placeholder={w.termPlaceholder}
              onChange={(event) => setTerm(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "fdd-watch-error" : undefined}
            />
            <button type="submit" className="fd-btn fd-btn--primary fd-btn--sm" disabled={busy}>
              {w.add}
            </button>
          </div>
          {error && (
            <p id="fdd-watch-error" className="fdd-muted" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
