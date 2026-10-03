import { expect, vi } from "vitest";
import type { MemoryRepository } from "./MemoryRepository";
import { demoMemoryRepository } from "@/adapters/demo/MemoryRepository";
import { liveMemoryRepository } from "@/adapters/live/MemoryRepository";
import { describeContract, contractIt } from "./testContract";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

// Alla fyra metoder är klara (docs/moduler/minnet.md) — kontraktet prövas
// nu mot liveadaptern också. Fixturen ger en profilrad med klar onboarding
// från ingång B (bara role, time och money besvarade), annars kastar
// getProfileSummary EmptyStateError och testet failar (contractIt skippar
// bara NotImplementedError, se testContract.ts). Samma fejkade
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
          bio: null,
          time_available: "Några timmar i veckan",
          money_available: "10 000 kr",
          risk_appetite: null,
          onboarding_entry: "hasIdea",
          onboarding_completed_at: "2026-10-01T08:00:00Z",
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
    contractIt("getProfileSummary ger ingången och varje fält som text eller null, aldrig tom text", async () => {
      const summary = await memory.getProfileSummary("sv");
      expect(["noIdea", "hasIdea"]).toContain(summary.entry);
      for (const field of [summary.name, summary.role, summary.bio, summary.time, summary.money, summary.risk]) {
        if (field !== null) expect(field.trim()).not.toBe("");
      }
      // Frågorna som båda ingångarna ställer är besvarade efter onboardingen.
      expect(summary.role).toBeTruthy();
      expect(summary.time).toBeTruthy();
      expect(summary.money).toBeTruthy();
      // v4-svaren (bara plattformen): fråga och svar som text, aldrig tomma.
      for (const answer of summary.answers ?? []) {
        expect(answer.question.trim()).not.toBe("");
        expect(answer.answer.trim()).not.toBe("");
      }
    });

    contractIt("getPendingOnboardingQuestions (valfri) ger frågor med text och unika id:n", async () => {
      if (!memory.getPendingOnboardingQuestions) return;
      const pending = await memory.getPendingOnboardingQuestions("sv");
      expect(new Set(pending.map((q) => q.id)).size).toBe(pending.length);
      for (const question of pending) expect(question.cofounderText).toBeTruthy();
    });

    contractIt("getBrainNotes returnerar en sträng (kan vara tom)", async () => {
      const notes = await memory.getBrainNotes();
      expect(typeof notes).toBe("string");
    });

    contractIt("setBrainNotes tar emot fritext utan att kasta", async () => {
      await memory.setBrainNotes("En testanteckning.");
    });

    contractIt("recordTraceEvent tar emot en giltig post utan att kasta", async () => {
      await memory.recordTraceEvent({ module: "Domen", description: "Testhändelse.", occurredAtIso: "2026-01-20" });
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
