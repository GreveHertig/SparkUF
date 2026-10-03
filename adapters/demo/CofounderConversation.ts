import type { CofounderMessage } from "@/ports/CofounderAgent";
import type { CofounderConversationRepository } from "@/ports/CofounderConversation";

/**
 * Demots samtal ligger i minnet och används inte av någon demosida: demots
 * Medgrundare är förskriven (adapters/demo/cofounderScript.ts). Finns för att
 * varje port ska ha en demoadapter och för kontraktstestet.
 */
export function createDemoCofounderConversation(): CofounderConversationRepository {
  const messages: (CofounderMessage & { at: string })[] = [];
  return {
    async getRecentMessages(limit) {
      const n = Math.max(0, Math.floor(limit));
      return messages.slice(messages.length - Math.min(n, messages.length)).map(({ role, text }) => ({ role, text }));
    },
    async reserveFounderMessage(text, { limit, sinceIso }) {
      const sent = messages.filter((message) => message.role === "founder" && message.at >= sinceIso).length;
      if (sent >= limit) return false;
      messages.push({ role: "founder", text, at: new Date().toISOString() });
      return true;
    },
    async appendCofounderReply(text) {
      messages.push({ role: "cofounder", text, at: new Date().toISOString() });
    },
  };
}

export const demoCofounderConversation = createDemoCofounderConversation();
