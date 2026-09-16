// Kontraktet mellan A och B: formen på ett "bevis" i Spark.
// Enligt Datalöftet: inget påstående utan källa.

export type Källa = {
  namn: string;        // "Bolagsverket"
  hämtad: string;      // ISO-datum, t.ex. "2026-09-16"
  url?: string;
};

export type Bevis = {
  påstående: string;
  källa: Källa;         // obligatorisk — inget påstående utan källa
  citat?: string;
};
