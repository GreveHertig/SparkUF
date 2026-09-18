import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { search } from "@/lib/server/tavily";
import { NotImplementedError } from "@/core/errors";

describe("search", () => {
  const originalKey = process.env.TAVILY_API_KEY;

  beforeEach(() => {
    delete process.env.TAVILY_API_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.TAVILY_API_KEY;
    } else {
      process.env.TAVILY_API_KEY = originalKey;
    }
  });

  it("kastar ett tydligt fel som nämner TAVILY_API_KEY när nyckeln saknas", async () => {
    await expect(search()).rejects.toThrow(/TAVILY_API_KEY/);
  });

  it("kastar NotImplementedError när nyckeln finns (sökningen är inte byggd än)", async () => {
    process.env.TAVILY_API_KEY = "test-key";
    await expect(search()).rejects.toBeInstanceOf(NotImplementedError);
  });
});
