"use client";

import { ComingSoon } from "@/components/ui/ComingSoon";
import { useI18n } from "@/i18n/context";
import type { OnboardingQuestion } from "@/ports/ProfileRepository";
import { OnboardingQuestionCard, type SaveOnboardingAnswer } from "./OnboardingQuestion";

/**
 * Återstår i Minnet (spec v4 §3.2): frågorna från profilsamtalet som inte är
 * besvarade, med samma valknappar som i /start/profil. Bara /app visar den.
 * Ett sparat svar försvinner härifrån och syns under Dina svar: actionen
 * förnyar sidan (revalidatePath), så skärmen håller ingen egen lista.
 * `questions: null` är ett platshållarfel och ger "Kommer snart".
 */
export function RemainingQuestions({
  questions,
  onSave,
}: {
  questions: OnboardingQuestion[] | null;
  onSave: SaveOnboardingAnswer;
}) {
  const { t } = useI18n();
  const copy = t.memoryPage;

  return (
    <section className="fd-panel" aria-labelledby="fdd-mem-remaining">
      <h2 id="fdd-mem-remaining" className="fdd-label">
        {copy.remainingTitle}
      </h2>
      {questions === null ? (
        <ComingSoon />
      ) : questions.length === 0 ? (
        <p className="fdd-muted">{copy.remainingDone}</p>
      ) : (
        <div className="fdd-stack">
          <p className="fdd-muted">{copy.remainingLede}</p>
          {questions.map((question) => (
            <OnboardingQuestionCard key={question.id} question={question} onSave={onSave} onSaved={() => {}} />
          ))}
        </div>
      )}
    </section>
  );
}
