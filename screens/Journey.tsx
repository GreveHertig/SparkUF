"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { SourceTag } from "@/components/ui/SourceTag";
import { formatDateWithYear } from "@/i18n/format";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import type { PlanItem } from "@/ports/PlanRepository";
import { JourneyStepper } from "./blocks/JourneyStepper";
import { PageHead } from "./blocks/PageBlocks";

/**
 * Datan skärmen behöver, redan hämtad och språkvald av den monterande routen.
 * `steps: null` när stegen inte gick att hämta (platshållarfel): stegraden och
 * faserna visar då "Kommer snart", och rubriken blir sidans namn.
 */
export type JourneyData = {
  steps: JourneyStepView[] | null;
};

/** Svaret när en uppgift läggs till eller får ny text. `reason` blir en text ur i18n. */
export type PlanEditResult = { ok: true } | { ok: false; reason: "empty" | "duplicate" | "full" | "failed" };

/**
 * Min plan (bara /app, docs/moduler/min-plan.md): uppgifter som grundaren lagt
 * till från en spelbok i Pulsen eller skrivit själv. Utelämnad (tabellen
 * saknas, eller demot) ger ingen del alls. Funktionerna är Server Actions.
 */
export type JourneyPlan = {
  items: PlanItem[];
  onToggle: (id: string, done: boolean) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onEdit: (id: string, text: string) => Promise<PlanEditResult>;
  onAdd: (text: string) => Promise<PlanEditResult>;
  /** Pulsen, där spelböckerna finns. */
  pulseHref: string;
  /** Medgrundaren. "Hjälp mig med det här" blir `<href>?task=<id>`. */
  cofounderHref: string;
};

const PHASE_ORDER = ["discover", "tryPhase", "launch", "grow"] as const;

/**
 * Resan: stegraden överst, sedan varje fas med sina steg. Markup flyttad rakt
 * av från demots `app/demo/(app)/resan/page.tsx` (PR 9, docs/plan-en-design.md).
 * `basePath` är Resans väg (t.ex. `/demo/resan`); stegets länk blir
 * `<bas>/<nummer>`. En sträng, så att en Server Component kan skicka den.
 */
export function Journey({
  data,
  basePath,
  profileAnswersHref,
  plan,
}: {
  data: JourneyData;
  basePath: string;
  /** Min plan (bara /app). */
  plan?: JourneyPlan | null;
  /** Minnets Profilen-flik (svaren från onboardingen). Visas under steg 1:s
   * kort när routen skickar den, det vill säga när onboardingen är klar. */
  profileAnswersHref?: string | null;
}) {
  const { t } = useI18n();
  const { steps } = data;
  const stepHref = (stepNumber: number) => `${basePath}/${stepNumber}`;

  // Som i originalet beskriver rubriken var resan står: det aktuella steget,
  // annars det senast klara, annars det första.
  const highlighted = steps
    ? (steps.find((step) => step.status === "current") ??
      [...steps].reverse().find((step) => step.status === "done") ??
      steps[0])
    : undefined;

  return (
    <div className="fdd-page">
      <PageHead
        context={
          highlighted
            ? `${t.journeyPage.stepLabel} ${String(highlighted.stepNumber).padStart(2, "0")} · ${t.journeyPage.status[highlighted.status]}`
            : undefined
        }
        title={highlighted?.title ?? t.journeyPage.title}
        lede={highlighted?.oneLiner ?? t.journeyPage.subtitle}
      />

      {steps ? (
        <>
          <div className="fd-journey">
            <JourneyStepper steps={steps} basePath={basePath} />
          </div>

          <div className="fdd-phases">
            {PHASE_ORDER.map((phase) => {
              const inPhase = steps.filter((step) => step.journeyPhase === phase);
              if (inPhase.length === 0) return null;
              const done = inPhase.filter((step) => step.status === "done").length;
              return (
                <section key={phase} className="fdd-phase" aria-labelledby={`fdd-phase-${phase}`}>
                  <div className="fdd-phase__head">
                    <h2 id={`fdd-phase-${phase}`} className="fd-phase__name">
                      {t.journeyPage.phaseNames[phase]}
                    </h2>
                    <span className="fdd-muted">
                      {done}/{inPhase.length}
                    </span>
                  </div>
                  <ul className="fdd-stepcards">
                    {inPhase.map((step) => (
                      <li key={step.stepNumber}>
                        <Link
                          href={stepHref(step.stepNumber)}
                          className={cn("fdd-stepcard", `fdd-stepcard--${step.status}`)}
                        >
                          <span className="fdd-stepcard__top">
                            <span className="fdd-stepcard__num">
                              {t.journeyPage.stepLabel} {String(step.stepNumber).padStart(2, "0")}
                            </span>
                            <span className={`fdd-pill fdd-pill--status-${step.status}`}>
                              {t.journeyPage.status[step.status]}
                            </span>
                          </span>
                          <span className="fdd-stepcard__title">{step.title}</span>
                          <span className="fdd-stepcard__line">{step.oneLiner}</span>
                          <span className="fdd-stepcard__points">
                            {t.common.upToPointsBefore} {step.maxPoints} {t.common.upToPointsAfter}
                          </span>
                        </Link>
                        {step.stepNumber === 1 && profileAnswersHref && (
                          <Link href={profileAnswersHref} className="fdd-link">
                            {t.common.seeYourAnswers}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </>
      ) : (
        <ComingSoon />
      )}

      {/* Nyckeln byts när servern skickar en ny plan (efter revalidering), så
          att listan läses om i stället för att hålla kvar sitt första läge. */}
      {plan && (
        <PlanSection key={plan.items.map((item) => `${item.id}:${item.done}:${item.text}`).join("|")} plan={plan} />
      )}
    </div>
  );
}

type PlanGroup = { key: string; title: string; items: PlanItem[]; allDone: boolean };

/**
 * Uppgifterna i grupper: en per nyhet (sammanhanget), en för egna uppgifter
 * och en för övriga. Grupper med något kvar att göra först, i den ordning de
 * lades till; helt avbockade grupper sist. Inom en grupp: öppna först.
 */
export function groupPlanItems(items: PlanItem[], titles: { own: string; other: string }): PlanGroup[] {
  const groups = new Map<string, PlanGroup>();
  for (const item of items) {
    const key = item.origin === "own" ? "own" : item.context ? `ctx:${item.context}` : "other";
    const title = key === "own" ? titles.own : key === "other" ? titles.other : item.context!;
    const group = groups.get(key) ?? { key, title, items: [], allDone: true };
    group.items.push(item);
    group.allDone = group.allDone && item.done;
    groups.set(key, group);
  }
  const list = [...groups.values()].map((group) => ({
    ...group,
    items: [...group.items.filter((item) => !item.done), ...group.items.filter((item) => item.done)],
  }));
  return [...list.filter((group) => !group.allDone), ...list.filter((group) => group.allDone)];
}

/**
 * Min plan: grupperad per nyhet, med "Hjälp mig med det här" (Medgrundaren),
 * ändra, bocka av och ta bort på varje uppgift, och ett fält för en egen
 * uppgift. Bocka av och ta bort visas direkt och går tillbaka vid fel. Texten
 * och sammanhanget är ren text, aldrig HTML.
 */
function PlanSection({ plan }: { plan: JourneyPlan }) {
  const { t, locale } = useI18n();
  const copy = t.journeyPage.plan;
  const [items, setItems] = useState(plan.items);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [newText, setNewText] = useState("");

  const errorText = (reason: "empty" | "duplicate" | "full" | "failed") => copy.errors[reason];

  function toggle(id: string, done: boolean) {
    const before = items;
    setError(null);
    setItems(items.map((item) => (item.id === id ? { ...item, done } : item)));
    plan.onToggle(id, done).catch(() => {
      setItems(before);
      setError(copy.failed);
    });
  }

  function remove(id: string) {
    const before = items;
    setError(null);
    setItems(items.filter((item) => item.id !== id));
    plan.onRemove(id).catch(() => {
      setItems(before);
      setError(copy.failed);
    });
  }

  function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const { id, text } = editing;
    setBusy(true);
    setError(null);
    plan
      .onEdit(id, text)
      .then(
        (result) => {
          if (result.ok) {
            setItems((current) => current.map((item) => (item.id === id ? { ...item, text: text.trim() } : item)));
            setEditing(null);
          } else setError(errorText(result.reason));
        },
        () => setError(copy.failed),
      )
      .finally(() => setBusy(false));
  }

  function add(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    plan
      .onAdd(newText)
      .then(
        (result) => {
          // Servern skickar den nya planen (revalidering); listan läses då om.
          if (result.ok) setNewText("");
          else setError(errorText(result.reason));
        },
        () => setError(copy.failed),
      )
      .finally(() => setBusy(false));
  }

  const groups = groupPlanItems(items, { own: copy.ownGroup, other: copy.otherGroup });

  return (
    <section className="fdd-block" aria-labelledby="fdd-journey-plan" id="min-plan">
      <h2 id="fdd-journey-plan" className="fdd-block__title">
        {copy.title}
      </h2>
      <p className="fdd-muted">{copy.intro}</p>
      {groups.length === 0 ? (
        <p className="fdd-muted">
          {copy.empty}{" "}
          <Link href={plan.pulseHref} className="fdd-link">
            {copy.openPulse}
          </Link>
        </p>
      ) : (
        groups.map((group) => (
          <details key={group.key} className="fdd-myplan-group" open={!group.allDone}>
            <summary className="fdd-myplan-group__title">{group.title}</summary>
            <ul className="fdd-myplan">
              {group.items.map((item) => (
                <li key={item.id} className={cn("fdd-myplan__item", item.done && "fdd-myplan__item--done")}>
                  {editing?.id === item.id ? (
                    <form className="fdd-myplan__edit" onSubmit={saveEdit}>
                      <input
                        type="text"
                        value={editing.text}
                        onChange={(event) => setEditing({ id: item.id, text: event.target.value })}
                        aria-label={copy.editLabel}
                        maxLength={300}
                        disabled={busy}
                        autoFocus
                        className="fdd-myplan__input"
                      />
                      <button type="submit" className="fd-btn fd-btn--primary fd-btn--sm" disabled={busy}>
                        {copy.save}
                      </button>
                      <button
                        type="button"
                        className="fd-btn fd-btn--secondary fd-btn--sm"
                        onClick={() => setEditing(null)}
                        disabled={busy}
                      >
                        {copy.cancel}
                      </button>
                    </form>
                  ) : (
                    <>
                      <label className="fdd-myplan__check">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={(event) => toggle(item.id, event.target.checked)}
                          aria-label={item.done ? copy.markOpen : copy.markDone}
                        />
                        <span className="fdd-myplan__text">
                          {item.text}
                          {item.due && (
                            <span className="fdd-myplan__due">
                              {copy.due}: {formatDateWithYear(item.due.date, locale)}{" "}
                              <SourceTag source={item.due.source} dataType="media" />
                            </span>
                          )}
                        </span>
                      </label>
                      <div className="fdd-myplan__actions">
                        {!item.done && (
                          <Link
                            href={`${plan.cofounderHref}?task=${encodeURIComponent(item.id)}`}
                            className="fd-btn fd-btn--secondary fd-btn--sm"
                          >
                            {copy.help}
                          </Link>
                        )}
                        <button
                          type="button"
                          className="fd-btn fd-btn--secondary fd-btn--sm"
                          onClick={() => {
                            setError(null);
                            setEditing({ id: item.id, text: item.text });
                          }}
                        >
                          {copy.edit}
                        </button>
                        <button
                          type="button"
                          className="fd-btn fd-btn--secondary fd-btn--sm"
                          onClick={() => remove(item.id)}
                        >
                          {copy.remove}
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </details>
        ))
      )}

      <form className="fdd-myplan__add" onSubmit={add}>
        <label htmlFor="fdd-myplan-new" className="fdd-label">
          {copy.addTitle}
        </label>
        <div className="fdd-myplan__add-row">
          <input
            id="fdd-myplan-new"
            type="text"
            value={newText}
            onChange={(event) => setNewText(event.target.value)}
            placeholder={copy.addPlaceholder}
            aria-label={copy.addLabel}
            maxLength={300}
            disabled={busy}
            className="fdd-myplan__input"
          />
          <button type="submit" className="fd-btn fd-btn--primary fd-btn--sm" disabled={busy || !newText.trim()}>
            {copy.addButton}
          </button>
        </div>
      </form>

      {error && (
        <p className="fdd-muted" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
