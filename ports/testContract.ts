import { describe, it } from "vitest";
import { NotImplementedError } from "@/core/errors";

/**
 * Kör samma testsvit mot en ports demo- och liveadapter (docs/uppdrag.md
 * 14.4: "samma testsvit körs mot demoadaptern och liveadaptern för varje
 * port"). Testkod, importeras aldrig av app-kod.
 */
export function describeContract<P>(
  portName: string,
  adapters: { demo: P; live: P },
  suite: (adapter: P) => void,
) {
  describe(`${portName}-kontrakt: demo`, () => suite(adapters.demo));
  describe(`${portName}-kontrakt: live`, () => suite(adapters.live));
}

/**
 * `it()` som skippar sig själv, i stället för att fela, så länge adaptern
 * under test fortfarande är en `NotImplementedError`-stubbe
 * (adapters/live/*.ts tills modulsessionen bygger den, se
 * docs/bygga-en-modul.md). Så snart en liveadapter slutar kasta
 * `NotImplementedError` börjar samma test faktiskt pröva kontraktet — filen
 * behöver inte skrivas om den dagen.
 *
 * Två regler:
 * 1. Lägg aldrig en egen try/catch runt asserts i `fn` — `ctx.skip()` kastar
 *    med flit (vitest-kontraktet), och en egen catch skulle svälja skippen.
 * 2. Negativa tester (förväntat fel) måste kontrollera feltypen
 *    (`.rejects.toBeInstanceOf(X)`), aldrig bara `.rejects.toThrow()` —
 *    annars blir de falskt gröna mot en stubbe, eftersom
 *    `NotImplementedError` också är ett kastat fel. Djupare felfall hör
 *    hemma i adapterns egna `adapters/live/<Modul>.test.ts`.
 */
export function contractIt(name: string, fn: () => Promise<void>) {
  it(name, async (ctx) => {
    try {
      await fn();
    } catch (error) {
      if (error instanceof NotImplementedError) {
        await ctx.annotate(error.message, "stub");
        ctx.skip("liveadaptern är fortfarande en stub");
      }
      throw error;
    }
  });
}
