"use client";

import type { ReactNode } from "react";
import type { JuridisktKrav } from "@/core/domain";
import type { DataType } from "@/design/tokens";
import { useI18n } from "@/i18n/context";
import { formatCount } from "@/i18n/format";
import { getScoreLevel } from "@/score/levels";
import type { Simulation } from "@/ports/SimulationProvider";
import type { Källa } from "@/types/evidence";
import { FriSource } from "./FriSource";

// Kopior av demots mindre byggblock (ChatMessage, ToolRunCard, TimeSkip,
// PromptBox, ConceptBadge, SimulationCard, VerdictCard, KpiTile, BarChart,
// LegalMap, LockedState) i /experiment/fri-stil. Samma data och texter;
// originalen i components/ är orörda.

export function FriPageHead({ kicker, title, lead, right }: { kicker?: ReactNode; title: ReactNode; lead?: ReactNode; right?: ReactNode }) {
  return (
    <header className="fri-pagehead">
      <div>
        {kicker && <p className="fri-mono fri-muted">{kicker}</p>}
        <h1
          className={typeof title === "string" && title.length > 60 ? "fri-h1-demo long" : "fri-h1-demo"}
          style={{ marginTop: kicker ? 14 : 0 }}
        >
          {title}
        </h1>
        {lead && (
          <p className="fri-lead" style={{ marginTop: 16 }}>
            {lead}
          </p>
        )}
      </div>
      {right}
    </header>
  );
}

export function FriSectionTitle({ title, right, id }: { title: ReactNode; right?: ReactNode; id?: string }) {
  return (
    <div className="fri-section-title" id={id}>
      <h2 className="fri-h2-demo">{title}</h2>
      {right && <span className="fri-muted" style={{ fontSize: "0.92rem" }}>{right}</span>}
    </div>
  );
}

export function FriLocked({ hint, children }: { hint: string; children?: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="fri-locked">
      <p className="fri-mono">{t.lockedState.title}</p>
      {children && <div style={{ marginTop: 10, opacity: 0.7 }}>{children}</div>}
      <p style={{ marginTop: 8 }}>{hint}</p>
    </div>
  );
}

export function FriStatus({ children, tone = "muted" }: { children: ReactNode; tone?: "ok" | "warn" | "muted" | "signal" }) {
  return <span className={`fri-status ${tone}`}>{children}</span>;
}

export function FriChat({ role, text }: { role: "founder" | "cofounder"; text: string }) {
  return (
    <div className={`fri-chat ${role}`}>
      <p>{text}</p>
    </div>
  );
}

export function FriToolRun({ label, steps }: { label: string; steps: string[] }) {
  const { t } = useI18n();
  return (
    <div className="fri-toolrun">
      <p className="fri-mono">
        {t.cofounderPage.toolRunningLabel}: {label}
      </p>
      <ul>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
    </div>
  );
}

export function FriTimeSkip({ label }: { label: string }) {
  return (
    <div className="fri-timeskip">
      <span className="fri-mono">{label}</span>
    </div>
  );
}

export function FriPrompt() {
  const { t } = useI18n();
  return (
    <div className="fri-prompt">
      <textarea
        disabled
        rows={1}
        placeholder={t.cofounderPage.promptPlaceholder}
        aria-label={t.cofounderPage.promptPlaceholder}
      />
      <button type="button" disabled aria-label={t.cofounderPage.promptSendLabel} className="fri-btn fri-btn-ink fri-small-btn">
        <SendIcon />
      </button>
    </div>
  );
}

/** Samma ikon som PromptBox. */
function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** = ConceptBadge: Hiasynth och Lovable märks alltid som koncept. */
export function FriConcept() {
  const { t } = useI18n();
  return <span className="fri-concept">{t.common.conceptBadge}</span>;
}

export function FriSimulation({ simulation }: { simulation: Simulation }) {
  const { t, locale } = useI18n();
  return (
    <div className="fri-sim">
      <div className="fri-sim-head">
        <p className="fri-mono">{simulation.question}</p>
        <FriConcept />
      </div>
      <p className="fri-sim-result">{simulation.result}</p>
      <p className="fri-muted" style={{ marginTop: 6 }}>
        {simulation.uncertaintyRangeLabel}
      </p>
      <div className="fri-sim-foot">
        <span className="fri-mono fri-muted">
          {t.common.simulationPopulationLabel}: {formatCount(simulation.populationSize, locale)}
        </span>
        <FriSource source={simulation.source} dataType="simulation" />
      </div>
    </div>
  );
}

export function FriVerdict({ score, headline, reasoning }: { score: number; headline: string; reasoning: string }) {
  const { t } = useI18n();
  const level = getScoreLevel(score);
  return (
    <div className="fri-verdict">
      <div>
        <p className="fri-mono" style={{ color: "var(--muted-dark)" }}>
          {t.score.levels[level.key].name}
        </p>
        <p className="fri-verdict-score">
          {score}
          <small>/100</small>
        </p>
      </div>
      <div>
        <p className="fri-verdict-headline">{headline}</p>
        <p style={{ marginTop: 10, color: "var(--muted-dark)" }}>{reasoning}</p>
      </div>
    </div>
  );
}

export function FriKpi({
  label,
  value,
  unit,
  description,
  source,
  dataType = "register",
  tone,
}: {
  label: string;
  value: number | string;
  unit?: string;
  description?: string;
  source?: Källa;
  dataType?: DataType;
  tone?: "signal";
}) {
  const { locale } = useI18n();
  const display = typeof value === "number" ? formatCount(value, locale) : value;
  return (
    <div className="fri-ruled">
      <dt className="fri-muted">{label}</dt>
      <dd className="fri-fact-num" style={{ color: tone === "signal" ? "var(--signal-ink)" : undefined }}>
        {display}
        {unit && <small>{unit}</small>}
      </dd>
      {description && (
        <dd className="fri-muted" style={{ marginTop: 8, fontSize: "0.92rem" }}>
          {description}
        </dd>
      )}
      {source && (
        <dd style={{ marginTop: 12 }}>
          <FriSource source={source} dataType={dataType} />
        </dd>
      )}
    </div>
  );
}

export function FriBarChart({ bars }: { bars: { label: string; value: number }[] }) {
  const { locale } = useI18n();
  const max = Math.max(1, ...bars.map((bar) => bar.value));
  return (
    <div className="fri-barchart">
      {bars.map((bar) => (
        <div key={bar.label} className="fri-barchart-row">
          <span className="fri-muted">{bar.label}</span>
          <span className="fri-barchart-track" aria-hidden="true">
            <span className="fri-barchart-fill" style={{ width: `${(bar.value / max) * 100}%` }} />
          </span>
          <span className="fri-mono" style={{ textAlign: "right", color: "var(--ink)" }}>
            {formatCount(bar.value, locale)}
          </span>
        </div>
      ))}
    </div>
  );
}

const legalTone: Record<JuridisktKrav["status"], "ok" | "warn" | "muted"> = {
  uppfyllt: "ok",
  ej_uppfyllt: "warn",
  ej_tillämpligt: "muted",
};

export function FriLegalMap({ krav }: { krav: JuridisktKrav[] }) {
  const { t } = useI18n();
  return (
    <ul className="fri-legal">
      {krav.map((item) => (
        <li key={item.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
            <p style={{ fontSize: "1.15rem", fontWeight: 540, letterSpacing: "-0.01em" }}>{item.rubrik}</p>
            <FriStatus tone={legalTone[item.status]}>{t.legalPage.status[item.status]}</FriStatus>
          </div>
          <p className="fri-muted" style={{ marginTop: 6, maxWidth: "70ch" }}>
            {item.beskrivning}
          </p>
          <div style={{ marginTop: 12 }}>
            <FriSource source={item.källa} />
          </div>
        </li>
      ))}
    </ul>
  );
}
