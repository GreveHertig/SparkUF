import { expect } from "vitest";
import type { CofounderAgent } from "./CofounderAgent";
import { demoCofounderAgent } from "@/adapters/demo/CofounderAgent";
import { liveCofounderAgent } from "@/adapters/live/CofounderAgent";
import { describeContract, contractIt } from "./testContract";

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
