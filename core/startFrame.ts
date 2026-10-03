// Startkortet efter kärnfrågorna i onboardingen (spec v4 §4: värde inom två
// minuter). Byggs bara av grundarens egna svar (Datalöftet): inget register,
// ingen modell, inga bevis och ingen poäng. Samma svar ger alltid samma kort.
// Texterna ligger i i18n (`onboarding.startFrame`); här väljs bara vilka.
import type { OnboardingEntry } from "@/core/domain";
import type { OnboardingAnswers } from "@/core/onboarding";

/** Tre månader, som tidsfrågan säger ("de närmaste tre månaderna"). */
export const START_FRAME_WEEKS = 13;

/** Timmar i veckan per tidsval: [minst, högst]. `null` betyder öppet uppåt. */
const HOURS_PER_WEEK: Record<string, [number, number | null]> = {
  under3: [0, 3],
  h3to6: [3, 6],
  h6to10: [6, 10],
  over10: [10, null],
};

/** Tiden de närmaste tre månaderna, uträknad ur tidsvalet. */
export type StartFrameHours =
  | { kind: "under"; max: number }
  | { kind: "range"; min: number; max: number }
  | { kind: "over"; min: number };

export type StartFrameLine =
  | "moneyOwnTime"
  | "moneySmallTest"
  | "timeSmall"
  | "soldB2bYes"
  | "payerBusiness"
  | "payerConsumer"
  | "payerPublic"
  | "payerUnsure"
  | "talkedNone"
  | "talkedFew"
  | "talkedMany";

export type StartFrameTask = "callPastBuyer" | "askThreeAdults" | "findPayer" | "talkToFive" | "writeDownPattern";

export type StartFrame = {
  entry: OnboardingEntry;
  /** Bara när tidsfrågan är besvarad (en kärnfråga i ingång A, inte i B). */
  hours: StartFrameHours | null;
  /** Pengavalet, som det besvarades. Bara i ingång A. */
  money: string | null;
  /** Medgrundarens bedömning, regel för regel ur svaren. Aldrig ett faktum. */
  lines: StartFrameLine[];
  /** En första konkret uppgift i verkligheten (spec v4 §3.1). */
  task: StartFrameTask;
  /** Grundarens egen kundgissning, ordagrant. Bara i ingång B. */
  customer: string | null;
};

export function startFrameHours(timeChoice: string | undefined): StartFrameHours | null {
  const range = timeChoice ? HOURS_PER_WEEK[timeChoice] : undefined;
  if (!range) return null;
  const [min, max] = range;
  if (max === null) return { kind: "over", min: min * START_FRAME_WEEKS };
  if (min === 0) return { kind: "under", max: max * START_FRAME_WEEKS };
  return { kind: "range", min: min * START_FRAME_WEEKS, max: max * START_FRAME_WEEKS };
}

function noIdeaFrame(answers: OnboardingAnswers): StartFrame {
  const lines: StartFrameLine[] = [];
  lines.push(answers.money === "none" || answers.money === "under1000" ? "moneyOwnTime" : "moneySmallTest");
  if (answers.time === "under3") lines.push("timeSmall");
  if (answers.soldB2b === "yes") lines.push("soldB2bYes");
  return {
    entry: "noIdea",
    hours: startFrameHours(answers.time),
    money: answers.money ?? null,
    lines,
    task: answers.soldB2b === "yes" ? "callPastBuyer" : "askThreeAdults",
    customer: null,
  };
}

const PAYER_LINE: Record<string, StartFrameLine> = {
  business: "payerBusiness",
  consumer: "payerConsumer",
  public: "payerPublic",
  unsure: "payerUnsure",
};

const TALKED_LINE: Record<string, StartFrameLine> = {
  none: "talkedNone",
  few: "talkedFew",
  many: "talkedMany",
};

function hasIdeaFrame(answers: OnboardingAnswers): StartFrame {
  const lines: StartFrameLine[] = [];
  const payer = answers.payer ? PAYER_LINE[answers.payer] : undefined;
  if (payer) lines.push(payer);
  const talked = answers.talkedTo ? TALKED_LINE[answers.talkedTo] : undefined;
  if (talked) lines.push(talked);
  const task: StartFrameTask =
    answers.payer === "unsure" ? "findPayer" : answers.talkedTo === "many" ? "writeDownPattern" : "talkToFive";
  return {
    entry: "hasIdea",
    hours: null,
    money: null,
    lines,
    task,
    customer: answers.customer?.trim() || null,
  };
}

/** Startkortet för ingången, ur svaren på kärnfrågorna. */
export function buildStartFrame(entry: OnboardingEntry, answers: OnboardingAnswers): StartFrame {
  return entry === "noIdea" ? noIdeaFrame(answers) : hasIdeaFrame(answers);
}
