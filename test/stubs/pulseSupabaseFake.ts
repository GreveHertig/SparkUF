// Fejkad Supabase-klient för Pulsens liveadapter (adapters/live/PulseProvider.ts).
// Den delade test/stubs/supabaseFake.ts saknar update, lt och
// upsert med ignoreDuplicates på en sammansatt nyckel, så Pulsen har en egen.
// Håller BARA det adaptern använder:
// `from().select().eq().in().lt().order().limit().maybeSingle()`, `insert`,
// `update().eq().lt().select()` och `upsert(..., { ignoreDuplicates }).select()`.
//
// Efterliknar också det databasen gör åt adaptern i pulse_fetches:
// defaultvärden (fetch_date = "i dag", status 'pending', claimed_at = nu) och
// check-villkoret `(status = 'pending') = (fetched_at is null)`.
// RISK: en fejk kan glida från riktig PostgREST. RLS prövas inte här.

export type FakeRow = Record<string, unknown>;
export type PulseFakeTables = Record<string, FakeRow[]>;
type FakeError = { message: string } | null;
type Result = { data: unknown; error: FakeError };

export type PulseFakeOptions = {
  /** Databasens svenska kalenderdag, fetch_date-kolumnens default. */
  today: string;
  /** "tabell:operation" som ska ge ett databasfel, t.ex. "pulse_signals:insert". */
  failOn?: string[];
};

class PulseQuery implements PromiseLike<Result> {
  private readonly filters: Array<(row: FakeRow) => boolean> = [];
  private orderSpec: { column: string; ascending: boolean } | undefined;
  private limitN: number | undefined;
  private mode: "select" | "insert" | "update" | "upsert" = "select";
  private payload: FakeRow | FakeRow[] = {};
  private upsertOptions: { onConflict?: string; ignoreDuplicates?: boolean } = {};
  private returning = false;
  private single = false;

  constructor(
    private readonly tables: PulseFakeTables,
    private readonly tableName: string,
    private readonly options: PulseFakeOptions,
  ) {}

  private get table(): FakeRow[] {
    return this.tables[this.tableName] ?? (this.tables[this.tableName] = []);
  }

  select(): this {
    if (this.mode !== "select") this.returning = true;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  /** Som i SQL: null är aldrig mindre än något. Tidsstämplar jämförs som tider. */
  lt(column: string, value: string): this {
    this.filters.push((row) => {
      const cell = row[column];
      if (cell === null || cell === undefined) return false;
      return Date.parse(String(cell)) < Date.parse(value);
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderSpec = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  maybeSingle(): this {
    this.single = true;
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

  upsert(payload: FakeRow, options?: { onConflict?: string; ignoreDuplicates?: boolean }): this {
    this.mode = "upsert";
    this.payload = payload;
    this.upsertOptions = options ?? {};
    return this;
  }

  then<T1 = Result, T2 = never>(
    onfulfilled?: ((value: Result) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null,
  ): PromiseLike<T1 | T2> {
    return Promise.resolve().then(() => this.execute()).then(onfulfilled, onrejected);
  }

  private withDefaults(row: FakeRow): FakeRow {
    if (this.tableName !== "pulse_fetches") return { id: crypto.randomUUID(), ...row };
    return {
      fetch_date: this.options.today,
      status: "pending",
      claimed_at: new Date().toISOString(),
      fetched_at: null,
      ...row,
    };
  }

  private checkConstraint(row: FakeRow): FakeError {
    if (this.tableName !== "pulse_fetches") return null;
    return (row.status === "pending") === (row.fetched_at === null)
      ? null
      : { message: "new row violates check constraint pulse_fetches_check" };
  }

  private execute(): Result {
    if (this.options.failOn?.includes(`${this.tableName}:${this.mode}`)) {
      return { data: null, error: { message: `fejkat fel i ${this.tableName}:${this.mode}` } };
    }

    if (this.mode === "insert") {
      const rows = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((r) => this.withDefaults(r));
      this.table.push(...rows);
      return { data: this.returning ? rows : null, error: null };
    }

    if (this.mode === "upsert") {
      const row = this.withDefaults(this.payload as FakeRow);
      const keys = (this.upsertOptions.onConflict ?? "").split(",").filter(Boolean);
      const conflict = this.table.find((existing) => keys.length > 0 && keys.every((k) => existing[k] === row[k]));
      if (conflict) {
        if (!this.upsertOptions.ignoreDuplicates) throw new Error("fejken stöder bara ignoreDuplicates");
        return { data: this.returning ? [] : null, error: null };
      }
      this.table.push(row);
      return { data: this.returning ? [row] : null, error: null };
    }

    const matching = this.table.filter((row) => this.filters.every((f) => f(row)));

    if (this.mode === "update") {
      const updated = matching.map((row) => ({ ...row, ...(this.payload as FakeRow) }));
      for (const row of updated) {
        const violation = this.checkConstraint(row);
        if (violation) return { data: null, error: violation };
      }
      matching.forEach((row, i) => Object.assign(row, updated[i]));
      return { data: this.returning ? matching.map((r) => ({ ...r })) : null, error: null };
    }

    let rows = [...matching];
    if (this.orderSpec) {
      const { column, ascending } = this.orderSpec;
      rows.sort((a, b) => {
        const av = String(a[column]);
        const bv = String(b[column]);
        const cmp = av > bv ? 1 : av < bv ? -1 : 0;
        return ascending ? cmp : -cmp;
      });
    }
    if (this.limitN !== undefined) rows = rows.slice(0, this.limitN);
    if (this.single) {
      if (rows.length > 1) return { data: null, error: { message: "flera rader för maybeSingle" } };
      return { data: rows[0] ?? null, error: null };
    }
    return { data: rows, error: null };
  }
}

export function makePulseSupabaseFake(tables: PulseFakeTables, options: PulseFakeOptions) {
  return { from: (tableName: string) => new PulseQuery(tables, tableName, options) };
}
