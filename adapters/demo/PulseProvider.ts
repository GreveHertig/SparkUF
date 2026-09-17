import type { PulseProvider } from "@/ports/PulseProvider";
import type { Locale } from "@/i18n/context";
import { saraPulseSignal } from "./sara";

export const demoPulseProvider: PulseProvider = {
  async getTodaysSignal(locale: Locale) {
    return saraPulseSignal[locale];
  },
};
