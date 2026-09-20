import type { MemoryRepository } from "@/ports/MemoryRepository";
import type { Locale } from "@/i18n/context";
import { saraProfile, saraBackground, saraResources } from "./sara";
import { jonasProfile, jonasBackground, jonasResources } from "./jonas";
import { useDemoStore } from "./demoStore";
import { engineFor } from "./journeyEngine";

/** Spåret (9.3/9.4): härleds ur den aktuella personans beats — en rad per
 * moment som redan hänt, inte hårdkodad separat historik. `engineFor`
 * (journeyEngine.ts) väljer Saras eller Jonas motor ur `entry`. */
export const demoMemoryRepository: MemoryRepository = {
  async getProfileSummary(locale: Locale) {
    const { entry } = useDemoStore.getState();
    const [profile, background, resources] =
      entry === "hasIdea" ? [jonasProfile, jonasBackground, jonasResources] : [saraProfile, saraBackground, saraResources];
    return {
      name: profile.name,
      role: background[locale].role,
      bio: background[locale].bio,
      time: resources[locale].time,
      money: resources[locale].money,
      risk: resources[locale].risk,
    };
  },

  async getBrainNotes() {
    // Hjärnan är grundarens egna ord, skrivna på svenska i profilsamtalet —
    // översätts inte till engelska även när gränssnittet är på engelska.
    const { entry } = useDemoStore.getState();
    return entry === "hasIdea" ? jonasBackground.sv.quote : saraBackground.sv.quote;
  },

  async setBrainNotes() {
    // Demot har ingen backend — riktig lagring landar med Supabase (P1).
  },

  async recordTraceEvent() {
    // Demot har ingen backend — Spåret härleds ur beats (getTraceEvents), så
    // det finns inget att spara till.
  },

  async getTraceEvents(locale: Locale) {
    const { beatIndex, entry } = useDemoStore.getState();
    const engine = engineFor(entry);
    // Bara "efter"-moment loggas (avsnitt 9.1: "nya poster i Spåret" hör till
    // efter, inte till före/körning) — annars skulle varje steg ge tre
    // rader i Spåret för samma händelse.
    return engine.beats
      .slice(0, beatIndex + 1)
      .filter((beat) => beat.momentKind === "after")
      .map((beat) => ({
        id: beat.id,
        timestampIso: beat.todayIso,
        description: beat.traceSummary?.[locale] ?? `${beat.momentLabel[locale]} — ${beat.nextStep[locale].title}`,
      }));
  },
};
