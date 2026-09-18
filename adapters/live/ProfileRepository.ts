import type { ProfileRepository } from "@/ports/ProfileRepository";
import type { Profile } from "@/core/domain";
import { EmptyStateError, NotImplementedError } from "@/core/errors";
import { requireSupabaseUser } from "@/lib/server/session";

const DOC = "docs/moduler/profil.md";

export const liveProfileRepository: ProfileRepository = {
  async getProfile(): Promise<Profile> {
    const { supabase, userId } = await requireSupabaseUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("name, initials")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Profil: kunde inte läsa profilen (${error.message}).`);
    }
    // handle_new_user()-triggern (supabase/migrations/) skapar alltid en rad
    // vid signup, men name/initials är tomma tills 01 Om dig är klar — ett
    // tomt namn är samma tomma tillstånd som en helt saknad rad
    // (docs/moduler/profil.md: "en användare utan namn har inte slutfört
    // 01 Om dig").
    if (!data || !data.name || !data.initials) {
      throw new EmptyStateError("Profil", DOC);
    }
    return { name: data.name as string, initials: data.initials as string };
  },

  // Väntar på ett olöst designbeslut (ska profilsamtalet bli ett riktigt
  // Gemini-samtal, eller ersätts chippen bara med fritext?) — flaggat i
  // docs/moduler/profil.md innan den här sessionen, olöst med flit.
  // Se ports/stubStatus.test.ts's PARTIELLA_STUBBAR.
  async getOnboardingScript() {
    throw new NotImplementedError("Profil", DOC);
  },
};
