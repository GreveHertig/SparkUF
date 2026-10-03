"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import { formatCount, formatDate } from "@/i18n/format";
import { SIZE_CLASSES } from "@/core/sizeClass";
import {
  CONTACT_CHANNELS,
  PRICE_STANCES,
  PROBLEM_STANCES,
  QUOTE_MAX,
  QUOTE_MIN,
  type ContactChannel,
  type ContactStatus,
  type LogAnswerResult,
  type PasteResult,
  type PriceStanceLog,
  type ProblemStanceLog,
  type SizeClassKey,
  type ValidationActionResult,
  type ValidationFailure,
} from "@/core/validationLog";
import type { ConversationAnswer, ValidationContact } from "@/ports/ValidationLog";
import { Pill, type PillTone } from "./PageBlocks";
import { formatDelta } from "./ScoreFigure";

/** Server Actions som routen skickar in. Skärmen vet inte varifrån de kommer. */
export type ValidationLogActions = {
  addContact: (companyName: string, sizeClass: SizeClassKey | null) => Promise<ValidationActionResult>;
  pasteContacts: (text: string) => Promise<PasteResult>;
  markContacted: (id: string, channel: ContactChannel, dateIso: string) => Promise<ValidationActionResult>;
  markDeclined: (id: string) => Promise<ValidationActionResult>;
  removeContact: (id: string) => Promise<ValidationActionResult>;
  logAnswer: (id: string, channel: ContactChannel, answer: ConversationAnswer) => Promise<LogAnswerResult>;
};

const statusTone: Record<ContactStatus, PillTone> = {
  planned: "neutral",
  contacted: "register",
  responded: "customer",
  declined: "orange",
};

const problemTone: Record<ProblemStanceLog, PillTone> = { confirms: "green", partial: "yellow", rejects: "orange" };
const priceTone: Record<PriceStanceLog, PillTone> = { accepts: "green", declines: "orange", undecided: "neutral" };

function useFailureText() {
  const { t } = useI18n();
  return (reason: ValidationFailure) => t.validationLog.errors[reason];
}

function SizeSelect({
  id,
  value,
  onChange,
  allowUnknown,
}: {
  id: string;
  value: SizeClassKey | "";
  onChange: (value: SizeClassKey | "") => void;
  allowUnknown: boolean;
}) {
  const { t } = useI18n();
  return (
    <select id={id} className="fdd-input fdd-vlog__select" value={value} onChange={(e) => onChange(e.target.value as SizeClassKey | "")}>
      {allowUnknown ? <option value="">{t.validationLog.sizeUnknown}</option> : <option value="" disabled>–</option>}
      {SIZE_CLASSES.map((size) => (
        <option key={size.key} value={size.key}>
          {size.range} {t.site.registry.employeesUnit}
        </option>
      ))}
    </select>
  );
}

/** Valknappar som en radiogrupp: ett val i taget, tydligt markerat. */
function Choices<T extends string>({
  name,
  legend,
  options,
  labels,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="fdd-vlog__fieldset">
      <legend className="fdd-vlog__label">{legend}</legend>
      <div className="fdd-choices" role="radiogroup" aria-label={legend}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            name={name}
            className={`fd-btn fd-btn--sm ${value === option ? "fd-btn--primary" : "fd-btn--secondary"}`}
            onClick={() => onChange(option)}
          >
            {labels[option]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Lägg till ett bolag, eller klistra in en lista. */
function AddContact({ actions }: { actions: ValidationLogActions }) {
  const { t } = useI18n();
  const copy = t.validationLog;
  const failureText = useFailureText();
  const [name, setName] = useState("");
  const [size, setSize] = useState<SizeClassKey | "">("");
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function add(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await actions.addContact(name, size || null).catch(() => ({ ok: false as const, reason: "unavailable" as const }));
    setBusy(false);
    if (result.ok) {
      setName("");
      setSize("");
    } else {
      setMessage(failureText(result.reason));
    }
  }

  async function paste() {
    setBusy(true);
    setMessage(null);
    const result = await actions.pasteContacts(pasted).catch(() => ({ ok: false as const, reason: "unavailable" as const }));
    setBusy(false);
    if (result.ok) {
      setPasted("");
      setMessage(fill(copy.pasteResult, { added: result.added, skipped: result.skipped }));
    } else {
      setMessage(failureText(result.reason));
    }
  }

  return (
    <div className="fdd-myplan__add">
      <form className="fdd-vlog__add" onSubmit={add}>
        <div className="fdd-vlog__field fdd-vlog__field--grow">
          <label htmlFor="fdd-vlog-name" className="fdd-vlog__label">
            {copy.addLabel}
          </label>
          <input
            id="fdd-vlog-name"
            className="fdd-input"
            value={name}
            maxLength={120}
            placeholder={copy.addPlaceholder}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="fdd-vlog__field">
          <label htmlFor="fdd-vlog-size" className="fdd-vlog__label">
            {copy.sizeLabel}
          </label>
          <SizeSelect id="fdd-vlog-size" value={size} onChange={setSize} allowUnknown />
        </div>
        <button type="submit" className="fd-btn fd-btn--primary fd-btn--sm fdd-self-end" disabled={busy || !name.trim()}>
          {busy ? copy.adding : copy.add}
        </button>
      </form>
      <details className="fdd-vlog__paste">
        <summary>{copy.pasteSummary}</summary>
        <label htmlFor="fdd-vlog-paste" className="fdd-muted">
          {copy.pasteLabel}
        </label>
        <textarea
          id="fdd-vlog-paste"
          className="fdd-textarea"
          rows={5}
          value={pasted}
          onChange={(event) => setPasted(event.target.value)}
        />
        <button
          type="button"
          className="fd-btn fd-btn--secondary fd-btn--sm fdd-self-start"
          onClick={paste}
          disabled={busy || !pasted.trim()}
        >
          {copy.paste}
        </button>
      </details>
      {message && (
        <p className="fdd-muted" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

/** Formuläret för ett svar. Förifyllt när ett befintligt svar ändras. */
function AnswerForm({
  contact,
  todayIso,
  scoreHref,
  actions,
  onDone,
}: {
  contact: ValidationContact;
  todayIso: string;
  scoreHref: string;
  actions: ValidationLogActions;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const copy = t.validationLog;
  const a = copy.answer;
  const failureText = useFailureText();
  const prior = contact.answer;
  const [date, setDate] = useState(prior?.respondedOnIso ?? todayIso);
  const [channel, setChannel] = useState<ContactChannel | null>(contact.channel);
  const [size, setSize] = useState<SizeClassKey | "">(prior?.sizeClass ?? contact.sizeClass ?? "");
  const [problem, setProblem] = useState<ProblemStanceLog | null>(prior?.problemStance ?? null);
  const [priceStance, setPriceStance] = useState<PriceStanceLog | null>(prior?.priceStance ?? null);
  const [priceTested, setPriceTested] = useState(prior ? String(prior.priceTestedKr) : "");
  const [counter, setCounter] = useState(prior?.counterOfferKr != null ? String(prior.counterOfferKr) : "");
  const [quote, setQuote] = useState(prior?.quote ?? "");
  const [state, setState] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<LogAnswerResult | null>(null);

  const price = Number(priceTested);
  const counterValue = counter.trim() === "" ? null : Number(counter);
  const quoteLength = Array.from(quote.trim()).length;
  const complete =
    channel !== null &&
    size !== "" &&
    problem !== null &&
    priceStance !== null &&
    Number.isInteger(price) &&
    price > 0 &&
    (counterValue === null || (Number.isInteger(counterValue) && counterValue >= 0)) &&
    quoteLength >= QUOTE_MIN &&
    date !== "" &&
    date <= todayIso;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!complete || channel === null || problem === null || priceStance === null) return;
    setState("saving");
    setError(null);
    const result = await actions
      .logAnswer(contact.id, channel, {
        respondedOnIso: date,
        sizeClass: size,
        problemStance: problem,
        priceStance,
        priceTestedKr: price,
        counterOfferKr: priceStance === "accepts" ? null : counterValue,
        quote: quote.trim(),
      })
      .catch((): LogAnswerResult => ({ ok: false, reason: "unavailable" }));
    setState("idle");
    if (result.ok) setOutcome(result);
    else setError(failureText(result.reason));
  }

  if (outcome?.ok) {
    return (
      <div className="fdd-vlog__form" role="status">
        <p className="fdd-note">
          {outcome.scored ? (
            outcome.delta === 0 ? (
              copy.scoreUnchanged
            ) : (
              <Link href={scoreHref}>
                {fill(copy.scoreAfter, { total: String(outcome.total), delta: formatDelta(outcome.delta) })}
              </Link>
            )
          ) : (
            copy.notScored
          )}
        </p>
        <button type="button" className="fd-btn fd-btn--secondary fd-btn--sm fdd-self-start" onClick={onDone}>
          {copy.cancel}
        </button>
      </div>
    );
  }

  const base = `fdd-vlog-${contact.id}`;
  return (
    <form className="fdd-vlog__form" onSubmit={save} aria-label={fill(a.title, { company: contact.companyName })}>
      <p className="fdd-rows__title">{fill(a.title, { company: contact.companyName })}</p>
      <div className="fdd-vlog__grid">
        <div className="fdd-vlog__field">
          <label htmlFor={`${base}-date`} className="fdd-vlog__label">
            {a.dateLabel}
          </label>
          <input
            id={`${base}-date`}
            type="date"
            className="fdd-input"
            value={date}
            max={todayIso}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <div className="fdd-vlog__field">
          <label htmlFor={`${base}-size`} className="fdd-vlog__label">
            {a.sizeLabel}
          </label>
          <SizeSelect id={`${base}-size`} value={size} onChange={setSize} allowUnknown={false} />
        </div>
      </div>
      <Choices
        name={`${base}-channel`}
        legend={copy.channelLabel}
        options={CONTACT_CHANNELS}
        labels={copy.channels}
        value={channel}
        onChange={setChannel}
      />
      <Choices
        name={`${base}-problem`}
        legend={a.problemLabel}
        options={PROBLEM_STANCES}
        labels={a.problem}
        value={problem}
        onChange={setProblem}
      />
      <div className="fdd-vlog__grid">
        <div className="fdd-vlog__field">
          <label htmlFor={`${base}-price`} className="fdd-vlog__label">
            {a.priceTestedLabel}
          </label>
          <input
            id={`${base}-price`}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            className="fdd-input"
            value={priceTested}
            onChange={(event) => setPriceTested(event.target.value)}
          />
        </div>
      </div>
      <Choices
        name={`${base}-pricestance`}
        legend={a.priceLabel}
        options={PRICE_STANCES}
        labels={a.price}
        value={priceStance}
        onChange={setPriceStance}
      />
      {priceStance !== null && priceStance !== "accepts" && (
        <div className="fdd-vlog__grid">
          <div className="fdd-vlog__field">
            <label htmlFor={`${base}-counter`} className="fdd-vlog__label">
              {a.counterOfferLabel}
            </label>
            <input
              id={`${base}-counter`}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              className="fdd-input"
              value={counter}
              onChange={(event) => setCounter(event.target.value)}
            />
          </div>
        </div>
      )}
      <div className="fdd-vlog__field">
        <label htmlFor={`${base}-quote`} className="fdd-vlog__label">
          {a.quoteLabel}
        </label>
        <textarea
          id={`${base}-quote`}
          className="fdd-textarea"
          rows={3}
          maxLength={QUOTE_MAX}
          value={quote}
          onChange={(event) => setQuote(event.target.value)}
          aria-describedby={`${base}-quote-hint`}
        />
        <p id={`${base}-quote-hint`} className="fdd-muted">
          {a.quoteHint} {a.privacyHint}
        </p>
      </div>
      <p className="fdd-note">{a.selfReportedNote}</p>
      {error && (
        <p className="fdd-muted" role="alert">
          {error}
        </p>
      )}
      <div className="fdd-myplan__actions">
        <button type="submit" className="fd-btn fd-btn--primary fd-btn--sm" disabled={!complete || state === "saving"}>
          {state === "saving" ? copy.saving : copy.save}
        </button>
        <button type="button" className="fd-btn fd-btn--secondary fd-btn--sm" onClick={onDone}>
          {copy.cancel}
        </button>
      </div>
    </form>
  );
}

/** Markera ett planerat bolag som kontaktat: kanal och dag. */
function ContactedForm({
  contact,
  todayIso,
  actions,
  onDone,
}: {
  contact: ValidationContact;
  todayIso: string;
  actions: ValidationLogActions;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const copy = t.validationLog;
  const failureText = useFailureText();
  const [channel, setChannel] = useState<ContactChannel | null>(null);
  const [date, setDate] = useState(todayIso);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!channel) return;
    setBusy(true);
    const result = await actions
      .markContacted(contact.id, channel, date)
      .catch((): ValidationActionResult => ({ ok: false, reason: "unavailable" }));
    setBusy(false);
    if (result.ok) onDone();
    else setError(failureText(result.reason));
  }

  const base = `fdd-vlog-${contact.id}-c`;
  return (
    <form className="fdd-vlog__form" onSubmit={save}>
      <Choices name={`${base}-channel`} legend={copy.channelLabel} options={CONTACT_CHANNELS} labels={copy.channels} value={channel} onChange={setChannel} />
      <div className="fdd-vlog__grid">
        <div className="fdd-vlog__field">
          <label htmlFor={`${base}-date`} className="fdd-vlog__label">
            {copy.dateLabel}
          </label>
          <input id={`${base}-date`} type="date" className="fdd-input" value={date} max={todayIso} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      {error && (
        <p className="fdd-muted" role="alert">
          {error}
        </p>
      )}
      <div className="fdd-myplan__actions">
        <button type="submit" className="fd-btn fd-btn--primary fd-btn--sm" disabled={!channel || !date || busy}>
          {copy.confirmContacted}
        </button>
        <button type="button" className="fd-btn fd-btn--secondary fd-btn--sm" onClick={onDone}>
          {copy.cancel}
        </button>
      </div>
    </form>
  );
}

function ContactRow({
  contact,
  todayIso,
  scoreHref,
  actions,
}: {
  contact: ValidationContact;
  todayIso: string;
  scoreHref: string;
  actions: ValidationLogActions;
}) {
  const { t, locale } = useI18n();
  const copy = t.validationLog;
  const failureText = useFailureText();
  const [mode, setMode] = useState<"view" | "contacted" | "answer">("view");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function simple(action: (id: string) => Promise<ValidationActionResult>) {
    setBusy(true);
    setError(null);
    const result = await action(contact.id).catch((): ValidationActionResult => ({ ok: false, reason: "unavailable" }));
    setBusy(false);
    if (!result.ok) setError(failureText(result.reason));
  }

  const size = SIZE_CLASSES.find((entry) => entry.key === (contact.answer?.sizeClass ?? contact.sizeClass));
  const answer = contact.answer;

  return (
    <li className="fdd-myplan__item fdd-vlog__item">
      <div className="fdd-vlog__main">
        <div className="fdd-inline">
          <p className="fdd-rows__title">{contact.companyName}</p>
          <Pill tone={statusTone[contact.status]}>{copy.status[contact.status]}</Pill>
        </div>
        <p className="fdd-muted">
          {[
            size ? `${size.range} ${t.site.registry.employeesUnit}` : null,
            contact.contactedOnIso && contact.channel
              ? fill(copy.contactedOn, { date: formatDate(contact.contactedOnIso, locale), channel: copy.channels[contact.channel].toLowerCase() })
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {answer && mode !== "answer" && (
          <div className="fdd-stack fdd-stack--tight">
            <div className="fdd-inline">
              <Pill tone={problemTone[answer.problemStance]}>{copy.answer.problem[answer.problemStance]}</Pill>
              <Pill tone={priceTone[answer.priceStance]}>{copy.answer.price[answer.priceStance]}</Pill>
              <span className="fdd-muted">{fill(copy.priceTested, { price: formatCount(answer.priceTestedKr, locale) })}</span>
              {answer.counterOfferKr !== null && (
                <span className="fdd-muted">{fill(copy.counterOffer, { price: formatCount(answer.counterOfferKr, locale) })}</span>
              )}
            </div>
          </div>
        )}
      </div>
      {mode === "view" && (
        <div className="fdd-myplan__actions">
          {contact.status === "planned" && (
            <button type="button" className="fd-btn fd-btn--primary fd-btn--sm" onClick={() => setMode("contacted")} disabled={busy}>
              {copy.markContacted}
            </button>
          )}
          {contact.status !== "responded" && (
            <button
              type="button"
              className={`fd-btn fd-btn--sm ${contact.status === "planned" ? "fd-btn--secondary" : "fd-btn--primary"}`}
              onClick={() => setMode("answer")}
              disabled={busy}
            >
              {copy.logAnswer}
            </button>
          )}
          {contact.status === "responded" && (
            <button type="button" className="fd-btn fd-btn--secondary fd-btn--sm" onClick={() => setMode("answer")}>
              {copy.editAnswer}
            </button>
          )}
          {(contact.status === "planned" || contact.status === "contacted") && (
            <>
              <button type="button" className="fd-btn fd-btn--secondary fd-btn--sm" onClick={() => simple(actions.markDeclined)} disabled={busy}>
                {copy.markDeclined}
              </button>
              <button type="button" className="fd-btn fd-btn--secondary fd-btn--sm" onClick={() => simple(actions.removeContact)} disabled={busy}>
                {copy.remove}
              </button>
            </>
          )}
        </div>
      )}
      {mode === "contacted" && <ContactedForm contact={contact} todayIso={todayIso} actions={actions} onDone={() => setMode("view")} />}
      {mode === "answer" && (
        <AnswerForm contact={contact} todayIso={todayIso} scoreHref={scoreHref} actions={actions} onDone={() => setMode("view")} />
      )}
      {error && (
        <p className="fdd-muted" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

/**
 * Kontaktlistan i Valideringen (/app): lägg till bolag, markera dem som
 * kontaktade, logga svaren. Status går bara framåt; ett bolag som svarat kan
 * få ett nytt svar men aldrig tas bort. Skärmen skickar ingenting till någon:
 * grundaren pratar själv med bolagen (sändspärren gäller).
 */
export function ValidationContacts({
  contacts,
  todayIso,
  scoreHref,
  actions,
}: {
  contacts: ValidationContact[];
  todayIso: string;
  scoreHref: string;
  actions: ValidationLogActions;
}) {
  const { t } = useI18n();
  const copy = t.validationLog;
  // Det som väntar på en handling först: kontaktade, planerade, sedan klara.
  const order: Record<ContactStatus, number> = { contacted: 0, planned: 1, responded: 2, declined: 3 };
  const sorted = [...contacts].sort((a, b) => order[a.status] - order[b.status]);
  return (
    <div className="fdd-stack fdd-stack--tight">
      <p className="fdd-muted">{copy.listLede}</p>
      {sorted.length === 0 ? (
        <p className="fdd-note">{copy.listEmpty}</p>
      ) : (
        <ul className="fdd-myplan">
          {sorted.map((contact) => (
            <ContactRow key={contact.id} contact={contact} todayIso={todayIso} scoreHref={scoreHref} actions={actions} />
          ))}
        </ul>
      )}
      <AddContact actions={actions} />
    </div>
  );
}
