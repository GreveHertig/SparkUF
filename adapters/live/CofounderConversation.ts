import type { CofounderMessage } from "@/ports/CofounderAgent";
import { COFOUNDER_MESSAGE_MAX, type CofounderConversationRepository } from "@/ports/CofounderConversation";
import { NotImplementedError } from "@/core/errors";
import { cleanMultilineText } from "@/core/text";
import { requireSupabaseUser } from "@/lib/server/session";

const DOC = "docs/moduler/medgrundaren.md";
const TABLE = "cofounder_messages";
/** Fler än så läses aldrig i ett anrop, oavsett vad som begärs. */
const MAX_READ = 100;

/** PostgREST och Postgres svar när tabellen eller funktionen saknas, t.ex.
 * när migreringen inte är körd. */
function isMissing(error: { code?: string }): boolean {
  return ["PGRST205", "42P01", "PGRST202", "42883"].includes(error.code ?? "");
}

/** Utan tabell går samtalet inte att spara och kostnadstaket inte att räkna,
 * så hela Medgrundaren visar "Kommer snart" i stället för att anropa Gemini. */
function failure(error: { code?: string; message: string }, what: string): Error {
  if (isMissing(error)) return new NotImplementedError("Medgrundaren (samtalet)", DOC);
  return new Error(`Medgrundaren: kunde inte ${what} (${error.message}).`);
}

function clean(text: string): string {
  const cleaned = cleanMultilineText(text, COFOUNDER_MESSAGE_MAX);
  if (!cleaned) throw new Error("Medgrundaren: ett tomt meddelande sparas inte.");
  return cleaned;
}

type MessageRow = { role: string; text: string };

export const liveCofounderConversation: CofounderConversationRepository = {
  async getRecentMessages(limit: number): Promise<CofounderMessage[]> {
    const n = Math.min(Math.max(0, Math.floor(limit)), MAX_READ);
    if (n === 0) return [];
    const { supabase, userId } = await requireSupabaseUser();
    const { data, error } = await supabase
      .from(TABLE)
      .select("role, text, seq")
      .eq("user_id", userId)
      // seq sätts av databasen i skrivordning, aldrig av klienten.
      .order("seq", { ascending: false })
      .limit(n);
    if (error) throw failure(error, "läsa samtalet");
    return ((data ?? []) as MessageRow[])
      .filter((row): row is CofounderMessage => row.role === "founder" || row.role === "cofounder")
      .map((row) => ({ role: row.role, text: row.text }))
      .reverse();
  },

  async reserveFounderMessage(text: string, cap: { limit: number; sinceIso: string }): Promise<boolean> {
    const since = new Date(cap.sinceIso);
    if (Number.isNaN(since.getTime()) || !Number.isInteger(cap.limit) || cap.limit < 0) {
      throw new Error("Medgrundaren: ogiltigt tak.");
    }
    const founder = clean(text);
    const { supabase } = await requireSupabaseUser();
    // Räknar och sparar i ett steg under ett lås per användare
    // (public.reserve_cofounder_message, security invoker: RLS gäller).
    // Användaren tas ur sessionen i databasen (auth.uid()), aldrig ur indata.
    const { data, error } = await supabase.rpc("reserve_cofounder_message", {
      p_text: founder,
      p_limit: cap.limit,
      p_since: since.toISOString(),
    });
    if (error) throw failure(error, "spara meddelandet");
    return data === true;
  },

  async appendCofounderReply(text: string): Promise<void> {
    const reply = clean(text);
    const { supabase, userId } = await requireSupabaseUser();
    // user_id kommer alltid ur sessionen, och RLS ("insert egen") är spärren.
    const { error } = await supabase.from(TABLE).insert({ user_id: userId, role: "cofounder", text: reply });
    if (error) throw failure(error, "spara svaret");
  },
};
