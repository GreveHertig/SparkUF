import { expect, vi } from "vitest";
import type { CofounderConversationRepository } from "./CofounderConversation";
import { createDemoCofounderConversation } from "@/adapters/demo/CofounderConversation";
import { liveCofounderConversation } from "@/adapters/live/CofounderConversation";
import { describeContract, contractIt } from "./testContract";
import { makeSupabaseFake, type FakeRpcHandlers } from "@/test/stubs/supabaseFake";

const USER = "contract-test-user";

// En fejk av public.reserve_cofounder_message (själva funktionen, låset och
// RLS prövas mot Postgres i supabase/migrations/cofounderMessages.pg.test.ts).
const rpc: FakeRpcHandlers = {
  reserve_cofounder_message: ({ p_text, p_limit, p_since }, store) => {
    const rows = (store.cofounder_messages ??= []);
    const sent = rows.filter(
      (row) => row.user_id === USER && row.role === "founder" && String(row.created_at) >= String(p_since),
    ).length;
    if (sent >= Number(p_limit)) return false;
    const seq = Math.max(0, ...rows.map((row) => Number(row.seq) || 0)) + 1;
    rows.push({ user_id: USER, role: "founder", text: p_text, created_at: new Date().toISOString(), seq });
    return true;
  },
};

// En fejkad klient per testfil (modulnivå), som i MemoryRepository-kontraktet:
// det som sparas i ett test syns i nästa. Varje test räknar därför relativt.
const fake = makeSupabaseFake({ cofounder_messages: [] }, rpc, { identity: { cofounder_messages: "seq" } });
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: async () => ({ supabase: fake, userId: USER }),
}));

const openCap = () => ({ limit: 1000, sinceIso: new Date(Date.now() - 60_000).toISOString() });

describeContract<CofounderConversationRepository>(
  "CofounderConversationRepository",
  { demo: createDemoCofounderConversation(), live: liveCofounderConversation },
  (conversation) => {
    contractIt("reserveFounderMessage och appendCofounderReply sparar frågan och svaret i ordning", async () => {
      expect(await conversation.reserveFounderMessage("Vad gör jag först?", openCap())).toBe(true);
      await conversation.appendCofounderReply("Ring tre kunder.");
      expect(await conversation.getRecentMessages(2)).toEqual([
        { role: "founder", text: "Vad gör jag först?" },
        { role: "cofounder", text: "Ring tre kunder." },
      ]);
    });

    contractIt("getRecentMessages ger högst limit meddelanden", async () => {
      await conversation.reserveFounderMessage("Ett", openCap());
      expect(await conversation.getRecentMessages(1)).toEqual([{ role: "founder", text: "Ett" }]);
      expect(await conversation.getRecentMessages(0)).toEqual([]);
    });

    contractIt("vid taket sparas inget och svaret är false", async () => {
      const since = new Date(Date.now() - 60_000).toISOString();
      const before = (await conversation.getRecentMessages(100)).length;
      expect(await conversation.reserveFounderMessage("Över taket", { limit: 0, sinceIso: since })).toBe(false);
      expect(await conversation.getRecentMessages(100)).toHaveLength(before);
    });

    contractIt("taket räknar bara meddelanden sedan tiden", async () => {
      const future = new Date(Date.now() + 60_000).toISOString();
      expect(await conversation.reserveFounderMessage("Ny dag", { limit: 1, sinceIso: future })).toBe(true);
    });
  },
);
