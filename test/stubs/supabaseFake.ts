// En minimal, explicit fejkad Supabase-klient för att testa liveadaptrarna
// utan nätverk eller en riktig databas — samma skäl som
// `vi.mock("@/lib/server/gemini", ...)` i ports/LegalAdvisor.contract.test.ts.
// Håller BARA den delmängd av PostgREST-kedjan adaptrarna faktiskt
// använder: `from().select().eq().order().limit().maybeSingle()/.single()`,
// `insert`, `upsert` (matchar bara mot `onConflict`-kolumnen, ingen riktig
// unik-nyckel-uppslagning). Ingen join, ingen RPC, inget filter utöver `eq`.
//
// RISK, uttalad: en fejk kan glida semantiskt från riktig PostgREST. Håll
// adapterfrågorna medvetet enkla (en tabell, `eq`/`order`, inga joins) och
// lita på adapters/live/rls.live.test.ts (opt-in, mot en riktig databas) för
// sanningen om det någonsin är osäkert.

export type FakeRow = Record<string, unknown>;
export type FakeTables = Record<string, FakeRow[]>;

type OrderSpec = { column: string; ascending: boolean };

class FakeQueryBuilder implements PromiseLike<{ data: unknown; error: { message: string } | null }> {
  private readonly table: FakeRow[];
  private readonly filters: Array<(row: FakeRow) => boolean> = [];
  private readonly orderSpecs: OrderSpec[] = [];
  private limitN: number | undefined;
  private mode: "select" | "insert" | "upsert" = "select";
  private payload: FakeRow | FakeRow[] | undefined;
  private upsertKey: string | undefined;
  private singleMode: "maybe" | "one" | null = null;

  constructor(store: FakeTables, tableName: string) {
    this.table = store[tableName] ?? (store[tableName] = []);
  }

  select(): this {
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderSpecs.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  maybeSingle(): this {
    this.singleMode = "maybe";
    return this;
  }

  single(): this {
    this.singleMode = "one";
    return this;
  }

  insert(payload: FakeRow | FakeRow[]): this {
    this.mode = "insert";
    this.payload = payload;
    return this;
  }

  upsert(payload: FakeRow | FakeRow[], options?: { onConflict?: string }): this {
    this.mode = "upsert";
    this.payload = payload;
    this.upsertKey = options?.onConflict;
    return this;
  }

  then<TResult1 = { data: unknown; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  private execute(): { data: unknown; error: { message: string } | null } {
    if (this.mode === "insert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload as FakeRow];
      this.table.push(...rows);
      return { data: rows, error: null };
    }

    if (this.mode === "upsert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload as FakeRow];
      const key = this.upsertKey;
      for (const row of rows) {
        const existingIndex = key ? this.table.findIndex((r) => r[key] === row[key]) : -1;
        if (existingIndex >= 0) {
          this.table[existingIndex] = { ...this.table[existingIndex], ...row };
        } else {
          this.table.push(row);
        }
      }
      return { data: rows, error: null };
    }

    let rows = this.table.filter((row) => this.filters.every((filter) => filter(row)));
    // Flera .order()-anrop är en sammansatt nyckel (primär, sekundär, ...),
    // inte oberoende sorteringar — applicera dem i OMVÄND ordning med en
    // stabil sort, så den sist tillämpade (den primära nyckeln) vinner och
    // tidigare nycklar bara avgör ordningen inom en grupp av lika värden.
    for (const { column, ascending } of [...this.orderSpecs].reverse()) {
      rows = [...rows].sort((a, b) => {
        const av = a[column] as string | number;
        const bv = b[column] as string | number;
        const cmp = av > bv ? 1 : av < bv ? -1 : 0;
        return ascending ? cmp : -cmp;
      });
    }
    if (this.limitN !== undefined) rows = rows.slice(0, this.limitN);

    if (this.singleMode === "maybe") {
      return { data: rows[0] ?? null, error: null };
    }
    if (this.singleMode === "one") {
      return rows.length === 1
        ? { data: rows[0], error: null }
        : { data: null, error: { message: "fake: förväntade exakt en rad" } };
    }
    return { data: rows, error: null };
  }
}

export function makeSupabaseFake(initial: FakeTables = {}) {
  const store: FakeTables = structuredClone(initial);
  return {
    from(tableName: string) {
      return new FakeQueryBuilder(store, tableName);
    },
  };
}
