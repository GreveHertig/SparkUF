// En minimal, explicit fejkad Supabase-klient för att testa liveadaptrarna
// utan nätverk eller en riktig databas — samma skäl som
// `vi.mock("@/lib/server/gemini", ...)` i ports/LegalAdvisor.contract.test.ts.
// Håller BARA den delmängd av PostgREST-kedjan adaptrarna faktiskt
// använder: `from().select().eq().is().order().limit().maybeSingle()/.single()`,
// `insert`, `update` och `delete` (på raderna som filtren träffar), `upsert` (matchar mot
// `onConflict`-kolumnerna, en eller flera kommaseparerade) och `rpc` (bara mot
// handläggare som testet själv skickar in, se `FakeRpcHandlers`). Unika index
// prövas bara vid `insert` och bara om testet deklarerar dem
// (`FakeOptions.unique`), med PostgREST:s felkod 23505. Ingen join, inga
// check-villkor, inga filter utöver `eq`, `gte` och `is`.
//
// RISK, uttalad: en fejk kan glida semantiskt från riktig PostgREST. Håll
// adapterfrågorna medvetet enkla (en tabell, `eq`/`order`, inga joins) och
// lita på adapters/live/rls.live.test.ts (opt-in, mot en riktig databas) för
// sanningen om det någonsin är osäkert.

export type FakeRow = Record<string, unknown>;
export type FakeTables = Record<string, FakeRow[]>;
type FakeError = { message: string; code?: string };
type FakeResult = { data: unknown; error: FakeError | null };

/** Ett unikt index, valfritt partiellt (`where`), som
 * `projects_ett_aktivt_per_user` (user_id where is_active). */
export type FakeUniqueIndex = { name: string; columns: string[]; where?: (row: FakeRow) => boolean };

export type FakeOptions = {
  unique?: Record<string, FakeUniqueIndex[]>;
  /** Tabeller där en insert utan `id` får ett genererat, som en
   * `default gen_random_uuid()`-kolumn. */
  generatedIds?: string[];
  /** Tabell -> kolumn som får ett stigande heltal vid insert, som en
   * `generated always as identity`-kolumn (t.ex. cofounder_messages.seq). */
  identity?: Record<string, string>;
};

type OrderSpec = { column: string; ascending: boolean };

class FakeQueryBuilder implements PromiseLike<FakeResult> {
  private readonly table: FakeRow[];
  private readonly uniqueIndexes: FakeUniqueIndex[];
  private readonly generateIds: boolean;
  private readonly identityColumn: string | undefined;
  private readonly filters: Array<(row: FakeRow) => boolean> = [];
  private readonly orderSpecs: OrderSpec[] = [];
  private limitN: number | undefined;
  private mode: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: FakeRow | FakeRow[] | undefined;
  private upsertKey: string | undefined;
  private singleMode: "maybe" | "one" | null = null;

  constructor(store: FakeTables, tableName: string, options: FakeOptions, private readonly ids: () => string) {
    this.table = store[tableName] ?? (store[tableName] = []);
    this.uniqueIndexes = options.unique?.[tableName] ?? [];
    this.generateIds = options.generatedIds?.includes(tableName) ?? false;
    this.identityColumn = options.identity?.[tableName];
  }

  select(): this {
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  /** `gte(kolumn, värde)`. Jämför som strängar eller tal, som ISO-tider. */
  gte(column: string, value: string | number): this {
    this.filters.push((row) => (row[column] as string | number) >= value);
    return this;
  }

  /** `is(kolumn, null)`. En saknad kolumn räknas som null, som en nullbar
   * kolumn utan värde. */
  is(column: string, value: null | boolean): this {
    this.filters.push((row) => (row[column] ?? null) === value);
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

  update(payload: FakeRow): this {
    this.mode = "update";
    this.payload = payload;
    return this;
  }

  /** `delete()` tar bort raderna som filtren träffar (Min plan). */
  delete(): this {
    this.mode = "delete";
    return this;
  }

  upsert(payload: FakeRow | FakeRow[], options?: { onConflict?: string }): this {
    this.mode = "upsert";
    this.payload = payload;
    this.upsertKey = options?.onConflict;
    return this;
  }

  then<TResult1 = FakeResult, TResult2 = never>(
    onfulfilled?: ((value: FakeResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  private violatedIndex(row: FakeRow): FakeUniqueIndex | undefined {
    return this.uniqueIndexes.find(
      (index) =>
        (!index.where || index.where(row)) &&
        this.table.some(
          (existing) =>
            (!index.where || index.where(existing)) && index.columns.every((column) => existing[column] === row[column]),
        ),
    );
  }

  /** `.single()`/`.maybeSingle()` gäller också det en mutation returnerar. */
  private shape(rows: FakeRow[]): FakeResult {
    if (this.singleMode === "maybe") return { data: rows[0] ?? null, error: null };
    if (this.singleMode === "one") {
      return rows.length === 1
        ? { data: rows[0], error: null }
        : { data: null, error: { message: "fake: förväntade exakt en rad" } };
    }
    return { data: rows, error: null };
  }

  private execute(): FakeResult {
    if (this.mode === "insert") {
      const identity = this.identityColumn;
      let nextIdentity =
        identity === undefined ? 0 : Math.max(0, ...this.table.map((row) => Number(row[identity]) || 0));
      const rows = (Array.isArray(this.payload) ? this.payload : [this.payload as FakeRow])
        .map((row) => (this.generateIds && row.id === undefined ? { id: this.ids(), ...row } : row))
        .map((row) => (identity === undefined ? row : { ...row, [identity]: ++nextIdentity }));
      for (const row of rows) {
        const index = this.violatedIndex(row);
        if (index) {
          return {
            data: null,
            error: { code: "23505", message: `duplicate key value violates unique constraint "${index.name}"` },
          };
        }
      }
      this.table.push(...rows);
      return this.shape(rows);
    }

    if (this.mode === "update") {
      const updated: FakeRow[] = [];
      this.table.forEach((row, index) => {
        if (!this.filters.every((filter) => filter(row))) return;
        this.table[index] = { ...row, ...(this.payload as FakeRow) };
        updated.push(this.table[index]);
      });
      return this.shape(updated);
    }

    if (this.mode === "delete") {
      const removed: FakeRow[] = [];
      for (let index = this.table.length - 1; index >= 0; index -= 1) {
        if (!this.filters.every((filter) => filter(this.table[index]))) continue;
        removed.unshift(this.table[index]);
        this.table.splice(index, 1);
      }
      return this.shape(removed);
    }

    if (this.mode === "upsert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload as FakeRow];
      const keys = this.upsertKey?.split(",").map((key) => key.trim()) ?? [];
      for (const row of rows) {
        const existingIndex =
          keys.length > 0 ? this.table.findIndex((r) => keys.every((key) => r[key] === row[key])) : -1;
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
    return this.shape(rows);
  }
}

/** En fejkad databasfunktion. Får den delade tabellstoren, så att den kan
 * skriva rader som efterföljande `from()`-anrop ser. Ett kastat fel blir
 * `{ data: null, error }`, som PostgREST svarar på ett `raise exception`.
 * Fejken ersätter aldrig den riktiga funktionen: den prövas mot Postgres i
 * supabase/migrations/*.pg.test.ts. */
export type FakeRpcHandlers = Record<string, (args: Record<string, unknown>, store: FakeTables) => unknown>;

export function makeSupabaseFake(
  initial: FakeTables = {},
  rpcHandlers: FakeRpcHandlers = {},
  options: FakeOptions = {},
) {
  const store: FakeTables = structuredClone(initial);
  let nextId = 0;
  const ids = () => `fake-id-${++nextId}`;
  return {
    from(tableName: string) {
      return new FakeQueryBuilder(store, tableName, options, ids);
    },
    async rpc(name: string, args: Record<string, unknown> = {}) {
      const handler = rpcHandlers[name];
      if (!handler) return { data: null, error: { message: `fake: ingen rpc-handläggare för "${name}"` } };
      try {
        return { data: handler(args, store), error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const code = (error as { code?: unknown }).code;
        // En handläggare kan sätta felkoden (errcode i raise exception).
        return { data: null, error: typeof code === "string" ? { message, code } : { message } };
      }
    },
    /** Bara för tester: läs en tabell direkt. */
    tables: store,
  };
}
