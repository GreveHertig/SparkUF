import type { MemoryRepository } from "@/ports/MemoryRepository";

// Ingen skärm använder den här porten än — /app/minnet byggs i en senare session.
export const demoMemoryRepository: MemoryRepository = {
  async getBrainNotes() {
    return "Varje månadsskifte jagar vi kvitton från kunderna via mejl och sms. Det äter två dagar.";
  },
  async setBrainNotes() {
    // Demot har ingen backend — riktig lagring landar med demomotorn i Session 2.
  },
  async getTraceEvents() {
    return [];
  },
};
