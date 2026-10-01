"use server";

import { liveMemoryRepository } from "@/adapters/live/MemoryRepository";

/**
 * Sparar Hjärnan för den inloggade användaren (/app/minnet). Användaren tas
 * ur sessionen i adaptern (`requireSupabaseUser`), aldrig ur indata, och RLS
 * på `brain_notes` är den bindande spärren. Längdgränsen ligger i adaptern och
 * i databasen. Texten är data, aldrig instruktion (CLAUDE.md, Säkerhet).
 */
export async function saveBrainNotes(notes: unknown): Promise<void> {
  if (typeof notes !== "string") {
    throw new Error("Minnet: Hjärnan måste vara text.");
  }
  await liveMemoryRepository.setBrainNotes(notes);
}
