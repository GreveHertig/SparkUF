import { Cofounder, type CofounderData } from "@/screens/Cofounder";
import { sv } from "@/i18n/sv";
import { liveCofounderConversation } from "@/adapters/live/CofounderConversation";
import { loadCofounderContext } from "@/adapters/live/cofounderContext";
import { orNull } from "../_lib/orNull";
import { sendCofounderMessage } from "./actions";
import { toKnownItems } from "./knownItems";

/** Så många tidigare meddelanden visas när sidan öppnas. */
const SHOWN_MESSAGES = 40;

/**
 * Medgrundaren i /app, version 1 (docs/moduler/medgrundaren.md): ett riktigt
 * textsamtal med Gemini. Samtalet läses ur `cofounder_messages`, "Sedan
 * tidigare" ur Resan, Profilen och Minnet, samma läsning som prompten.
 * Är tabellen inte skapad än (migreringen inte körd) blir samtalet `null`:
 * då visas "Kommer snart" och promptfältet är avstängt, som förut. Inget
 * samtal hittas på och demots manus används aldrig här.
 */
export default async function LiveCofounderPage() {
  const [messages, context] = await Promise.all([
    orNull(liveCofounderConversation.getRecentMessages(SHOWN_MESSAGES)),
    loadCofounderContext("sv"),
  ]);

  const step = context.step;
  const data: CofounderData = {
    moment: messages
      ? { label: step ? `${String(step.number).padStart(2, "0")} · ${step.title}` : sv.cofounderPage.title, items: [] }
      : null,
    context: toKnownItems(context, "sv"),
  };

  return <Cofounder data={data} live={messages ? { messages, onSend: sendCofounderMessage } : undefined} />;
}
