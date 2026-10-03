import { expect, vi } from "vitest";
import type { PlanRepository } from "./PlanRepository";
import { createDemoPlanRepository } from "@/adapters/demo/PlanRepository";
import { livePlanRepository } from "@/adapters/live/PlanRepository";
import { PlanLimitError } from "@/core/errors";
import { PLAN_MAX_OPEN } from "@/core/plan";
import { describeContract, contractIt } from "./testContract";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

const USER = "contract-test-user";

// En fejkad klient per testfil, som i de andra kontrakten: det som sparas i ett
// test syns i nästa. Varje test använder därför ett eget ursprungs-id.
// Databasens regler (RLS, unikt index, check-villkor) prövas mot Postgres i
// supabase/migrations/planItems.pg.test.ts.
let n = 0;
const fake = makeSupabaseFake({ plan_items: [] });
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: async () => {
    // Stigande tider, så att ordningen "äldst först" går att pröva.
    return { supabase: withTimestamps(fake), userId: USER };
  },
}));

/** Fejken sätter inga standardvärden, så det gör vi här: ett uuid, som
 * `default gen_random_uuid()`, och created_at i skrivordning. */
function withTimestamps(client: typeof fake): typeof fake {
  return {
    ...client,
    from(table: string) {
      const builder = client.from(table);
      const insert = builder.insert.bind(builder);
      builder.insert = (payload) =>
        insert(
          (Array.isArray(payload) ? payload : [payload]).map((row) => ({
            id: crypto.randomUUID(),
            created_at: new Date(Date.UTC(2026, 9, 3, 12, 0, n++)).toISOString(),
            done: false,
            ...row,
          })),
        );
      return builder;
    },
  };
}

const ref = (i: number) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;

describeContract<PlanRepository>(
  "PlanRepository",
  { demo: createDemoPlanRepository(), live: livePlanRepository },
  (plan) => {
    contractIt("addItems sparar uppgifterna i ordning och svarar med antalet", async () => {
      const added = await plan.addItems([
        { text: "Läs villkoren", context: "Bidrag till laddboxar", origin: "pulsen", originRef: ref(1) },
        { text: "Skriv in sista dag i kalendern", context: "Bidrag till laddboxar", origin: "pulsen", originRef: ref(1) },
      ]);
      expect(added).toBe(2);
      const items = (await plan.getItems()).filter((item) => item.context === "Bidrag till laddboxar");
      expect(items.map((item) => item.text)).toEqual(["Läs villkoren", "Skriv in sista dag i kalendern"]);
      expect(items.every((item) => item.done === false)).toBe(true);
    });

    contractIt("samma steg från samma ursprung läggs bara till en gång, oavsett stora bokstäver", async () => {
      expect(await plan.addItems([{ text: "Ring banken", origin: "pulsen", originRef: ref(2) }])).toBe(1);
      expect(await plan.addItems([{ text: "ring BANKEN", origin: "pulsen", originRef: ref(2) }])).toBe(0);
      // Samma allmänna steg från en annan signal är en annan uppgift.
      expect(await plan.addItems([{ text: "Ring banken", origin: "pulsen", originRef: ref(3) }])).toBe(1);
    });

    contractIt("setDone bockar av och tillbaka, och avbockade hamnar sist", async () => {
      await plan.addItems([
        { text: "Steg A", context: "Ordning", origin: "pulsen", originRef: ref(4) },
        { text: "Steg B", context: "Ordning", origin: "pulsen", originRef: ref(4) },
      ]);
      const a = (await plan.getItems()).find((item) => item.text === "Steg A")!;
      await plan.setDone(a.id, true);
      const after = (await plan.getItems()).filter((item) => item.context === "Ordning");
      expect(after.map((item) => [item.text, item.done])).toEqual([
        ["Steg B", false],
        ["Steg A", true],
      ]);
      await plan.setDone(a.id, false);
      expect((await plan.getItems()).find((item) => item.id === a.id)?.done).toBe(false);
    });

    contractIt("removeItem tar bort uppgiften", async () => {
      await plan.addItems([{ text: "Tas bort", origin: "pulsen", originRef: ref(5) }]);
      const item = (await plan.getItems()).find((entry) => entry.text === "Tas bort")!;
      await plan.removeItem(item.id);
      expect((await plan.getItems()).some((entry) => entry.id === item.id)).toBe(false);
    });

    contractIt("över taket för öppna uppgifter läggs ingen till", async () => {
      const open = (await plan.getItems()).filter((item) => !item.done).length;
      const room = PLAN_MAX_OPEN - open;
      const many = Array.from({ length: room }, (_, i) => ({ text: `Fyll ${i}`, origin: "pulsen" as const, originRef: ref(100 + i) }));
      for (let i = 0; i < many.length; i += 10) await plan.addItems(many.slice(i, i + 10));
      await expect(
        plan.addItems([{ text: "En för mycket", origin: "pulsen", originRef: ref(6) }]),
      ).rejects.toBeInstanceOf(PlanLimitError);
      expect((await plan.getItems()).some((item) => item.text === "En för mycket")).toBe(false);
    });
  },
);
