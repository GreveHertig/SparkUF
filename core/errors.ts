/**
 * Kastas av en liveadapter som inte är byggd än (avsnitt 14.1). Anropande kod
 * (en route eller layout) fångar den och visar ett formgivet "Kommer snart"
 * i stället för att låta felet nå gränssnittet.
 */
export class NotImplementedError extends Error {
  constructor(modul: string, dokPath: string) {
    super(`${modul} är inte byggd än. Se ${dokPath}.`);
    this.name = "NotImplementedError";
  }
}
