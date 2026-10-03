import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { ONBOARDING_CHOICES, ONBOARDING_QUESTIONS_BY_ENTRY, isChoiceQuestion } from "@/core/onboarding";
import type { OnboardingEntry } from "@/core/domain";
import type { OnboardingQuestion } from "@/ports/ProfileRepository";
import { OnboardingQuestionFlow } from "./OnboardingQuestionFlow";

// Profilsamtalet i /start/profil (spec v4 §4): ett svar i taget, sparat
// direkt, fortsätter där det slutade, och startkortet efter kärnfrågorna.

const q = sv.onboarding.v4Questions;
const choices = q.choices;

/** Kärnfrågorna som Profilens liveadapter ger dem (skärmen får aldrig importera adaptern). */
function coreQuestions(entry: OnboardingEntry): OnboardingQuestion[] {
  const texts: Record<string, string> = q[entry];
  return ONBOARDING_QUESTIONS_BY_ENTRY[entry].core.map((id) => {
    if (!isChoiceQuestion(id)) return { id, cofounderText: texts[id], suggestedAnswer: null, kind: "text" };
    const labels: Record<string, string> = choices[id];
    return {
      id,
      cofounderText: texts[id],
      suggestedAnswer: null,
      kind: "choice",
      choices: ONBOARDING_CHOICES[id].map((choice) => ({ id: choice, label: labels[choice] })),
    };
  });
}

/** Sparade svar med dagen de gavs. `null` = svaret saknar tid. */
function savedOn(answers: Record<string, string>, answeredOn: string | null = "2026-10-01") {
  return Object.fromEntries(Object.entries(answers).map(([id, answer]) => [id, { answer, answeredOn }]));
}

function renderFlow(
  entry: OnboardingEntry,
  initialAnswers: Record<string, string> = {},
  saveAnswer = vi.fn().mockResolvedValue({ ok: true, answeredOn: "2026-10-03" }),
  answeredOn: string | null = "2026-10-01",
) {
  const completeAction = vi.fn().mockResolvedValue({ invalid: false });
  render(
    <LocaleProvider>
      <OnboardingQuestionFlow
        entry={entry}
        questions={coreQuestions(entry)}
        initialAnswers={savedOn(initialAnswers, answeredOn)}
        saveAnswer={saveAnswer}
        completeAction={completeAction}
      />
    </LocaleProvider>,
  );
  return { saveAnswer, completeAction };
}

async function choose(label: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: label }));
  });
}

describe("OnboardingQuestionFlow", () => {
  afterEach(cleanup);

  it("ingång A: fyra val, ett i taget, sedan startkortet med tid, pengar och en första uppgift", async () => {
    const { saveAnswer } = renderFlow("noIdea");
    expect(screen.getByText("Fråga 1 av 4")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: sv.onboarding.startFrame.titleNoIdea })).not.toBeInTheDocument();

    await choose(choices.situation.university);
    expect(saveAnswer).toHaveBeenLastCalledWith("situation", "university");
    expect(screen.getByText(q.noIdea.time)).toBeInTheDocument();
    await choose(choices.time.h3to6);
    await choose(choices.money.none);
    expect(screen.queryByRole("button", { name: sv.onboarding.startFrame.continueCta })).not.toBeInTheDocument();
    await choose(choices.soldB2b.yes);

    expect(screen.getByRole("heading", { name: sv.onboarding.startFrame.titleNoIdea })).toBeInTheDocument();
    expect(screen.getByText("39–78 timmar")).toBeInTheDocument();
    expect(screen.getByText(sv.onboarding.startFrame.lines.moneyOwnTime)).toBeInTheDocument();
    expect(screen.getByText(sv.onboarding.startFrame.lines.soldB2bYes)).toBeInTheDocument();
    expect(screen.getByText(sv.onboarding.startFrame.tasks.callPastBuyer)).toBeInTheDocument();
    expect(screen.getByText("3 frågor återstår. Du hittar dem under Återstår i Minnet och kan svara när du vill.")).toBeInTheDocument();
    // Siffrorna bär källan "Din uppgift", med dagen databasen sparade svaret.
    const tags = screen.getAllByRole("button", { name: sv.common.sourceTag.openDetails });
    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags) expect(tag).toHaveTextContent(`${sv.common.userSourceLabel}·${sv.evidence.internalSources.profile}·3 oktober`);
    expect(screen.getByRole("button", { name: sv.onboarding.startFrame.continueCta })).toBeInTheDocument();
  });

  it("fortsätter vid första obesvarade fråga och visar de givna svaren", () => {
    renderFlow("noIdea", { situation: "employed", time: "over10" });
    expect(screen.getByText("Fråga 3 av 4")).toBeInTheDocument();
    expect(screen.getByText(choices.situation.employed)).toBeInTheDocument();
    expect(screen.getByText(choices.time.over10)).toBeInTheDocument();
    expect(screen.getByText(q.noIdea.money)).toBeInTheDocument();
  });

  it("med kärnfrågorna besvarade visas startkortet direkt, och ett svar går att ändra", async () => {
    const { saveAnswer } = renderFlow("noIdea", { situation: "employed", time: "over10", money: "k1to5", soldB2b: "no" });
    expect(screen.getByText("Mer än 130 timmar")).toBeInTheDocument();
    expect(screen.getByText(sv.onboarding.startFrame.tasks.askThreeAdults)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: sv.onboarding.profile.changeCta })[1]);
    });
    expect(screen.getByRole("button", { name: choices.time.over10 })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("heading", { name: sv.onboarding.startFrame.titleNoIdea })).not.toBeInTheDocument();
    await choose(choices.time.under3);
    expect(saveAnswer).toHaveBeenLastCalledWith("time", "under3");
    expect(screen.getByText("Under 39 timmar")).toBeInTheDocument();
    expect(screen.getByText(sv.onboarding.startFrame.lines.timeSmall)).toBeInTheDocument();
  });

  it("källans datum är dagen svaret gavs, och ett svar utan tid får inget datum", () => {
    renderFlow("noIdea", { situation: "employed", time: "h3to6", money: "under1000", soldB2b: "no" });
    const dated = screen.getAllByRole("button", { name: sv.common.sourceTag.openDetails });
    expect(dated[0]).toHaveTextContent("1 oktober");
    cleanup();

    renderFlow("noIdea", { situation: "employed", time: "h3to6", money: "under1000", soldB2b: "no" }, undefined, null);
    for (const tag of screen.getAllByRole("button", { name: sv.common.sourceTag.openDetails })) {
      expect(tag.textContent).toBe(`${sv.common.userSourceLabel}·${sv.evidence.internalSources.profile}`);
    }
  });

  it("ingång B: kundgissningen är fritext, och startkortet återger den ordagrant i uppgiften", async () => {
    renderFlow("hasIdea", { situation: "employed", payer: "business" });
    const field = screen.getByRole("textbox", { name: q.hasIdea.customer });
    fireEvent.change(field, { target: { value: "  Padelhallar i Lund " } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: sv.onboarding.profile.textSubmitCta }));
    });
    await choose(choices.talkedTo.none);
    expect(screen.getByRole("heading", { name: sv.onboarding.startFrame.titleHasIdea })).toBeInTheDocument();
    expect(screen.getByText("Prata med fem av dem du nämnde (”Padelhallar i Lund”) den här veckan. Fråga hur de löser det i dag.")).toBeInTheDocument();
    expect(screen.getByText(sv.onboarding.startFrame.lines.payerBusiness)).toBeInTheDocument();
    expect(screen.getByText(sv.onboarding.startFrame.lines.talkedNone)).toBeInTheDocument();
  });

  it("ett avvisat svar och ett fel visas, och frågan står kvar", async () => {
    const saveAnswer = vi.fn().mockResolvedValueOnce({ ok: false, reason: "invalid" }).mockRejectedValueOnce(new Error("nere"));
    renderFlow("noIdea", {}, saveAnswer);
    await choose(choices.situation.employed);
    expect(screen.getByRole("alert")).toHaveTextContent("Välj ett av svaren");
    await choose(choices.situation.employed);
    expect(screen.getByRole("alert")).toHaveTextContent(sv.onboarding.profile.saveFailed);
    expect(screen.getByText("Fråga 1 av 4")).toBeInTheDocument();
  });
});
