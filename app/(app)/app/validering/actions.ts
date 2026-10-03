"use server";

import { revalidatePath } from "next/cache";
import { liveValidationLog } from "@/adapters/live/ValidationLog";
import { liveEvidenceRecorder, EvidenceInputError } from "@/adapters/live/EvidenceRecorder";
import { stockholmToday } from "@/adapters/live/evidenceScore";
import { EmptyStateError, NotImplementedError, ValidationLogError } from "@/core/errors";
import {
  answerSource,
  cleanAnswer,
  cleanCompanyName,
  companySubjectRef,
  evidenceKindsForAnswer,
  isContactChannel,
  isSizeClassKey,
  isValidPastDate,
  type LogAnswerResult,
  type PasteResult,
  type ValidationActionResult,
  type ValidationFailure,
} from "@/core/validationLog";
import type { ConversationAnswer } from "@/ports/ValidationLog";

/**
 * Valideringens samtalslogg (/app/validering, docs/moduler/validering.md).
 * Grundaren pratar själv med kunderna och loggar samtalen här. Ingenting
 * skickas härifrån: sändspärren i docs/moduler/utskick-och-svar.md gäller.
 *
 * Indata tas emot som `unknown` och kontrolleras här och i adaptern.
 * Användare och projekt tas ur sessionen. RLS och triggern på
 * `validation_contacts` är de bindande spärrarna. All text är data, aldrig
 * instruktion.
 */


/** Fler namn än så tas aldrig emot i en inklistrad lista. */
const PASTE_MAX = 30;

function failureFor(error: unknown): ValidationFailure {
  if (error instanceof ValidationLogError) return error.reason;
  if (error instanceof NotImplementedError || error instanceof EmptyStateError) return "unavailable";
  throw error;
}

async function run(action: () => Promise<void>): Promise<ValidationActionResult> {
  try {
    await action();
  } catch (error) {
    return { ok: false, reason: failureFor(error) };
  }
  revalidatePath("/app/validering");
  return { ok: true };
}

export async function addValidationContact(companyName: unknown, sizeClass: unknown): Promise<ValidationActionResult> {
  const name = cleanCompanyName(companyName);
  if (!name) return { ok: false, reason: "invalid" };
  if (sizeClass !== null && sizeClass !== undefined && !isSizeClassKey(sizeClass)) return { ok: false, reason: "invalid" };
  return run(async () => {
    await liveValidationLog.addContact({ companyName: name, sizeClass: sizeClass ?? null });
  });
}


/**
 * Klistra in en lista: ett bolag per rad, till exempel ur ett kalkylark eller
 * en söklista. Dubbletter och tomma rader hoppas över och räknas. Högst 30
 * rader per gång.
 */
export async function pasteValidationContacts(text: unknown): Promise<PasteResult> {
  if (typeof text !== "string") return { ok: false, reason: "invalid" };
  const names = text
    .split(/\r?\n|;/)
    .map((line) => cleanCompanyName(line))
    .filter((name) => name.length > 0);
  if (names.length === 0) return { ok: false, reason: "invalid" };
  if (names.length > PASTE_MAX) return { ok: false, reason: "limit" };

  let added = 0;
  let skipped = 0;
  for (const name of names) {
    try {
      await liveValidationLog.addContact({ companyName: name });
      added += 1;
    } catch (error) {
      const reason = failureFor(error);
      if (reason === "duplicate" || reason === "invalid") {
        skipped += 1;
        continue;
      }
      if (added > 0) revalidatePath("/app/validering");
      return { ok: false, reason };
    }
  }
  revalidatePath("/app/validering");
  return { ok: true, added, skipped };
}

export async function markValidationContacted(id: unknown, channel: unknown, dateIso: unknown): Promise<ValidationActionResult> {
  if (typeof id !== "string" || !isContactChannel(channel) || !isValidPastDate(dateIso, stockholmToday())) {
    return { ok: false, reason: "invalid" };
  }
  return run(() => liveValidationLog.markContacted(id, channel, dateIso));
}

export async function markValidationDeclined(id: unknown): Promise<ValidationActionResult> {
  if (typeof id !== "string") return { ok: false, reason: "invalid" };
  return run(() => liveValidationLog.markDeclined(id));
}

export async function removeValidationContact(id: unknown): Promise<ValidationActionResult> {
  if (typeof id !== "string") return { ok: false, reason: "invalid" };
  return run(() => liveValidationLog.removeContact(id));
}


const RETRACT_REASON = "Grundaren ändrade svaret i Valideringen: bolaget tog inte ställning till priset.";

/**
 * Loggar ett svar och gör det till bevis (docs/bevislagring.md, beslut B6):
 * ett om problemet och ett om priset, som självrapporterade med bolaget som
 * källa och samtalets dag som datum. Databasen sätter poäng, del och vikt;
 * ett nytt svar från samma bolag ersätter det gamla (7.2b). Ändras priset
 * till "vet inte" återkallas det tidigare prisbeviset, med en anledning i
 * Spåret, så att poängen aldrig vilar på ett svar som inte längre gäller.
 *
 * Svaret sparas först. Går bevisen inte att skriva (till exempel utan aktivt
 * projekt) står svaret kvar och `scored` är false; nästa sparning försöker
 * igen.
 */
export async function logValidationAnswer(id: unknown, channel: unknown, rawAnswer: unknown): Promise<LogAnswerResult> {
  const today = stockholmToday();
  const answer: ConversationAnswer | null = cleanAnswer(rawAnswer, today);
  if (typeof id !== "string" || !isContactChannel(channel) || !answer) return { ok: false, reason: "invalid" };

  let companyName: string;
  try {
    companyName = (await liveValidationLog.saveAnswer(id, channel, answer)).companyName;
  } catch (error) {
    return { ok: false, reason: failureFor(error) };
  }

  const subjectRef = companySubjectRef(companyName);
  const source = answerSource(companyName, answer.respondedOnIso);
  const kinds = evidenceKindsForAnswer(answer);
  try {
    let result = await liveEvidenceRecorder.recordEvidence(
      { kind: kinds.problem, subjectRef, source, quote: answer.quote, stepNumber: 5 },
      "sv",
    );
    // Poängen före hela sparningen, så att förändringen gäller båda bevisen.
    const before = result.snapshot.total - result.snapshot.delta;
    if (kinds.price) {
      result = await liveEvidenceRecorder.recordEvidence(
        { kind: kinds.price, subjectRef, source, quote: answer.quote, stepNumber: 5 },
        "sv",
      );
    } else {
      const earlier = (await liveEvidenceRecorder.listEvidence("willingnessToPay", "sv")).filter(
        (view) => view.subjectRef === subjectRef && view.canRetract && view.status !== "retracted",
      );
      for (const view of earlier) {
        result = { ...result, snapshot: await liveEvidenceRecorder.retractEvidence(view.id, RETRACT_REASON, "sv") };
      }
    }
    revalidatePath("/app", "layout");
    return { ok: true, scored: true, total: result.snapshot.total, delta: result.snapshot.total - before };
  } catch (error) {
    if (error instanceof EvidenceInputError || error instanceof EmptyStateError || error instanceof NotImplementedError) {
      revalidatePath("/app/validering");
      return { ok: true, scored: false };
    }
    throw error;
  }
}
