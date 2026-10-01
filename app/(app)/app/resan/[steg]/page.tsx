import { notFound } from "next/navigation";
import { JourneyStep } from "@/screens/JourneyStep";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { JOURNEY_STEP_META } from "@/core/journey";
import { orNull } from "../../_lib/orNull";

/** Steget där domen fälls, samma som i /app/validering. */
const VERDICT_STEP = 6;

/**
 * Ett steg i /app (PR 9, docs/plan-en-design.md). Steget vitlistas mot Resans
 * tolv steg innan adaptern anropas; allt annat ger 404. Låst och olåst kommer
 * ur adapterns egen status.
 *
 * Liveadaptern ger ännu ingen dom, poängändring eller upplåsta delar (se
 * docs/moduler/resan.md). De sektionerna döljs som i demot, utom domen i steg
 * 06: där ska den finnas, så dess ruta visar "Kommer snart" (samma som
 * /app/validering). Ett platshållarfel ger "Kommer snart" i stegets innehåll.
 */
export default async function LiveJourneyStepPage({ params }: { params: Promise<{ steg: string }> }) {
  const { steg } = await params;
  const meta = /^\d{1,2}$/.test(steg) ? JOURNEY_STEP_META.find((step) => step.stepNumber === Number(steg)) : undefined;
  if (!meta) notFound();

  const data = await orNull(liveJourneyRepository.getStepDetail(meta.stepNumber, "sv"));
  // Adaptern svarar null bara för ett okänt steg, och det är redan vitlistat bort.
  const verdictMissing =
    meta.stepNumber === VERDICT_STEP && data !== null && data.status !== "locked" && !(data.verdict && data.scoreDelta);

  return (
    <JourneyStep data={data} stepNumber={meta.stepNumber} journeyHref="/app/resan" verdictMissing={verdictMissing} />
  );
}
