import type { OutreachProvider } from "@/ports/OutreachProvider";

// Ingen skärm använder den här porten än — /app/kunder byggs i en senare session.
export const demoOutreachProvider: OutreachProvider = {
  async send() {},
  async getStatuses() {
    return {};
  },
};
