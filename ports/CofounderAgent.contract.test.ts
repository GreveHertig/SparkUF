import { expect, vi } from "vitest";
import type { CofounderAgent } from "./CofounderAgent";
import { demoCofounderAgent } from "@/adapters/demo/CofounderAgent";
import { liveCofounderAgent } from "@/adapters/live/CofounderAgent";
import { describeContract, contractIt } from "./testContract";
import { describe, it } from "vitest";

// Liveadaptern prövas med mockad modell och mockade portar, så att CI inte
// behöver nätverk, nyckel eller databas (docs/bygga-en-modul.md §7). Demon
// använder inget av detta.
vi.mock("@/lib/server/gemini", () => ({
  generateText: async () =>
    JSON.stringify({
      svar: "Du vet inte än om någon vill ha det här.",
      nastaUppgift: "Ring tre tänkbara kunder i veckan och fråga vad som krånglar mest.",
    }),
  GeminiResponseError: class GeminiResponseError extends Error {},
}));
vi.mock("@/adapters/live/CofounderConversation", () => ({
  liveCofounderConversation: { reserveFounderMessage: async () => true },
}));
vi.mock("@/adapters/live/cofounderContext", () => ({
  loadCofounderContext: async () => ({ step: null, profile: null, brainNotes: null, trace: null, project: null }),
}));

describeContract<CofounderAgent>(
  "CofounderAgent",
  { demo: demoCofounderAgent, live: liveCofounderAgent },
  (cofounder) => {
    contractIt("sendMessage svarar alltid som medgrundaren med icke-tom text", async () => {
      const reply = await cofounder.sendMessage("Hej!", [], "sv");
      expect(reply.role).toBe("cofounder");
      expect(reply.text).toBeTruthy();
    });

    contractIt("sendMessage fungerar med tidigare historik", async () => {
      const reply = await cofounder.sendMessage("Och sen då?", [{ role: "founder", text: "Hej!" }], "sv");
      expect(reply.role).toBe("cofounder");
      expect(reply.text).toBeTruthy();
    });
  },
);

// Spec v4 §3.1: varje svar från liveadaptern slutar med en konkret uppgift.
// `nextTask` är valfri i porten, så kravet gäller bara liveadaptern. Demon
// prövas inte här (beslut Erik 2026-10-03, docs/beslut.md).
describe("CofounderAgent-kontrakt: bara live", () => {
  it("sendMessage ger alltid en uppgift som inte är tom och inte är en fråga", async () => {
    for (const history of [[], [{ role: "founder" as const, text: "Hej!" }]]) {
      const reply = await liveCofounderAgent.sendMessage("Vad gör jag nu?", history, "sv");
      expect(reply.role).toBe("cofounder");
      expect(reply.nextTask?.trim()).toBeTruthy();
      expect(reply.nextTask).not.toMatch(/\?$/);
      expect(reply.nextTask).not.toBe(reply.text);
    }
  });
});
