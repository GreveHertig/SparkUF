import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Det enda aktiva projektet för en användare (uppdrag 14.4: "en grundare har
 * ett projekt i taget i prototypen"). Delad av de liveadaptrar som behöver
 * `project_id` för sitt WHERE-villkor (Evidens och poäng, Resan, Minnet) i
 * stället för att varje adapter upprepar samma fråga.
 */
export async function getActiveProjectId(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    throw new Error(`Kunde inte läsa det aktiva projektet (${error.message}).`);
  }
  return data ? (data.id as string) : null;
}
