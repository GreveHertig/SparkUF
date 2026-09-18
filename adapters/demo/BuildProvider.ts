import type { Locale } from "@/i18n/context";
import type { BuildProvider, BuildStatus } from "@/ports/BuildProvider";
import type { ByggBrief } from "@/core/domain";
import { getCurrentStepNumberFor } from "./sara";
import { useDemoStore } from "./demoStore";

// Bygg via Lovable (koncept, avsnitt 2.3) — 9.3 steg 08 (omfånget) och 10
// (publicering). Ingen skärm anropar `startBuild` i demot — statusen följer
// i stället demomotorns läge, precis som övriga demoadaptrar.
const spec: Record<Locale, ByggBrief> = {
  sv: {
    sammanfattning:
      "Kvittojakten: automatisk insamling av kvittounderlag från redovisningsbyråers småföretagskunder via sms-länk.",
    målgrupp: "Redovisningsbyråer med 10–20 anställda i Sverige.",
    sidor: ["Startsida", "Kvittoförfrågan (sms-länk)", "Statusöversikt per kund", "Export"],
    ton: "Sakligt, svenskt, förtroendeingivande — samma ton som Saras egen byrå skulle använda.",
    underlag: [
      { påstående: "Bygg bara det de som svarade faktiskt bad om.", källa: { namn: "Kundsamtal, steg 05–06", hämtad: "2026-01-23" } },
      { påstående: "Ingen bad om OCR eller en egen app.", källa: { namn: "Kundsamtal, steg 05–06", hämtad: "2026-01-23" } },
    ],
  },
  en: {
    sammanfattning:
      "Kvittojakten: automatic collection of receipts from accounting firms' small-business clients via an SMS link.",
    målgrupp: "Swedish accounting firms with 10–20 employees.",
    sidor: ["Landing page", "Receipt request (SMS link)", "Per-customer status overview", "Export"],
    ton: "Matter-of-fact, Swedish, trustworthy — the same tone Sara's own firm would use.",
    underlag: [
      { påstående: "Build only what the respondents actually asked for.", källa: { namn: "Customer calls, steps 05–06", hämtad: "2026-01-23" } },
      { påstående: "Nobody asked for OCR or a dedicated app.", källa: { namn: "Customer calls, steps 05–06", hämtad: "2026-01-23" } },
    ],
  },
};

const PUBLISHED_URL = "https://kvittojakten.lovable.app";

function statusFor(currentStep: number): BuildStatus {
  if (currentStep < 8) return "not_started";
  if (currentStep < 10) return "building";
  return "published";
}

export const demoBuildProvider: BuildProvider = {
  async startBuild() {
    return { status: "building" };
  },

  async getStatus() {
    const currentStep = getCurrentStepNumberFor(useDemoStore.getState().beatIndex);
    const status = statusFor(currentStep);
    return { status, url: status === "published" ? PUBLISHED_URL : undefined };
  },

  async getSpec(locale: Locale) {
    const currentStep = getCurrentStepNumberFor(useDemoStore.getState().beatIndex);
    if (currentStep < 8) return null;
    return spec[locale];
  },
};
