"use client";

import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { useI18n } from "@/i18n/context";
import { formatDate } from "@/i18n/format";
import type { DataKind } from "@/core/domain";
import type { ProfileSummary, TraceEvent } from "@/ports/MemoryRepository";
import { PageHead } from "./blocks/PageBlocks";

/**
 * Datan skärmen behöver, redan hämtad av den monterande routen (via en
 * MemoryRepository-adapter). Skärmen vet inte om datan kom från /demo eller
 * /app (avsnitt 14.1).
 *
 * Varje fält är nullbart för sig (platshållare per sektion, PR 3,
 * docs/plan-en-design.md): `null` betyder att adaptern kastade ett
 * platshållarfel för just det anropet, och bara den fliken visar då
 * `ComingSoon`. Tom text i Hjärnan och en tom lista i Spåret är ärliga
 * tomlägen, inte luckor.
 */
export type MemoryData = {
  profile: ProfileSummary | null;
  brainNotes: string | null;
  trace: TraceEvent[] | null;
};

type MemoryProps = {
  data: MemoryData;
  dataKind: DataKind;
  /** Sparar Hjärnan när fältet lämnas. Demot sparar i sitt eget läge, /app via en Server Action. */
  onSaveBrainNotes: (notes: string) => Promise<void> | void;
};

/**
 * Minnet (avsnitt 6, 9.3): flikarna Profilen, Hjärnan (går att skriva i) och
 * Spåret. Markup flyttad rakt av från demots `app/demo/(app)/minnet/page.tsx`
 * (PR 5, docs/plan-en-design.md).
 */
export function Memory({ data, dataKind, onSaveBrainNotes }: MemoryProps) {
  const { t, locale } = useI18n();
  const copy = t.memoryPage;
  const { profile, trace } = data;
  const [notes, setNotes] = useState(data.brainNotes ?? "");
  const [saveFailed, setSaveFailed] = useState(false);

  function save() {
    Promise.resolve()
      .then(() => onSaveBrainNotes(notes))
      .then(
        () => setSaveFailed(false),
        () => setSaveFailed(true),
      );
  }

  return (
    <div className="fdd-page">
      {profile ? (
        <PageHead title={`${profile.name}, ${profile.role}`} lede={profile.bio} />
      ) : (
        // Ingen profil att visa namnet för — sidans namn blir rubriken.
        <PageHead title={copy.title} />
      )}

      <Tabs.Root defaultValue="profile" className="fdd-memory">
        <Tabs.List className="fdd-segmented" aria-label={t.appShell.nav.memory}>
          {(["profile", "brain", "trace"] as const).map((tab) => (
            <Tabs.Trigger key={tab} value={tab} className="fdd-segmented__item">
              {copy.tabs[tab]}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="profile" className="fdd-memory__panel">
          {profile ? (
            <div className="fdd-two">
              <section className="fd-panel" aria-labelledby="fdd-mem-bg">
                <h2 id="fdd-mem-bg" className="fdd-label">
                  {copy.profileBackgroundLabel}
                </h2>
                <p className="fdd-panel__title">{profile.name}</p>
                <p className="fdd-muted">{profile.role}</p>
                <p className="fdd-body">{profile.bio}</p>
              </section>
              <section className="fd-panel" aria-labelledby="fdd-mem-res">
                <h2 id="fdd-mem-res" className="fdd-label">
                  {copy.profileResourcesLabel}
                </h2>
                <ul className="fd-checks fd-checks--small">
                  <li>{profile.time}</li>
                  <li>{profile.money}</li>
                  <li>{profile.risk}</li>
                </ul>
              </section>
            </div>
          ) : (
            <ComingSoon />
          )}
        </Tabs.Content>

        <Tabs.Content value="brain" className="fdd-memory__panel">
          {data.brainNotes === null ? (
            <ComingSoon />
          ) : (
            <div className="fd-panel">
              <label htmlFor="fdd-brain" className="fdd-muted">
                {dataKind === "example" ? copy.brainHint : copy.brainHintLive}
              </label>
              <textarea
                id="fdd-brain"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                onBlur={save}
                rows={7}
                className="fdd-textarea"
              />
              {saveFailed && (
                <p className="fdd-muted" role="alert">
                  {copy.brainSaveFailed}
                </p>
              )}
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="trace" className="fdd-memory__panel">
          {trace === null ? (
            <ComingSoon />
          ) : trace.length === 0 ? (
            <p className="fdd-muted">{copy.traceEmpty}</p>
          ) : (
            <ol className="fdd-trace">
              {trace.map((event) => (
                <li key={event.id}>
                  <time dateTime={event.timestampIso} className="fdd-trace__date">
                    {/* Datumdelen bara: liveadaptern ger en hel tidsstämpel,
                        och formatDate lägger själv till T00:00:00. */}
                    {formatDate(event.timestampIso.slice(0, 10), locale)}
                  </time>
                  <span>{event.description}</span>
                </li>
              ))}
            </ol>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
