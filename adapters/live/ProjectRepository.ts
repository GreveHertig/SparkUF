import type { ProjectRepository, Project } from "@/ports/ProjectRepository";
import { NotImplementedError } from "@/core/errors";
import { requireSupabaseUser } from "@/lib/server/session";

const DOC = "docs/moduler/projekt-och-ide.md";

export const liveProjectRepository: ProjectRepository = {
  async getProject(): Promise<Project | null> {
    const { supabase, userId } = await requireSupabaseUser();
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, one_liner")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw new Error(`Projekt och idé: kunde inte läsa projektet (${error.message}).`);
    }
    // null är ett GILTIGT svar (docs/moduler/projekt-och-ide.md) — en
    // användare som inte gjort idégenomlysningen eller valt en idé än.
    if (!data) return null;

    return { id: data.id as string, name: data.name as string, oneLiner: data.one_liner as string };
  },

  // Idégenomlysningen är i praktiken Medgrundaren/Gemini-analys, inte bara
  // lagring, och porten saknar fortfarande en skrivmetod för att spara vad
  // grundaren väljer (flaggat sedan Session P2/5, docs/moduler/projekt-och-ide.md)
  // — medvetet kvar som stub. Se ports/stubStatus.test.ts's PARTIELLA_STUBBAR.
  async getIdeaScreening() {
    throw new NotImplementedError("Projekt och idé", DOC);
  },
};
