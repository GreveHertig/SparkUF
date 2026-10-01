import { describe, expect, it } from "vitest";
import { makeSupabaseFake } from "./supabaseFake";

// Låser fejkens egen semantik för de delar som speglar PostgREST/Postgres, så
// att adaptertesterna inte vilar på en fejk som tyst glidit isär.
describe("supabaseFake", () => {
  it("update ändrar bara raderna som filtren träffar, och is(null) matchar en saknad kolumn", async () => {
    const supabase = makeSupabaseFake({
      profiles: [
        { user_id: "a", done_at: null },
        { user_id: "b", done_at: "2026-10-01" },
        { user_id: "c" },
      ],
    });
    const { data } = await supabase.from("profiles").update({ role: "x" }).is("done_at", null).select();
    expect((data as { user_id: string }[]).map((row) => row.user_id)).toEqual(["a", "c"]);
    expect(supabase.tables.profiles.find((row) => row.user_id === "b")).not.toHaveProperty("role");
  });

  it("upsert med sammansatt onConflict uppdaterar rätt rad", async () => {
    const supabase = makeSupabaseFake({ cache: [{ user_id: "a", day: "1", status: "old" }, { user_id: "a", day: "2", status: "old" }] });
    await supabase.from("cache").upsert({ user_id: "a", day: "2", status: "new" }, { onConflict: "user_id, day" });
    expect(supabase.tables.cache.map((row) => row.status)).toEqual(["old", "new"]);
  });

  it("ett deklarerat partiellt unikt index ger 23505 vid insert och lämnar tabellen orörd", async () => {
    const supabase = makeSupabaseFake(
      { projects: [{ id: "p1", user_id: "a", is_active: true }] },
      {},
      { unique: { projects: [{ name: "ett_aktivt", columns: ["user_id"], where: (row) => row.is_active === true }] } },
    );
    const clash = await supabase.from("projects").insert({ id: "p2", user_id: "a", is_active: true });
    expect(clash.error?.code).toBe("23505");
    expect(supabase.tables.projects).toHaveLength(1);

    const inactive = await supabase.from("projects").insert({ id: "p3", user_id: "a", is_active: false });
    expect(inactive.error).toBeNull();
  });

  it("insert().select().single() ger den skapade raden, med genererat id där det är deklarerat", async () => {
    const supabase = makeSupabaseFake({}, {}, { generatedIds: ["projects"] });
    const { data, error } = await supabase.from("projects").insert({ name: "x" }).select().single();
    expect(error).toBeNull();
    expect(data).toEqual({ id: expect.any(String), name: "x" });
  });
});
