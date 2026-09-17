import type { LegalAdvisor } from "@/ports/LegalAdvisor";

// Ingen skärm använder den här porten än — /app/juridik byggs i en senare session.
export const demoLegalAdvisor: LegalAdvisor = {
  async getLegalMap() {
    return [];
  },
};
