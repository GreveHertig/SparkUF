import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateJson } from "@/lib/server/gemini";

describe("generateJson", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it("kastar ett tydligt fel som nämner GEMINI_API_KEY när nyckeln saknas", async () => {
    await expect(
      generateJson({
        systemInstruction: "test",
        userText: "test",
        responseJsonSchema: {},
      }),
    ).rejects.toThrow(/GEMINI_API_KEY/);
  });
});
