import { expect, vi } from "vitest";
import type { MemoryRepository } from "./MemoryRepository";
import { demoMemoryRepository } from "@/adapters/demo/MemoryRepository";
import { liveMemoryRepository } from "@/adapters/live/MemoryRepository";
import { describeContract, contractIt } from "./testContract";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

// Alla fyra metoder är klara (docs/moduler/minnet.md) — kontraktet prövas
// nu mot liveadaptern också. Fixturen ger en komplett profilrad, annars
// kastar getProfileSummary EmptyStateError och testet failar (contractIt
// skippar bara NotImplementedError, se testContract.ts). Samma fejkade
// klient delas av alla contractIt-anrop i den här filen (en modul-nivå
// mock), så setBrainNotes-testet skriver till samma underlag som
// getBrainNotes sedan läser — det är avsiktligt, se
// docs/moduler/minnet.md: "demoadaptern kan inte uppfylla" skriv-läs-kravet,
// men liveadaptern ska.
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: async () => ({
    supabase: makeSupabaseFake({
      profiles: [
        {
          user_id: "contract-test-user",
          name: "Testanvändare",
          role: "Testroll",
          bio: "En testbiografi.",
          time_available: "Några timmar i veckan",
          money_available: "10 000 kr",
          risk_appetite: "Medel",
        },
      ],
    }),
    userId: "contract-test-user",
  }),
}));

describeContract<MemoryRepository>(
  "MemoryRepository",
  { demo: demoMemoryRepository, live: liveMemoryRepository },
  (memory) => {
    contractIt("getProfileSummary har alla fält ifyllda", async () => {
      const summary = await memory.getProfileSummary("sv");
      expect(summary.name).toBeTruthy();
      expect(summary.role).toBeTruthy();
      expect(summary.bio).toBeTruthy();
      expect(summary.time).toBeTruthy();
      expect(summary.money).toBeTruthy();
      expect(summary.risk).toBeTruthy();
    });

    contractIt("getBrainNotes returnerar en sträng (kan vara tom)", async () => {
      const notes = await memory.getBrainNotes();
      expect(typeof notes).toBe("string");
    });

    contractIt("setBrainNotes tar emot fritext utan att kasta", async () => {
      await memory.setBrainNotes("En testanteckning.");
    });

    contractIt("getTraceEvents ger kronologiska händelser med beskrivning", async () => {
      const events = await memory.getTraceEvents("sv");
      expect(Array.isArray(events)).toBe(true);
      for (const event of events) {
        expect(event.id).toBeTruthy();
        expect(event.timestampIso).toBeTruthy();
        expect(event.description).toBeTruthy();
      }
    });
  },
);
