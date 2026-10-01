import { Build, type BuildData, type BuildLock } from "@/screens/Build";
import { liveBuildProvider } from "@/adapters/live/BuildProvider";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { orNull } from "../_lib/orNull";

/** Samma gräns som demot: specen kommer ur steg 08, så sidan öppnas när steg 07 är klart. */
const UNLOCKS_AFTER_STEP = 7;

/**
 * Bygg i /app (PR 10, docs/plan-en-design.md). Låst och olåst kommer ur
 * Resans steg; i låst läge görs inga andra anrop. Går stegen inte att läsa
 * (platshållarfel) visas inget låst läge, och sektionerna visar sina egna
 * luckor.
 *
 * Status och spec fångas var för sig (platshållare per sektion). Lovable är
 * ett koncept och liveadaptern en stubbe (docs/moduler/bygg.md), så båda
 * visar "Kommer snart". Svarar porten att ingen spec finns (`null`) visas
 * tomläget "Ingen spec än." i stället.
 */
export default async function LiveBuildPage() {
  const steps = await orNull(liveJourneyRepository.getSteps("sv"));
  const unlockStep = steps?.find((step) => step.stepNumber === UNLOCKS_AFTER_STEP);
  const locked: BuildLock = steps && unlockStep?.status !== "done" ? { unlocksAfterStep: UNLOCKS_AFTER_STEP } : null;

  const data: BuildData = { status: null, spec: null };
  if (!locked) {
    // `orNull` gör ett platshållarfel till null, så portens eget `null` (ingen
    // spec än) måste skiljas ut före fångsten.
    const [status, spec] = await Promise.all([
      orNull(liveBuildProvider.getStatus()),
      orNull(liveBuildProvider.getSpec("sv").then((found) => found ?? ("none" as const))),
    ]);
    data.status = status;
    data.spec = spec;
  }

  return <Build data={data} locked={locked} />;
}
