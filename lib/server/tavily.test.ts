import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OutreachTransportError } from "@/core/errors";
import { TAVILY_API_URL, search } from "@/lib/server/tavily";

const fetchMock = vi.fn();
const originalKey = process.env.TAVILY_API_KEY;

function reply(body: unknown, status = 200) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.TAVILY_API_KEY = "test-key";
});
afterEach(() => {
  vi.unstubAllGlobals();
  if (originalKey === undefined) delete process.env.TAVILY_API_KEY;
  else process.env.TAVILY_API_KEY = originalKey;
});

describe("search", () => {
  it("kastar ett tydligt fel som nämner TAVILY_API_KEY när nyckeln saknas, utan nätverksanrop", async () => {
    delete process.env.TAVILY_API_KEY;
    await expect(search({ query: "x" })).rejects.toThrow(/TAVILY_API_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("anropar alltid den fasta URL:en med bearer-nyckel och timeout", async () => {
    reply({ results: [] });
    await search({ query: "Ekbacka Redovisning kontakta oss" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(TAVILY_API_URL);
    expect(init.headers.Authorization).toBe("Bearer test-key");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init.body).include_raw_content).toBe(true);
  });

  it("begränsar antal resultat och sidtext, släpper okända fält", async () => {
    const many = Array.from({ length: 9 }, (_, i) => ({
      title: `t${i}`,
      url: `https://example.se/${i}`,
      content: "c",
      raw_content: "å".repeat(30_000),
      score: 0.9,
    }));
    reply({ results: many });
    const results = await search({ query: "x", maxResults: 50 });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).max_results).toBe(5);
    expect(results).toHaveLength(5);
    expect(Array.from(results[0].rawContent!)).toHaveLength(20_000);
    expect(results[0]).not.toHaveProperty("score");
  });

  it("kastar OutreachTransportError vid HTTP-fel, ogiltigt svar och nätverksfel", async () => {
    reply({}, 500);
    await expect(search({ query: "x" })).rejects.toBeInstanceOf(OutreachTransportError);
    reply({ results: "inte en lista" });
    await expect(search({ query: "x" })).rejects.toBeInstanceOf(OutreachTransportError);
    fetchMock.mockRejectedValue(new Error("timeout"));
    await expect(search({ query: "x" })).rejects.toBeInstanceOf(OutreachTransportError);
  });

  it("kastar bort resultat med osäker URL (http, javascript, userinfo) men behåller övriga", async () => {
    reply({
      results: [
        { url: "http://acme.se/kontakt", content: "a" },
        { url: "javascript:alert(1)", content: "b" },
        { url: "https://acme.se@evil.com/", content: "c" },
        { url: "inte en url", content: "d" },
        { url: "https://acme.se/kontakt", content: "e" },
      ],
    });
    const results = await search({ query: "x" });
    expect(results.map((r) => r.url)).toEqual(["https://acme.se/kontakt"]);
  });

  it("bär ingen cause i transportfel", async () => {
    fetchMock.mockRejectedValue(new Error("hemlig sidtext"));
    const error = await search({ query: "x" }).catch((e) => e);
    expect(error).toBeInstanceOf(OutreachTransportError);
    expect(error.cause).toBeUndefined();
  });
});
