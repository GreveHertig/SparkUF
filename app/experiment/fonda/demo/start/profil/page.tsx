"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { OnboardingScript } from "@/ports/ProfileRepository";
import { ChatLine } from "../../_components/DemoBlocks";
import { FONDA_DEMO_PATHS } from "../../_lib/paths";

// Samma takt som det riktiga demots profilsamtal (screens/OnboardingProfile.tsx):
// frågan står ensam en stund, svaret kommer, och samtalet går vidare av sig självt.
const REVEAL_ANSWER_DELAY_MS = 900;
const ADVANCE_DELAY_MS = 1400;

export default function FondaDemoProfilePage() {
  const { locale } = useI18n();
  const entry = useDemoStore((state) => state.entry);
  const [script, setScript] = useState<OnboardingScript | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoProfileRepository.getOnboardingScript(entry, locale).then((result) => {
      if (!cancelled) setScript(result);
    });
    return () => {
      cancelled = true;
    };
  }, [entry, locale]);

  if (!script) return null;
  // Ett byte av ingång börjar samtalet om från början.
  return <ProfileConversation key={entry} script={script} />;
}

function ProfileConversation({ script }: { script: OnboardingScript }) {
  const { t } = useI18n();
  const copy = t.onboarding.profile;
  const completeOnboarding = useDemoStore((state) => state.completeOnboarding);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [revealedIndex, setRevealedIndex] = useState(-1);

  const allAnswered = answeredCount >= script.questions.length;
  const answered = script.questions.slice(0, answeredCount);
  const current = script.questions[answeredCount];
  const answerRevealed = revealedIndex === answeredCount;

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => setRevealedIndex(answeredCount), REVEAL_ANSWER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [current, answeredCount]);

  useEffect(() => {
    if (!current || !answerRevealed) return;
    const timer = setTimeout(() => setAnsweredCount((count) => count + 1), ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [current, answerRevealed]);

  return (
    <div className="fdd-page fdd-onboarding">
      <header className="fdd-head">
        <h1 className="fd-h2">{copy.title}</h1>
        <p className="fd-lede">{copy.subtitle}</p>
      </header>

      <div className="fdd-onboarding__grid">
        <div className="fdd-conversation" aria-live="polite">
          {answered.map((question) => (
            <div key={question.id} className="fdd-conversation__pair">
              <ChatLine role="cofounder" text={question.cofounderText} />
              <ChatLine role="founder" text={question.suggestedAnswer} />
            </div>
          ))}
          {current && (
            <div className="fdd-conversation__pair">
              <ChatLine role="cofounder" text={current.cofounderText} />
              {answerRevealed && <ChatLine role="founder" text={current.suggestedAnswer} />}
            </div>
          )}
          {allAnswered && <ChatLine role="cofounder" text={script.closingMessage} />}
        </div>

        <aside className="fd-panel fdd-profilebuild" aria-label={copy.buildingTitle}>
          <p className="fdd-label">{copy.buildingTitle}</p>
          {answered.length > 0 && (
            <ul className="fd-checks fd-checks--small">
              {answered.map((question) => (
                <li key={question.id}>{question.suggestedAnswer}</li>
              ))}
            </ul>
          )}
          {allAnswered && (
            <Link href={FONDA_DEMO_PATHS.home} onClick={completeOnboarding} className="fd-btn fd-btn--primary">
              {copy.continueCta}
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
