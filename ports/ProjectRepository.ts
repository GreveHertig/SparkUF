import type { Locale } from "@/i18n/context";
import type { Källa } from "@/core/domain";

export type Project = {
  id: string;
  name: string;
  oneLiner: string;
};

/** Ett antagande idén bryts ner i (avsnitt 2.1, punkt 1–2). `testableNow`
 * markerar om det går att pröva mot registret direkt. */
export type IdeaAssumption = {
  text: string;
  testableNow: boolean;
};

export type IdeaScreeningFact = {
  label: string;
  value: string;
  source: Källa;
};

/** Idégenomlysningen för ingång B (avsnitt 2.1, `/start/ide`): idén bryts ner
 * i antaganden, en första registerbild visas, Medgrundaren säger rakt ut vad
 * som är svagt och föreslår en skarpare version. Ersätter steg 02 för den
 * ingången. */
export type IdeaScreening = {
  originalIdea: string;
  assumptions: IdeaAssumption[];
  registerFacts: IdeaScreeningFact[];
  weakness: string;
  sharperIdea: {
    name: string;
    oneLiner: string;
    why: string;
  };
};

/** Modul: Projekt och idé (avsnitt 14.3). Liveadapter bygger på Supabase. */
export interface ProjectRepository {
  getProject(): Promise<Project | null>;
  getIdeaScreening(locale: Locale): Promise<IdeaScreening>;
}
