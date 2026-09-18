import type { MemoryRepository } from "@/ports/MemoryRepository";
import type { Locale } from "@/i18n/context";
import { saraProfile, saraBackground, saraResources, saraBeats } from "./sara";
import { useDemoStore } from "./demoStore";

/** Spåret (9.3): härleds ur Saras beats — en rad per moment som redan
 * hänt, inte hårdkodad separat historik. */
export const demoMemoryRepository: MemoryRepository = {
  async getProfileSummary(locale: Locale) {
    return {
      name: saraProfile.name,
      role: saraBackground[locale].role,
      bio: saraBackground[locale].bio,
      time: saraResources[locale].time,
      money: saraResources[locale].money,
      risk: saraResources[locale].risk,
    };
  },

  async getBrainNotes() {
    // Hjärnan är grundarens egna ord, skrivna på svenska i profilsamtalet —
    // översätts inte till engelska även när gränssnittet är på engelska.
    return saraBackground.sv.quote;
  },

  async setBrainNotes() {
    // Demot har ingen backend — riktig lagring landar med Supabase (P1).
  },

  async getTraceEvents(locale: Locale) {
    const { beatIndex } = useDemoStore.getState();
    // Bara "efter"-moment loggas (avsnitt 9.1: "nya poster i Spåret" hör till
    // efter, inte till före/körning) — annars skulle varje steg ge tre
    // rader i Spåret för samma händelse.
    return saraBeats
      .slice(0, beatIndex + 1)
      .filter((beat) => beat.momentKind === "after")
      .map((beat) => ({
        id: beat.id,
        timestampIso: beat.todayIso,
        description: beat.traceSummary?.[locale] ?? `${beat.momentLabel[locale]} — ${beat.nextStep[locale].title}`,
      }));
  },
};
