import { Legal, type LegalData } from "@/screens/Legal";
import { liveLegalAdvisor } from "@/adapters/live/LegalAdvisor";
import type { Bolagsform } from "@/core/domain";
import { orNull } from "../_lib/orNull";

const BOLAGSFORMER: readonly Bolagsform[] = ["enskild_firma", "aktiebolag", "handelsbolag", "ekonomisk_forening"];

/**
 * Juridik i /app (PR 5, docs/plan-en-design.md). Ingen port ger användarens
 * bolagsform än, så användaren väljer den (`?bolagsform=…`) i stället för att
 * rutten hittar på en. Utan ett giltigt val anropas inte liveadaptern (och
 * därmed inte Gemini). Liveadapterns eget fel (`LegalAdvisorError`) är ett
 * äkta fel och kastas vidare. Inget låst läge än: det ska komma ur Resans
 * steg, och Resans liveadapter är en stubbe.
 */
export default async function LiveLegalPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const requested = (await searchParams).bolagsform;
  const bolagsform = BOLAGSFORMER.find((form) => form === requested) ?? null;

  const krav = bolagsform ? await orNull(liveLegalAdvisor.getLegalMap(bolagsform)) : null;
  const data: LegalData = { krav };

  return <Legal data={data} locked={null} bolagsformPicker={{ current: bolagsform, basePath: "/app/juridik" }} />;
}
