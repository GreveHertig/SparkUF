// Bygg-typer för Spark – brief som ligger till grund för att bygga en webbplats.
import { Bevis } from "./evidence";

/** En brief för vad vi ska bygga åt grundaren. */
export type ByggBrief = {
  sammanfattning: string;
  målgrupp: string;
  /** De sidor som ska byggas. */
  sidor: string[];
  /** Ton och känsla för innehållet. */
  ton: string;
  /** De bevis briefen vilar på. */
  underlag: Bevis[];
  /** Referensbilder (URL:er) om grundaren har några. */
  referensbilder?: string[];
  /** Referenssidor (URL:er) om grundaren har några. */
  referenssidor?: string[];
};