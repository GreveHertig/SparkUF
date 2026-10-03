import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Skriver Medgrundarens svar i public.cofounder_messages. Beslut Erik
 * 2026-10-03 (docs/beslut.md, en ändring av beslutet från #63): ingen klient
 * får skriva Medgrundarens rader, annars kan grundaren lägga egna ord och
 * egna uppgifter i Medgrundarens mun. Allt grundarens egen session får göra
 * kan klienten också göra, så servern skriver svaret med
 * SUPABASE_SERVICE_ROLE_KEY, som går förbi RLS. Samma mönster som
 * lib/server/scoreSnapshots.ts.
 *
 * Nyckeln:
 * - läses bara här för Medgrundaren (server-only, lint-regel: bara
 *   adapters/live/CofounderConversation.ts och tester får importera filen),
 *   och har aldrig NEXT_PUBLIC_-prefix;
 * - används bara mot cofounder_messages, bara för insert av role 'cofounder'.
 *   Klienten lämnas aldrig ut.
 *
 * userId kommer från anroparens session (requireSupabaseUser), aldrig ur
 * indata. Text och uppgift är redan rensade och kortade av adaptern, och
 * databasens check-villkor är den sista spärren.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CofounderReplyWrite = {
  userId: string;
  text: string;
  nextTask: string | null;
};

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY saknas. Sätt dem i .env.local (se .env.example).");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Felet som adaptern behöver för att känna igen en saknad tabell eller kolumn. */
export class CofounderReplyWriteError extends Error {
  constructor(
    public readonly code: string | undefined,
    public readonly detail: string,
  ) {
    super(`Medgrundaren: kunde inte spara svaret (${detail}).`);
    this.name = "CofounderReplyWriteError";
  }
}

export async function writeCofounderReply({ userId, text, nextTask }: CofounderReplyWrite): Promise<void> {
  if (!UUID_PATTERN.test(userId)) throw new Error("Medgrundaren: ogiltigt användar-id.");
  if (!text) throw new Error("Medgrundaren: ett tomt svar sparas inte.");
  const { error } = await getServiceClient()
    .from("cofounder_messages")
    .insert({ user_id: userId, role: "cofounder", text, next_task: nextTask });
  if (error) throw new CofounderReplyWriteError(error.code, error.message);
}
