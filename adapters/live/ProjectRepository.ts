import type { ProjectRepository, Project } from "@/ports/ProjectRepository";
import { NotImplementedError, ProjectExistsError } from "@/core/errors";
import { isValidProjectInput } from "@/core/onboarding";
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

  // Grundarens egen idé blir aktivt projekt (ingång B, /start/ide). Det unika
  // indexet projects_ett_aktivt_per_user avgör om det redan finns ett aktivt
  // projekt, i samma insert, så två samtidiga anrop kan inte båda lyckas.
  async createProject(input: { name: string; oneLiner: string }): Promise<Project> {
    if (!isValidProjectInput(input)) {
      throw new Error("Projekt och idé: namnet eller ingressen är tom eller för lång.");
    }
    const { supabase, userId } = await requireSupabaseUser();
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: userId, name: input.name.trim(), one_liner: input.oneLiner.trim(), is_active: true })
      .select("id, name, one_liner")
      .single();
    if (error) {
      if (error.code === "23505") throw new ProjectExistsError();
      throw new Error(`Projekt och idé: kunde inte skapa projektet (${error.message}).`);
    }
    return { id: data.id as string, name: data.name as string, oneLiner: data.one_liner as string };
  },

  // Idégenomlysningen är i praktiken Medgrundaren/Gemini-analys mot
  // registret och väntar på Registret mot SCB AFR (vecka 2,
  // docs/moduler/projekt-och-ide.md). Ytan visar luckan, aldrig påhittad data.
  // Se ports/stubStatus.test.ts's PARTIELLA_STUBBAR.
  async getIdeaScreening() {
    throw new NotImplementedError("Projekt och idé", DOC);
  },
};
