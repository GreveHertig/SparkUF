import { Legal, type LegalData } from "@/screens/Legal";
import type { Bolagsform, JuridisktKrav } from "@/core/domain";
import { LegalAdvisorError } from "@/core/errors";
import { orNull } from "../_lib/orNull";
import { getCachedLegalMap } from "./legalMapCache";

const BOLAGSFORMER: readonly Bolagsform[] = ["enskild_firma", "aktiebolag", "handelsbolag", "ekonomisk_forening"];

/**
 * Juridik i /app (PR 5, docs/plan-en-design.md). Ingen port ger användarens
 * bolagsform än, så användaren väljer den (`?bolagsform=…`) i stället för att
 * rutten hittar på en. Utan ett giltigt val anropas inte liveadaptern (och
 * därmed inte Gemini). Kartan cachas per bolagsform (./legalMapCache.ts).
 * Liveadapterns eget fel (`LegalAdvisorError`, t.ex. Gemini nere eller ingen
 * nyckel) loggas på servern och visas som ett felmeddelande i kartans ruta,
 * aldrig rakt av och aldrig som en helsideskrasch. Andra fel kastas vidare.
 * Inget låst läge än: det ska komma ur Resans steg, och Resans liveadapter är
 * en stubbe.
 */
export default async function LiveLegalPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const requested = (await searchParams).bolagsform;
  const bolagsform = BOLAGSFORMER.find((form) => form === requested) ?? null;

  const data: LegalData = bolagsform ? await loadLegalMap(bolagsform) : { krav: null };

  return <Legal data={data} locked={null} bolagsformPicker={{ current: bolagsform, basePath: "/app/juridik" }} />;
}

async function loadLegalMap(bolagsform: Bolagsform): Promise<LegalData> {
  let krav: JuridisktKrav[] | null;
  try {
    krav = await orNull(getCachedLegalMap(bolagsform));
  } catch (error) {
    if (!(error instanceof LegalAdvisorError)) throw error;
    console.error("Juridisk koll: kartan kunde inte hämtas.", error);
    return { krav: null, loadFailed: true };
  }
  return { krav };
}
