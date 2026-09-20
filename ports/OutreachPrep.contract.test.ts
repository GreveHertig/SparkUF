import { afterAll, beforeAll, beforeEach, expect, vi } from "vitest";
import type { OutreachPrep } from "./OutreachPrep";
import { demoOutreachPrep } from "@/adapters/demo/OutreachPrep";
import { liveOutreachPrep } from "@/adapters/live/OutreachPrep";
import { describeContract, contractIt } from "./testContract";
import { resetRateLimit } from "@/lib/server/rateLimit";

// Liveadaptern körs mot mockade tjänster: CI behöver varken nätverk eller nycklar.
const USER = "00000000-0000-4000-8000-000000000001";
vi.mock("@/lib/server/session", () => ({ getCurrentUser: async () => ({ id: USER, email: null }) }));
vi.mock("@/lib/server/tavily", () => ({
  search: async () => [
    {
      title: "Kontakt",
      url: "https://www.ekbacka.se/kontakt",
      content: "Mejla oss på info@ekbacka.se",
    },
  ],
}));
vi.mock("@/lib/server/gemini", () => ({
  generateJson: async () => JSON.stringify({ candidates: [{ address: "info@ekbacka.se" }] }),
}));

const saved = { ...process.env };
beforeAll(() => {
  process.env.OUTREACH_LIVE_ENABLED = "true";
  process.env.OUTREACH_ALLOWED_USER_IDS = USER;
});
afterAll(() => {
  process.env = { ...saved };
});
beforeEach(resetRateLimit);

describeContract<OutreachPrep>(
  "OutreachPrep",
  { demo: demoOutreachPrep, live: liveOutreachPrep },
  (prep) => {
    contractIt("suggestEmail ger bara förslag (status suggested) med adress och källa", async () => {
      const result = await prep.suggestEmail("Ekbacka Redovisning AB");
      expect(result.suggestions.length).toBeGreaterThan(0);
      for (const s of result.suggestions) {
        expect(s.status).toBe("suggested");
        expect(s.address).toContain("@");
        expect(["role", "personal"]).toContain(s.kind);
        expect(s.källa.url).toMatch(/^https?:\/\//);
        expect(s.källa.hämtad).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      expect(result.rejectedCount).toBeGreaterThanOrEqual(0);
    });

    contractIt("suggestEmail på okänt bolag ger tom lista, inget fel", async () => {
      const result = await prep.suggestEmail("Finns Inte Alls Fiktiv Konsult");
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    contractIt("draftMessage ger utkast (status draft) på båda språken utan kvarvarande platshållare", async () => {
      const drafts = await prep.draftMessage({
        companyName: "Ekbacka Redovisning AB",
        problem: "tidsödande bokslut",
        senderName: "Sara",
        senderCompany: "Kvittly UF",
      });
      for (const locale of ["sv", "en"] as const) {
        expect(drafts[locale].status).toBe("draft");
        expect(drafts[locale].locale).toBe(locale);
        expect(drafts[locale].body).not.toMatch(/\{[a-zA-Z]+\}/);
        expect(drafts[locale].subject).not.toMatch(/\{[a-zA-Z]+\}/);
      }
    });

    contractIt("porten har ingen send-metod", async () => {
      expect("send" in prep).toBe(false);
    });
  },
);
