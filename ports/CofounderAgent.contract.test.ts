import { expect, vi } from "vitest";
import type { CofounderAgent } from "./CofounderAgent";
import { demoCofounderAgent } from "@/adapters/demo/CofounderAgent";
import { liveCofounderAgent } from "@/adapters/live/CofounderAgent";
import { describeContract, contractIt } from "./testContract";

// Liveadaptern prövas med mockad modell och mockade portar, så att CI inte
// behöver nätverk, nyckel eller databas (docs/bygga-en-modul.md §7). Demon
// använder inget av detta.
vi.mock("@/lib/server/gemini", () => ({
  generateText: async () => "Ring tre tänkbara kunder i veckan och fråga vad som krånglar mest.",
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
