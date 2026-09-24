"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import type { OnboardingScript } from "@/ports/ProfileRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { FriChat } from "../../_components/FriParts";
import { FRI_DEMO_BASE } from "../../_lib/friPaths";

// Samma tempo som screens/OnboardingProfile.
const REVEAL_ANSWER_DELAY_MS = 900;
const ADVANCE_DELAY_MS = 1400;

/** Profilsamtalet i kopian (= /demo/start/profil). */
export default function FriStartProfilePage() {
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
  return <ProfileConversation key={entry} script={script} />;
}

function ProfileConversation({ script }: { script: OnboardingScript }) {
  const { t } = useI18n();
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
    <div className="fri-start-narrow">
      <p className="fri-mono fri-muted">{t.onboarding.profile.eyebrow}</p>
      <h1 className="fri-h1-demo" style={{ marginTop: 14 }}>
        {t.onboarding.profile.title}
      </h1>
      <p className="fri-lead" style={{ marginTop: 16 }}>
        {t.onboarding.profile.subtitle}
      </p>

      <div className="fri-convo-items" style={{ marginTop: 40 }}>
        {answered.map((question) => (
          <div key={question.id} className="fri-convo-pair">
            <FriChat role="cofounder" text={question.cofounderText} />
            <FriChat role="founder" text={question.suggestedAnswer} />
          </div>
        ))}
        {current && (
          <div className="fri-convo-pair">
            <FriChat role="cofounder" text={current.cofounderText} />
            {answerRevealed && <FriChat role="founder" text={current.suggestedAnswer} />}
          </div>
        )}
        {allAnswered && <FriChat role="cofounder" text={script.closingMessage} />}
      </div>

      {answered.length > 0 && (
        <section className="fri-ruled" style={{ marginTop: 40 }}>
          <p className="fri-mono fri-muted">{t.onboarding.profile.buildingTitle}</p>
          <ul className="fri-reasons">
            {answered.map((question) => (
              <li key={question.id}>{question.suggestedAnswer}</li>
            ))}
          </ul>
        </section>
      )}

      {allAnswered && (
        <Link href={FRI_DEMO_BASE} onClick={completeOnboarding} className="fri-btn fri-btn-signal" style={{ marginTop: 36 }}>
          {t.onboarding.profile.continueCta}
        </Link>
      )}
    </div>
  );
}
