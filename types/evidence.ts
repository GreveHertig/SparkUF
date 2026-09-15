export type Källa = {
  namn: string;
  hämtad: string;
  url?: string;
};

export type Bevis = {
  påstående: string;
  källa: Källa;
  citat?: string;
};

export type PoängDel = {
  namn:
    | "Marknad"
    | "Konkurrens"
    | "Passform"
    | "Problem"
    | "Betalningsvilja"
    | "Produkt"
    | "Traktion"
    | "Genomförbarhet";
  vikt: number;
  poäng: number;
  underlag: Bevis[];
};

export type Poäng = {
  totalt: number;
  delar: PoängDel[];
  beräknad: string;
};
