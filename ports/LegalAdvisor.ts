import type { Bolagsform, JuridisktKrav } from "@/core/domain";

/** Modul: Juridisk koll (avsnitt 14.3, 2.4). Liveadapter bygger på Gemini + källor (stub). */
export interface LegalAdvisor {
  getLegalMap(bolagsform: Bolagsform): Promise<JuridisktKrav[]>;
}
