export type Project = {
  id: string;
  name: string;
  oneLiner: string;
};

/** Modul: Projekt och idé (avsnitt 14.3). Liveadapter bygger på Supabase. */
export interface ProjectRepository {
  getProject(): Promise<Project | null>;
}
