import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { liveLegalAdvisor } from "@/adapters/live/LegalAdvisor";
import { KURERADE_KÄLLOR, LEGAL_TOPICS } from "@/adapters/live/legalSources";
import type { Bolagsform, JuridisktKrav } from "@/core/domain";

/**
 * Hur länge en juridisk karta återanvänds: 7 dygn. Fakta i kartan (myndighet,
 * källa, datum) kommer ur den kuraterade koden, aldrig ur modellen; Gemini
 * skriver bara rubrik och beskrivning. Det som kan ändras är alltså koden, och
 * den ändrar nyckeln nedan. Svaret beror inte på användaren, bara på
 * bolagsformen, så cachen delas mellan alla inloggade (fyra poster totalt).
 */
export const LEGAL_MAP_REVALIDATE_SECONDS = 7 * 24 * 60 * 60;

// Ändras källorna eller ämnena i koden blir den gamla cachen oanvänd direkt,
// även om `unstable_cache` annars överlever en ny driftsättning.
export const LEGAL_SOURCES_FINGERPRINT = createHash("sha256")
  .update(JSON.stringify({ KURERADE_KÄLLOR, LEGAL_TOPICS }))
  .digest("hex")
  .slice(0, 16);

/**
 * `liveLegalAdvisor.getLegalMap` med cache, ett Gemini-anrop per bolagsform och
 * vecka i stället för ett per sidladdning. Ett fel (platshållare eller
 * `LegalAdvisorError`) cachas inte; nästa sidladdning försöker igen.
 */
export const getCachedLegalMap: (bolagsform: Bolagsform) => Promise<JuridisktKrav[]> = unstable_cache(
  (bolagsform: Bolagsform) => liveLegalAdvisor.getLegalMap(bolagsform),
  ["legal-map", LEGAL_SOURCES_FINGERPRINT],
  { revalidate: LEGAL_MAP_REVALIDATE_SECONDS, tags: ["legal-map"] },
);
