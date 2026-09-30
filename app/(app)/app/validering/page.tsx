import { Validation, type ValidationData, type ValidationLock, type ValidationVerdict } from "@/screens/Validation";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { liveOutreachProvider } from "@/adapters/live/OutreachProvider";
import { orNull } from "../_lib/orNull";

/** Samma gräns som demot: kontaktlistan byggs i steg 04, så sidan öppnas när steg 03 är klart. */
const UNLOCKS_AFTER_STEP = 3;
const VERDICT_STEP = 6;

/**
 * Valideringen i /app (PR 7, docs/plan-en-design.md). Låst och olåst kommer ur
 * Resans steg. Varje sektion fångas för sig (platshållare per sektion):
 *
 * - Kontaktlistan: `liveOutreachProvider.getCampaign` kastar
 *   `OutreachSendDisabledError` (sändspärren) och ger "Kommer snart" i
 *   nyckeltalen och i listan.
 * - Antagandena och svaren har ingen portmetod än (de finns bara som
 *   demohjälpare i `adapters/demo/OutreachProvider.ts`), så de är alltid `null`.
 * - Domen: Resans liveadapter ger ingen dom än, så sektionen visar "Kommer
 *   snart" från steg 06. Före steg 06 visas den inte, som i demot.
 * - Simuleringen: Hiasynth är ett koncept och liveadaptern en stubbe. Frågan i
 *   demot är skriven för Saras scenario, och ingen fråga hittas på här.
 *
 * Registret används inte: Valideringen har inga registersiffror, så
 * licensgrinden (docs/moduler/registret.md) har inget att släppa igenom här.
 */
export default async function LiveValidationPage() {
  const steps = await orNull(liveJourneyRepository.getSteps("sv"));
  const stepStatus = (stepNumber: number) => steps?.find((step) => step.stepNumber === stepNumber)?.status;

  // Okända steg (platshållarfel) ger inget låst läge; sektionerna visar då sina egna luckor.
  const locked: ValidationLock =
    steps && stepStatus(UNLOCKS_AFTER_STEP) !== "done" ? { unlocksAfterStep: UNLOCKS_AFTER_STEP } : null;

  const verdictReached = steps !== null && stepStatus(VERDICT_STEP) !== "locked";
  const [rows, stepDetail] = locked
    ? [null, null]
    : await Promise.all([
        orNull(liveOutreachProvider.getCampaign("sv")),
        verdictReached ? orNull(liveJourneyRepository.getStepDetail(VERDICT_STEP, "sv")) : null,
      ]);

  let verdict: ValidationVerdict | null | "notReached" = "notReached";
  if (verdictReached) {
    const found = stepDetail?.verdict;
    const score = stepDetail?.scoreDelta?.total;
    verdict = found && score !== undefined ? { score, headline: found.headline, reasoning: found.reasoning } : null;
  }

  const data: ValidationData = {
    rows,
    outreachSource: null,
    dateRange: null,
    openRate: null,
    openRateSource: null,
    assumptions: null,
    responses: null,
    verdict,
    simulation: null,
  };

  return <Validation data={data} dataKind="live" locked={locked} />;
}
