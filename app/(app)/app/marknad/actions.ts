"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { liveRegistryProvider } from "@/adapters/live/RegistryProvider";
import { recordMarketEvidence } from "@/adapters/live/EvidenceRecorder";
import { liveJourneyProgress } from "@/adapters/live/JourneyProgress";

const SNI_PATTERN = /^\d{2}\.\d{3}$/;
const BASE_PATH = "/app/marknad";
/** Stegen som registerbevisen kan klara, i resans ordning. */
const REGISTER_STEPS = [3, 4] as const;

/**
 * "Det här är min bransch" (steg 03, docs/bevislagring.md 5.1). Tar bara emot
 * SNI-koden. Marknadsbilden hämtas på nytt här på servern, med licensgrinden,
 * så att ingen siffra från webbläsaren kan bli ett bevis. Antalet sparas som
 * ett systembevis, och sedan markeras steg 03 (och 04, om konkurrenterna
 * finns) som klart om det är grundarens aktuella steg och kraven håller.
 * Databasen prövar kraven igen (public.complete_journey_step).
 *
 * Resultatet visas efter en omdirigering (`?sparad=`), så att valet fungerar
 * utan JavaScript och en omladdning inte sparar igen.
 */
export async function chooseIndustry(formData: FormData): Promise<void> {
  const raw = formData.get("sni");
  const sni = typeof raw === "string" && SNI_PATTERN.test(raw.trim()) ? raw.trim() : null;
  if (!sni) redirect(BASE_PATH);

  let outcome: string;
  try {
    const overview = await liveRegistryProvider.getMarketOverview("sv", sni);
    const result = await recordMarketEvidence(sni, overview, "sv");
    outcome = result.status === "noData" ? "fel" : "1";

    if (result.status !== "noData") {
      for (const stepNumber of REGISTER_STEPS) {
        const completion = await liveJourneyProgress.getStepCompletion(stepNumber, "sv");
        // Ett redan klart steg hoppas över; annars stannar vi vid första steget som inte går att klara.
        if (completion.status === "done") continue;
        if (completion.status !== "completable") break;
        await liveJourneyProgress.completeStep(stepNumber, "sv");
        outcome = `steg${stepNumber}`;
      }
    }
    revalidatePath("/app", "layout");
  } catch (error) {
    unstable_rethrow(error);
    // Bara namn och meddelande (våra egna texter), aldrig `cause`, som kan bära registrets svar.
    console.error(`Marknad: branschen kunde inte sparas (${error instanceof Error ? `${error.name}: ${error.message}` : "okänt fel"}).`);
    outcome = "fel";
  }
  redirect(`${BASE_PATH}?sni=${encodeURIComponent(sni)}&sparad=${outcome}`);
}
