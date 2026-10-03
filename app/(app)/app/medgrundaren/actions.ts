"use server";

import { liveCofounderAgent } from "@/adapters/live/CofounderAgent";
import { liveCofounderConversation } from "@/adapters/live/CofounderConversation";
import { CofounderAgentError, CofounderDailyLimitError, CofounderInputError } from "@/core/errors";
import { charLength, COFOUNDER_HISTORY_LIMIT, COFOUNDER_INPUT_MAX } from "@/core/cofounder";
import type { SendCofounderMessageResult } from "@/screens/blocks/CofounderChat";

/**
 * Skickar grundarens meddelande till Medgrundaren och sparar svaret
 * (/app/medgrundaren, docs/moduler/medgrundaren.md). Bara texten tas emot.
 * Historiken läses ur databasen innan meddelandet sparas, aldrig från
 * klienten, och användaren tas ur sessionen i adaptrarna. Kostnadstaket och
 * sparandet av grundarens meddelande ligger i liveadaptern. Texten är data,
 * aldrig instruktion (CLAUDE.md, Säkerhet).
 *
 * Kända fel blir en orsak som skärmen visar som text ur i18n. Ett okänt fel
 * (till exempel en saknad session) kastas vidare, som i resten av kodbasen.
 */
export async function sendCofounderMessage(text: unknown): Promise<SendCofounderMessageResult> {
  if (typeof text !== "string") return { ok: false, reason: "invalid" };
  const message = text.trim();
  if (!message || charLength(message) > COFOUNDER_INPUT_MAX) return { ok: false, reason: "invalid" };

  try {
    const history = await liveCofounderConversation.getRecentMessages(COFOUNDER_HISTORY_LIMIT);
    const reply = await liveCofounderAgent.sendMessage(message, history, "sv");
    await liveCofounderConversation.appendCofounderReply(reply.text, reply.nextTask);
    return { ok: true, reply };
  } catch (error) {
    if (error instanceof CofounderInputError) return { ok: false, reason: "invalid" };
    if (error instanceof CofounderDailyLimitError) return { ok: false, reason: "dailyLimit" };
    if (error instanceof CofounderAgentError) {
      console.error("Medgrundaren: modellen svarade inte", error.cause);
      return { ok: false, reason: "failed" };
    }
    throw error;
  }
}
