// Juridiska typer för Spark – inget påstående utan källa och hämtningsdatum.
import { Källa } from "./evidence";

/** Svensk bolagsform som en förstagångsgrundare kan välja. */
export type Bolagsform =
  | "enskild_firma"
  | "aktiebolag"
  | "handelsbolag"
  | "ekonomisk_forening";

/** Ett juridiskt krav som gäller för en eller flera bolagsformer. */
export type JuridisktKrav = {
  id: string;
  rubrik: string;
  beskrivning: string;
  /** Vilka bolagsformer kravet gäller för. */
  gällerFör: Bolagsform[];
  /** Obligatorisk källa – samma regel som för Bevis: inget påstående utan källa. */
  källa: Källa;
  status: "uppfyllt" | "ej_uppfyllt" | "ej_tillämpligt";
  /** Datum då kravet senast behöver vara uppfyllt, om det är tidsbunden. */
  deadline?: string;
  /** Uppskattad kostnad i kronor, om det finns en. */
  kostnadKr?: number;
  /** Myndighet som kravet härrör från, om det är tydligt. */
  myndighet?: string;
};