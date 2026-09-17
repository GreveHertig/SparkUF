import type { Profile } from "@/core/domain";

/** Modul: Profil (avsnitt 14.3). Liveadapter bygger på Supabase. */
export interface ProfileRepository {
  getProfile(): Promise<Profile>;
}
