import type { EvidenceRepository } from "@/ports/EvidenceRepository";
import type { Locale } from "@/i18n/context";
import { saraScoreSnapshot } from "./sara";

export const demoEvidenceRepository: EvidenceRepository = {
  async getScoreSnapshot(locale: Locale) {
    return saraScoreSnapshot[locale];
  },
};
