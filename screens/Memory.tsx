"use client";

import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { useI18n } from "@/i18n/context";
import { formatDate } from "@/i18n/format";
import type { DataKind } from "@/core/domain";
import type { ProfileQuestionId } from "@/core/onboarding";
import type { ProfileSummary, TraceEvent } from "@/ports/MemoryRepository";
import type { OnboardingQuestion } from "@/ports/ProfileRepository";
import { SourceTag } from "@/components/ui/SourceTag";
import { textHasFigure } from "@/core/figures";
import { PageHead } from "./blocks/PageBlocks";
import type { SaveOnboardingAnswer } from "./blocks/OnboardingQuestion";
import { RemainingQuestions } from "./blocks/RemainingQuestions";
import { FitPanel, type SaveFitAnswer } from "./blocks/FitPanel";
import type { EvidenceView } from "@/ports/EvidenceRecorder";

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
  /** Passform från profilen (docs/bevislagring.md 5.1). Bara /app skickar den:
   * demots poäng är manusstyrd och sparar inga bevis. `evidence: null` är ett
   * platshållarfel (inget aktivt projekt) och ger "Kommer snart" i rutan. */
  fit?: { evidence: EvidenceView[] | null; onSave: SaveFitAnswer; scoreHref: string };
  /** Frågorna som återstår från profilsamtalet (spec v4 §3.2). Bara /app
   * skickar den. `questions: null` är ett platshållarfel. `todayIso` är datumet
   * i källan "Din uppgift" på ett svar med en siffra under Dina svar. */
  remaining?: { questions: OnboardingQuestion[] | null; onSave: SaveOnboardingAnswer; todayIso: string };
};

/**
 * Minnet (avsnitt 6, 9.3): flikarna Profilen, Hjärnan (går att skriva i) och
 * Spåret. Markup flyttad rakt av från demots `app/demo/(app)/minnet/page.tsx`
 * (PR 5, docs/plan-en-design.md).
 */
/** Fritextfrågorna från före v4, i den ordning panelerna visar dem. */
const LEGACY_IDS: readonly ProfileQuestionId[] = ["role", "bio", "frustrations", "customer", "time", "money", "risk"];

export function Memory({ data, dataKind, onSaveBrainNotes, fit, remaining }: MemoryProps) {
  const { t, locale } = useI18n();
  const copy = t.memoryPage;
  const { profile, trace } = data;
  const profileQuestions = t.onboarding.profileQuestions;

  // Frågan som den ställdes i grundarens ingång. En fråga som ingången inte
  // ställer visas ändå (som en lucka) med den andra ingångens formulering.
  function questionText(id: ProfileQuestionId): string {
    if (!profile) return "";
    const asked: Partial<Record<ProfileQuestionId, string>> = profileQuestions[profile.entry];
    const noIdea: Partial<Record<ProfileQuestionId, string>> = profileQuestions.noIdea;
    const hasIdea: Partial<Record<ProfileQuestionId, string>> = profileQuestions.hasIdea;
    return asked[id] ?? noIdea[id] ?? hasIdea[id] ?? "";
  }

  // Svaret som det sparades, eller en lucka. Fylls aldrig i. Ett fält som
  // källan inte skickar alls (undefined, demots nyare frågor) visas inte. När
  // v4-svaren finns (`answers`, plattformen) är fälten fritextsvar från före
  // v4: bara de som har ett svar visas, och luckorna står under Återstår.
  function shownIds(ids: readonly ProfileQuestionId[]): ProfileQuestionId[] {
    if (!profile) return [];
    return ids.filter((id) => profile[id] !== undefined && (profile.answers === undefined || profile[id] !== null));
  }

  function renderAnswers(ids: readonly ProfileQuestionId[]) {
    if (!profile) return null;
    return (
      <ul className="fdd-layers">
        {shownIds(ids).map((id) => {
          const answer = profile[id];
          return (
            <li key={id}>
              <p className="fdd-muted">{questionText(id)}</p>
              <p>{answer ?? <em className="fdd-muted">{copy.notAnswered}</em>}</p>
            </li>
          );
        })}
      </ul>
    );
  }
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
      {profile && (profile.name || profile.role) ? (
        <PageHead
          title={[profile.name, profile.role].filter(Boolean).join(", ")}
          lede={profile.bio ?? undefined}
        />
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
          {profile && (profile.answers === undefined || shownIds(LEGACY_IDS).length > 0) && (
            <div className="fdd-two">
              <section className="fd-panel" aria-labelledby="fdd-mem-bg">
                <h2 id="fdd-mem-bg" className="fdd-label">
                  {copy.profileBackgroundLabel}
                </h2>
                {profile.name && <p className="fdd-panel__title">{profile.name}</p>}
                {renderAnswers(["role", "bio", "frustrations", "customer"])}
              </section>
              <section className="fd-panel" aria-labelledby="fdd-mem-res">
                <h2 id="fdd-mem-res" className="fdd-label">
                  {copy.profileResourcesLabel}
                </h2>
                {renderAnswers(["time", "money", "risk"])}
              </section>
            </div>
          )}
          {profile?.answers && profile.answers.length > 0 && (
            <section className="fd-panel" aria-labelledby="fdd-mem-answers">
              <h2 id="fdd-mem-answers" className="fdd-label">
                {copy.answersLabel}
              </h2>
              <ul className="fdd-layers">
                {profile.answers.map((answer) => (
                  <li key={answer.questionId}>
                    <p className="fdd-muted">{answer.question}</p>
                    <p className="fdd-inline">
                      {answer.answer}
                      {remaining && textHasFigure(answer.answer) && (
                        <SourceTag
                          source={{ namn: t.evidence.internalSources.profile, hämtad: remaining.todayIso }}
                          dataType="user"
                        />
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!profile && <ComingSoon />}
          {profile && remaining && <RemainingQuestions questions={remaining.questions} onSave={remaining.onSave} />}
          {fit &&
            (fit.evidence ? (
              <FitPanel evidence={fit.evidence} onSave={fit.onSave} scoreHref={fit.scoreHref} />
            ) : (
              <section className="fd-panel" aria-label={t.fitPanel.title}>
                <p className="fdd-label">{t.fitPanel.title}</p>
                <ComingSoon />
              </section>
            ))}
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
