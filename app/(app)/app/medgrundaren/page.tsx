import { Cofounder, type CofounderData } from "@/screens/Cofounder";
import { sv } from "@/i18n/sv";
import { liveCofounderConversation } from "@/adapters/live/CofounderConversation";
import { loadCofounderContext } from "@/adapters/live/cofounderContext";
import { livePulseProvider } from "@/adapters/live/PulseProvider";
import { livePlanRepository } from "@/adapters/live/PlanRepository";
import { orNull } from "../_lib/orNull";
import { optional } from "../_lib/optional";
import { sendCofounderMessage } from "./actions";
import { toKnownItems } from "./knownItems";
import { isPlanItemId, isSignalId, toSignalDraft, toTaskDraft } from "./signalDraft";

/** Så många tidigare meddelanden visas när sidan öppnas. */
const SHOWN_MESSAGES = 40;

/**
 * Medgrundaren i /app, version 1 (docs/moduler/medgrundaren.md): ett riktigt
 * textsamtal med Gemini. Samtalet läses ur `cofounder_messages`, "Sedan
 * tidigare" ur Resan, Profilen och Minnet, samma läsning som prompten.
 * Är tabellen inte skapad än (migreringen inte körd) blir samtalet `null`:
 * då visas "Kommer snart" och promptfältet är avstängt, som förut. Inget
 * samtal hittas på och demots manus används aldrig här.
 *
 * Från en spelbok i Pulsen ("Gå igenom det här med Medgrundaren") kommer
 * `?signal=<id>`. Bara ett uuid tas emot, och signalen letas upp bland
 * grundarens egna signaler på servern. Hittas den förifylls frågan i fältet;
 * inget skickas och inget räknas mot taket förrän grundaren trycker Skicka.
 * Från Min plan ("Hjälp mig med det här") kommer `?task=<id>` på samma sätt:
 * uppgiften letas upp i grundarens egen plan. Kommer båda vinner signalen.
 * Allt annat i adressen ignoreras, och går signalerna eller planen inte att
 * läsa blir fältet bara tomt.
 */
export default async function LiveCofounderPage({
  searchParams,
}: {
  searchParams?: Promise<{ signal?: string | string[]; task?: string | string[] }>;
} = {}) {
  const params = await searchParams;
  const signalId = params?.signal;
  const taskId = isSignalId(signalId) ? undefined : params?.task;
  const [messages, context, signals, planItems] = await Promise.all([
    orNull(liveCofounderConversation.getRecentMessages(SHOWN_MESSAGES)),
    loadCofounderContext("sv"),
    isSignalId(signalId) ? optional(livePulseProvider.getSignals("sv"), "Medgrundaren: signalen") : Promise.resolve(null),
    isPlanItemId(taskId) ? optional(livePlanRepository.getItems(), "Medgrundaren: Min plan") : Promise.resolve(null),
  ]);

  const signal = signals?.find((item) => item.id === signalId);
  const task = planItems?.find((item) => item.id === taskId);
  const initialDraft = signal
    ? toSignalDraft(signal, context.project, "sv")
    : task
      ? toTaskDraft(task, context.project, "sv")
      : undefined;

  const step = context.step;
  const data: CofounderData = {
    moment: messages
      ? { label: step ? `${String(step.number).padStart(2, "0")} · ${step.title}` : sv.cofounderPage.title, items: [] }
      : null,
    context: toKnownItems(context, "sv"),
  };

  return (
    <Cofounder data={data} live={messages ? { messages, onSend: sendCofounderMessage, initialDraft } : undefined} />
  );
}
