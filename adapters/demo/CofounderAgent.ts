import type { CofounderAgent } from "@/ports/CofounderAgent";

// Ingen skärm använder den här porten än — /app/medgrundaren byggs i en senare session.
export const demoCofounderAgent: CofounderAgent = {
  async sendMessage(message) {
    return { role: "cofounder", text: `(Demo) Chatten är inte kopplad än: "${message}"` };
  },
};
