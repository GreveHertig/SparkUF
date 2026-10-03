import { ValidationLive, type ValidationLiveData, type ValidationLiveLock } from "@/screens/ValidationLive";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { liveValidationLog } from "@/adapters/live/ValidationLog";
import { liveVerdictProvider } from "@/adapters/live/VerdictProvider";
import { liveProjectRepository } from "@/adapters/live/ProjectRepository";
import { stockholmToday } from "@/adapters/live/evidenceScore";
import { orNull } from "../_lib/orNull";
import {
  addValidationContact,
  logValidationAnswer,
  markValidationContacted,
  markValidationDeclined,
  pasteValidationContacts,
  removeValidationContact,
} from "./actions";

/**
 * Sidan öppnas när grundaren har ett projekt (steg 02 klart). Tidigare låg
 * gränsen efter steg 03, eftersom demots kontaktlista byggs ur Registret i
 * steg 04. Här bygger grundaren listan själv, och att prata med kunder tidigt
 * skadar aldrig. Registret är dessutom grindat, så steg 03 går inte att nå i
 * live. Beslut i docs/beslut.md 2026-10-04.
 */
const UNLOCKS_AFTER_STEP = 2;

/**
 * Valideringen i /app (docs/moduler/validering.md): samtalsloggen. Grundaren
 * pratar själv med kunderna och loggar svaren; Spark skickar ingenting
 * (sändspärren i docs/moduler/utskick-och-svar.md gäller orörd). Domen räknas
 * ur de loggade svaren av samma kod som demot (core/verdict.ts).
 *
 * Saknas tabellen (migreringen inte körd) eller ett aktivt projekt blir
 * loggen `null` och sidan visar "Kommer snart". Ett äkta fel kastas vidare.
 * Demot (/demo/validering) använder fortfarande `screens/Validation.tsx` med
 * Saras manusstyrda utskick.
 */
export default async function LiveValidationPage() {
  const steps = await orNull(liveJourneyRepository.getSteps("sv"));
  const stepStatus = (stepNumber: number) => steps?.find((step) => step.stepNumber === stepNumber)?.status;

  // Okända steg (platshållarfel) ger inget låst läge; loggen visar då sin egen lucka.
  const locked: ValidationLiveLock =
    steps && stepStatus(UNLOCKS_AFTER_STEP) !== "done" ? { unlocksAfterStep: UNLOCKS_AFTER_STEP } : null;

  const [contacts, verdict, project] = locked
    ? [null, null, null]
    : await Promise.all([
        orNull(liveValidationLog.getContacts()),
        orNull(liveVerdictProvider.getVerdictReport("sv")),
        orNull(liveProjectRepository.getProject()),
      ]);

  const data: ValidationLiveData = {
    contacts,
    verdict,
    projectName: project?.name ?? null,
    todayIso: stockholmToday(),
  };

  return (
    <ValidationLive
      data={data}
      locked={locked}
      actions={{
        addContact: addValidationContact,
        pasteContacts: pasteValidationContacts,
        markContacted: markValidationContacted,
        markDeclined: markValidationDeclined,
        removeContact: removeValidationContact,
        logAnswer: logValidationAnswer,
      }}
    />
  );
}
