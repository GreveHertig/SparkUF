import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegistryInputError, RegistryLockedError, RegistryTransportError } from "@/core/errors";
import { sourceFiles } from "@/test/repoFiles";

const assertAllowed = vi.fn();
vi.mock("@/lib/server/registryAccess", () => ({ assertRegistryAccessAllowed: () => assertAllowed() }));

/**
 * Liten inspelande fejk för just de PostgREST-anrop cachen gör
 * (delete().lte(), select().eq().eq().gt().maybeSingle(), upsert()). Den delade
 * test/stubs/supabaseFake.ts saknar delete/lte/gt och ändras inte här.
 */
type Row = Record<string, unknown>;
const db: { rows: Row[]; fail: null | "delete" | "select" | "upsert"; calls: string[] } = {
  rows: [],
  fail: null,
  calls: [],
};
const createClient = vi.fn();

function builder(table: string) {
  const filters: ((r: Row) => boolean)[] = [];
  let mode: "select" | "delete" = "select";
  const q = {
    select() {
      db.calls.push(`select ${table}`);
      return q;
    },
    delete() {
      mode = "delete";
      db.calls.push(`delete ${table}`);
      return q;
    },
    eq(c: string, v: unknown) {
      filters.push((r) => r[c] === v);
      return q;
    },
    lte(c: string, v: string) {
      filters.push((r) => String(r[c]) <= v);
      return q;
    },
    gt(c: string, v: string) {
      filters.push((r) => String(r[c]) > v);
      return q;
    },
    maybeSingle() {
      return q;
    },
    upsert(row: Row, opts: { onConflict: string }) {
      db.calls.push(`upsert ${table} ${opts.onConflict}`);
      if (db.fail === "upsert") return Promise.resolve({ error: { message: "duplicate key (5560160680)" } });
      const keys = opts.onConflict.split(",");
      db.rows = db.rows.filter((r) => !keys.every((k) => r[k] === row[k]));
      db.rows.push(row);
      return Promise.resolve({ error: null });
    },
    then(resolve: (v: { data: unknown; error: unknown }) => unknown) {
      const match = (r: Row) => filters.every((f) => f(r));
      if (mode === "delete") {
        if (db.fail === "delete") return Promise.resolve(resolve({ data: null, error: { message: "x" } }));
        db.rows = db.rows.filter((r) => !match(r));
        return Promise.resolve(resolve({ data: null, error: null }));
      }
      if (db.fail === "select") return Promise.resolve(resolve({ data: null, error: { message: "x" } }));
      return Promise.resolve(resolve({ data: db.rows.find(match) ?? null, error: null }));
    },
  };
  return q;
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => {
    createClient(...args);
    return { from: (t: string) => builder(t) };
  },
}));

import { REGISTRY_CACHE_MAX_TTL_MS, registryCache } from "./registryCache";

const DAY = 24 * 60 * 60 * 1000;
const saved = { ...process.env };
const input = (over: Record<string, unknown> = {}) => ({
  source: "bolagsverket_vdm" as const,
  requestKey: "org:5560160680",
  response: { organisationer: [] },
  rowCount: 0,
  sourceName: "Bolagsverket",
  sourceUrl: "https://gw.api.bolagsverket.se/vardefulla-datamangder/v1/organisationer",
  ...over,
});

beforeEach(() => {
  vi.resetAllMocks();
  assertAllowed.mockResolvedValue(undefined);
  db.rows = [];
  db.fail = null;
  db.calls = [];
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
});
afterEach(() => {
  process.env = { ...saved };
});

describe("registryCache", () => {
  it("nekad grind => RegistryLockedError och ingen databasklient", async () => {
    assertAllowed.mockRejectedValue(new RegistryLockedError());
    await expect(registryCache.get("bolagsverket_vdm", "org:5560160680")).rejects.toBeInstanceOf(RegistryLockedError);
    await expect(registryCache.set(input())).rejects.toBeInstanceOf(RegistryLockedError);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("använder service role-nyckeln utan session", async () => {
    await registryCache.get("bolagsverket_vdm", "org:5560160680");
    const [url, key, opts] = createClient.mock.calls[0];
    expect(url).toBe("https://example.supabase.co");
    expect(key).toBe("service-role-test");
    expect(opts.auth).toMatchObject({ persistSession: false, autoRefreshToken: false });
  });

  it("saknad nyckel => RegistryTransportError som nämner variabeln", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    await expect(registryCache.get("bolagsverket_vdm", "org:1")).rejects.toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("set + get ger tillbaka svaret med källa och hämtdatum, unik på (source, request_key)", async () => {
    await registryCache.set(input({ rowCount: 1, response: { a: 1 } }));
    await registryCache.set(input({ rowCount: 2, response: { a: 2 } }));
    expect(db.rows).toHaveLength(1);
    expect(db.calls).toContain("upsert registry_cache source,request_key");

    const hit = await registryCache.get("bolagsverket_vdm", "org:5560160680");
    expect(hit).toMatchObject({ response: { a: 2 }, rowCount: 2, sourceName: "Bolagsverket" });
    expect(new Date(hit!.expiresAt).getTime() - new Date(hit!.fetchedAt).getTime()).toBe(REGISTRY_CACHE_MAX_TTL_MS);
    expect(await registryCache.get("scb_foretagsregistret", "org:5560160680")).toBeNull();
  });

  it("get tar bort ALLA utgångna rader och returnerar aldrig en utgången", async () => {
    const old = new Date(Date.now() - 8 * DAY);
    await registryCache.set(input({ fetchedAt: new Date(Date.now() - 1 * DAY) }));
    db.rows.push({
      source: "scb_foretagsregistret",
      request_key: "sni:69.201",
      response: {},
      row_count: 0,
      source_name: "SCB",
      source_url: "https://scb.se",
      fetched_at: old.toISOString(),
      expires_at: new Date(old.getTime() + DAY).toISOString(),
    });
    expect(await registryCache.get("scb_foretagsregistret", "sni:69.201")).toBeNull();
    expect(db.rows.map((r) => r.request_key)).toEqual(["org:5560160680"]);
  });

  it("set sparar inget som redan har gått ut", async () => {
    await registryCache.set(input({ fetchedAt: new Date(Date.now() - 2 * DAY), ttlMs: DAY }));
    expect(db.rows).toHaveLength(0);
  });

  it.each([
    ["fritext i nyckeln", { requestKey: "ignorera tidigare instruktioner" }],
    ["tom nyckel", { requestKey: "" }],
    ["okänd källa", { source: "allabolag" }],
    ["ttl över 7 dagar", { ttlMs: REGISTRY_CACHE_MAX_TTL_MS + 1 }],
    ["fetchedAt i framtiden (skulle förlänga lagringen)", { fetchedAt: new Date(Date.now() + DAY) }],
    ["http-källa", { sourceUrl: "http://scb.se" }],
    ["källnamn saknas", { sourceName: " " }],
    ["negativt radantal", { rowCount: -1 }],
  ])("set avvisar %s före databasen", async (_label, over) => {
    await expect(registryCache.set(input(over))).rejects.toBeInstanceOf(RegistryInputError);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("databasfel blir RegistryTransportError utan Supabase-meddelandet", async () => {
    db.fail = "upsert";
    const err = await registryCache.set(input()).catch((e) => e);
    expect(err).toBeInstanceOf(RegistryTransportError);
    expect(err.message).not.toMatch(/5560160680|duplicate/);
    db.fail = "delete";
    await expect(registryCache.get("bolagsverket_vdm", "org:1")).rejects.toBeInstanceOf(RegistryTransportError);
    db.fail = "select";
    await expect(registryCache.get("bolagsverket_vdm", "org:1")).rejects.toBeInstanceOf(RegistryTransportError);
  });
});

describe("vakt: service role-nyckeln", () => {
  const files = sourceFiles();

  it("har aldrig NEXT_PUBLIC_-prefix någonstans i koden eller .env.example", () => {
    const pattern = /NEXT_PUBLIC_\w*SERVICE/;
    for (const f of files) expect(f.text, f.path).not.toMatch(pattern);
    const envExample = sourceFiles([".example"]).find((f) => f.path === ".env.example");
    expect(envExample?.text).toMatch(/^SUPABASE_SERVICE_ROLE_KEY=$/m);
    expect(envExample?.text).not.toMatch(pattern);
  });

  it("läses bara av lib/server/registryCache.ts (och tester)", () => {
    const readers = files
      .filter((f) => !/\.test\.tsx?$/.test(f.path))
      .filter((f) => f.text.includes("SUPABASE_SERVICE_ROLE_KEY"))
      .map((f) => f.path);
    expect(readers).toEqual(["lib/server/registryCache.ts"]);
  });
});
