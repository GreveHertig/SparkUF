import { afterEach, describe, expect, it, vi } from "vitest";
import { NotImplementedError } from "@/core/errors";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

const sessionMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/server/session", () => ({ requireSupabaseUser: sessionMock }));

const { livePlanRepository } = await import("./PlanRepository");

const USER = "user-1";
const ID = "00000000-0000-4000-8000-000000000001";

/** En klient där varje fråga svarar med samma fel, som när tabellen saknas. */
function failing(code: string, message = "fel från databasen med detaljer") {
  const result = Promise.resolve({ data: null, error: { code, message } });
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order", "limit", "insert", "update", "delete"]) {
    chain[method] = () => chain;
  }
  chain.then = result.then.bind(result);
  return { from: () => chain };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("livePlanRepository", () => {
  it("utan tabell (migreringen inte körd) blir det NotImplementedError, så att knappen och listan döljs", async () => {
    sessionMock.mockResolvedValue({ supabase: failing("42P01"), userId: USER });
    await expect(livePlanRepository.getItems()).rejects.toBeInstanceOf(NotImplementedError);
    sessionMock.mockResolvedValue({ supabase: failing("PGRST205"), userId: USER });
    await expect(livePlanRepository.setDone(ID, true)).rejects.toBeInstanceOf(NotImplementedError);
  });

  it("ett annat databasfel kastas vidare utan databasens text", async () => {
    sessionMock.mockResolvedValue({ supabase: failing("XX000", "hemlig detalj"), userId: USER });
    const error = await livePlanRepository.getItems().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(NotImplementedError);
    expect((error as Error).message).not.toContain("hemlig detalj");
  });

  it("ett ogiltigt id nekas innan databasen anropas", async () => {
    await expect(livePlanRepository.setDone("inte-ett-id", true)).rejects.toThrow(/ogiltigt id/);
    await expect(livePlanRepository.removeItem("1 or 1=1")).rejects.toThrow(/ogiltigt id/);
    expect(sessionMock).not.toHaveBeenCalled();
  });

  it("ett okänt ursprung, ett ogiltigt ursprungs-id eller för många på en gång nekas", async () => {
    await expect(
      livePlanRepository.addItems([{ text: "Ok", origin: "annat" as "pulsen", originRef: ID }]),
    ).rejects.toThrow(/okänt ursprung/);
    await expect(livePlanRepository.addItems([{ text: "Ok", origin: "pulsen", originRef: "x" }])).rejects.toThrow(
      /ursprungs-id/,
    );
    const many = Array.from({ length: 11 }, (_, i) => ({ text: `Steg ${i}`, origin: "pulsen" as const, originRef: ID }));
    await expect(livePlanRepository.addItems(many)).rejects.toThrow(/för många/);
  });

  it("texten rensas från styrtecken och kapas, och user_id kommer ur sessionen", async () => {
    const fake = makeSupabaseFake({ plan_items: [] });
    sessionMock.mockResolvedValue({ supabase: fake, userId: USER });
    const added = await livePlanRepository.addItems([
      { text: `Läs\u0000 villkoren‮ ${"x".repeat(400)}`, context: "Rubrik\nmed rad", origin: "pulsen", originRef: ID },
      { text: "   ", origin: "pulsen", originRef: ID },
    ]);
    expect(added).toBe(1);
    const [row] = fake.tables.plan_items;
    expect(row.user_id).toBe(USER);
    expect(String(row.text)).not.toMatch(/[\u0000‮]/);
    expect(Array.from(String(row.text)).length).toBeLessThanOrEqual(300);
    expect(row.context).toBe("Rubrik med rad");
  });

  it("ett steg som hunnit sparas från en annan flik (23505) hoppas över, resten sparas", async () => {
    const fake = makeSupabaseFake(
      { plan_items: [] },
      {},
      { unique: { plan_items: [{ name: "plan_items_unique_step", columns: ["user_id", "origin_ref", "text"] }] } },
    );
    sessionMock.mockResolvedValue({ supabase: fake, userId: USER });
    // Raden finns i databasen men syntes inte när planen lästes.
    const read = fake.from.bind(fake);
    let calls = 0;
    fake.from = (table: string) => {
      // Anrop 1 läser planen, anrop 2 sparar "Ett": raden dyker upp däremellan.
      if (++calls === 2) fake.tables.plan_items.push({ user_id: USER, origin_ref: ID, text: "Ett", done: false });
      return read(table);
    };
    const added = await livePlanRepository.addItems([
      { text: "Ett", origin: "pulsen", originRef: ID },
      { text: "Två", origin: "pulsen", originRef: ID },
    ]);
    expect(added).toBe(1);
    expect(fake.tables.plan_items.map((row) => row.text)).toEqual(["Ett", "Två"]);
  });
});
