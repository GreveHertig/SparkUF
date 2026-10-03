import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotImplementedError } from "@/core/errors";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

const requireSupabaseUserMock = vi.fn();
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: () => requireSupabaseUserMock(),
}));

const USER = "user-1";
const OTHER = "user-2";

function row(userId: string, role: string, text: string, seq: number) {
  return { id: `${userId}-${seq}`, user_id: userId, role, text, seq, created_at: "2026-10-03T08:00:00Z" };
}

/** En klient vars alla frågor och rpc-anrop svarar med samma fel. */
function failingClient(error: { code?: string; message: string }) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order", "limit", "insert"]) chain[method] = () => chain;
  chain.then = (resolve: (value: unknown) => unknown) => resolve({ data: null, error });
  return { from: () => chain, rpc: async () => ({ data: null, error }) };
}

async function load() {
  return (await import("@/adapters/live/CofounderConversation")).liveCofounderConversation;
}

const CAP = { limit: 40, sinceIso: "2026-10-02T22:00:00.000Z" };

beforeEach(() => {
  requireSupabaseUserMock.mockReset();
});

describe("liveCofounderConversation", () => {
  it("getRecentMessages ger de senaste i databasens ordning (seq), äldst först, och bara egna", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({
        cofounder_messages: [
          row(USER, "founder", "Ett", 1),
          row(USER, "cofounder", "Två", 2),
          row(OTHER, "founder", "Någon annans", 3),
          row(USER, "founder", "Tre", 4),
        ],
      }),
      userId: USER,
    });
    expect(await (await load()).getRecentMessages(2)).toEqual([
      { role: "cofounder", text: "Två" },
      { role: "founder", text: "Tre" },
    ]);
  });

  it("getRecentMessages läser aldrig fler än 100", async () => {
    const rows = Array.from({ length: 120 }, (_, i) => row(USER, "founder", `M${i}`, i + 1));
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({ cofounder_messages: rows }), userId: USER });
    expect(await (await load()).getRecentMessages(1000)).toHaveLength(100);
  });

  it("reserveFounderMessage anropar databasfunktionen med rensad text och taket, och svarar dess svar", async () => {
    const handler = vi.fn().mockReturnValue(true);
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({}, { reserve_cofounder_message: handler }),
      userId: USER,
    });
    expect(await (await load()).reserveFounderMessage("  Hej​ där  ", CAP)).toBe(true);
    expect(handler.mock.calls[0][0]).toEqual({ p_text: "Hej där", p_limit: 40, p_since: CAP.sinceIso });
  });

  it("reserveFounderMessage svarar false när funktionen nekar", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({}, { reserve_cofounder_message: () => false }),
      userId: USER,
    });
    expect(await (await load()).reserveFounderMessage("Hej", CAP)).toBe(false);
  });

  it.each([
    [{ limit: 40, sinceIso: "inte en tid" }],
    [{ limit: -1, sinceIso: CAP.sinceIso }],
    [{ limit: 1.5, sinceIso: CAP.sinceIso }],
  ])("reserveFounderMessage nekar ett ogiltigt tak", async (cap) => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER });
    await expect((await load()).reserveFounderMessage("Hej", cap)).rejects.toThrow(/ogiltigt tak/);
  });

  it("reserveFounderMessage sparar inget tomt meddelande", async () => {
    const handler = vi.fn();
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({}, { reserve_cofounder_message: handler }),
      userId: USER,
    });
    await expect((await load()).reserveFounderMessage("  ​ ", CAP)).rejects.toThrow(/tomt/);
    expect(handler).not.toHaveBeenCalled();
  });

  it("appendCofounderReply sparar svaret med användaren ur sessionen och behåller radbrytningar", async () => {
    const fake = makeSupabaseFake({ cofounder_messages: [] });
    requireSupabaseUserMock.mockResolvedValue({ supabase: fake, userId: USER });
    await (await load()).appendCofounderReply("Ring\r\nen kund.");
    expect(fake.tables.cofounder_messages.map((r) => [r.user_id, r.role, r.text])).toEqual([
      [USER, "cofounder", "Ring\nen kund."],
    ]);
  });

  it.each([
    ["PGRST205", "Could not find the table"],
    ["42P01", "relation does not exist"],
    ["PGRST202", "Could not find the function"],
    ["42883", "function does not exist"],
  ])("en saknad tabell eller funktion (%s) ger NotImplementedError", async (code, message) => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: failingClient({ code, message }), userId: USER });
    const conversation = await load();
    await expect(conversation.getRecentMessages(5)).rejects.toBeInstanceOf(NotImplementedError);
    await expect(conversation.reserveFounderMessage("Hej", CAP)).rejects.toBeInstanceOf(NotImplementedError);
    await expect(conversation.appendCofounderReply("Svar")).rejects.toBeInstanceOf(NotImplementedError);
  });

  it("ett annat fel från Supabase kastas som ett riktigt fel", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: failingClient({ code: "500", message: "nätverk" }),
      userId: USER,
    });
    const error = await (await load()).getRecentMessages(5).catch((e: unknown) => e);
    expect(error).not.toBeInstanceOf(NotImplementedError);
    expect(String(error)).toMatch(/kunde inte läsa samtalet/);
  });
});
