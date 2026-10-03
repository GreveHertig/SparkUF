import type { CofounderMessage } from "@/ports/CofounderAgent";
import {
  COFOUNDER_MESSAGE_MAX,
  COFOUNDER_TASK_MAX,
  type CofounderConversationRepository,
} from "@/ports/CofounderConversation";
import { NotImplementedError } from "@/core/errors";
import { cleanMultilineText, cleanText } from "@/core/text";
import { requireSupabaseUser } from "@/lib/server/session";
import { CofounderReplyWriteError, writeCofounderReply } from "@/lib/server/cofounderReplies";

const DOC = "docs/moduler/medgrundaren.md";
const TABLE = "cofounder_messages";
/** Fler än så läses aldrig i ett anrop, oavsett vad som begärs. */
const MAX_READ = 100;

/** PostgREST och Postgres svar när tabellen, funktionen eller kolumnen
 * `next_task` saknas, t.ex. när en migrering inte är körd
 * (20261003120000_cofounder_messages.sql, 20261003230000_cofounder_next_task.sql). */
function isMissing(error: { code?: string }): boolean {
  return ["PGRST205", "42P01", "PGRST202", "42883", "42703", "PGRST204"].includes(error.code ?? "");
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

type MessageRow = { role: string; text: string; next_task?: string | null };

function toMessage(row: CofounderMessage & { next_task?: string | null }): CofounderMessage {
  const nextTask = row.role === "cofounder" && row.next_task?.trim() ? row.next_task.trim() : undefined;
  return nextTask ? { role: row.role, text: row.text, nextTask } : { role: row.role, text: row.text };
}

export const liveCofounderConversation: CofounderConversationRepository = {
  async getRecentMessages(limit: number): Promise<CofounderMessage[]> {
    const n = Math.min(Math.max(0, Math.floor(limit)), MAX_READ);
    if (n === 0) return [];
    const { supabase, userId } = await requireSupabaseUser();
    const { data, error } = await supabase
      .from(TABLE)
      .select("role, text, next_task, seq")
      .eq("user_id", userId)
      // seq sätts av databasen i skrivordning, aldrig av klienten.
      .order("seq", { ascending: false })
      .limit(n);
    if (error) throw failure(error, "läsa samtalet");
    return ((data ?? []) as MessageRow[])
      .filter((row): row is MessageRow & CofounderMessage => row.role === "founder" || row.role === "cofounder")
      .map(toMessage)
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

  async appendCofounderReply(text: string, nextTask?: string): Promise<void> {
    const reply = clean(text);
    const task = typeof nextTask === "string" ? cleanText(nextTask, COFOUNDER_TASK_MAX) : "";
    const { userId } = await requireSupabaseUser();
    // Klienten har ingen skrivrätt på tabellen (20261003230000_cofounder_next_task.sql).
    // Svaret skrivs av servern med service role, och user_id kommer alltid ur
    // sessionen, aldrig ur indata.
    try {
      await writeCofounderReply({ userId, text: reply, nextTask: task || null });
    } catch (error) {
      if (error instanceof CofounderReplyWriteError) {
        throw failure({ code: error.code, message: error.detail }, "spara svaret");
      }
      throw error;
    }
  },
};
