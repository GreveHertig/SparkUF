import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// SDK:n mockas: testet prövar vilken modell och vilken anropsform som skickas,
// inte Gemini självt (det gör de opt-in-märkta *.live.test.ts).
const generateContentMock = vi.hoisted(() => vi.fn());
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock };
  },
}));

const original = { key: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL };

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-key";
  delete process.env.GEMINI_MODEL;
  generateContentMock.mockReset();
  generateContentMock.mockResolvedValue({ text: '{"ok":true}' });
});

afterEach(() => {
  for (const [name, value] of [
    ["GEMINI_API_KEY", original.key],
    ["GEMINI_MODEL", original.model],
  ] as const) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe("geminiModel", () => {
  it("ger standardmodellen gemini-3.8-flash när GEMINI_MODEL saknas eller är tom", async () => {
    const { geminiModel, DEFAULT_GEMINI_MODEL } = await import("./gemini");
    expect(DEFAULT_GEMINI_MODEL).toBe("gemini-3.8-flash");
    expect(geminiModel()).toBe("gemini-3.8-flash");
    process.env.GEMINI_MODEL = "   ";
    expect(geminiModel()).toBe("gemini-3.8-flash");
  });

  it("läser GEMINI_MODEL vid varje anrop, trimmad", async () => {
    const { geminiModel } = await import("./gemini");
    process.env.GEMINI_MODEL = " gemini-4-flash ";
    expect(geminiModel()).toBe("gemini-4-flash");
  });
});

describe("modellen och anropsformen som skickas till SDK:n", () => {
  it("generateJson skickar modellen, JSON-schemat och JSON som svarstyp", async () => {
    const { generateJson } = await import("./gemini");
    process.env.GEMINI_MODEL = "gemini-annan";
    const schema = { type: "object" };
    expect(await generateJson({ systemInstruction: "s", userText: "u", responseJsonSchema: schema })).toBe('{"ok":true}');
    const [params] = generateContentMock.mock.calls[0];
    expect(params.model).toBe("gemini-annan");
    expect(params.contents).toEqual([{ role: "user", parts: [{ text: "u" }] }]);
    expect(params.config).toMatchObject({
      systemInstruction: "s",
      responseMimeType: "application/json",
      responseJsonSchema: schema,
    });
  });

  it("generateText skickar standardmodellen och samtalet i ordning", async () => {
    const { generateText } = await import("./gemini");
    generateContentMock.mockResolvedValue({ text: "Hej!" });
    expect(
      await generateText({
        systemInstruction: "s",
        turns: [
          { role: "user", text: "Hej" },
          { role: "model", text: "Hej, vad vill du?" },
          { role: "user", text: "Hjälp" },
        ],
      }),
    ).toBe("Hej!");
    const [params] = generateContentMock.mock.calls[0];
    expect(params.model).toBe("gemini-3.8-flash");
    expect(params.contents.map((c: { role: string }) => c.role)).toEqual(["user", "model", "user"]);
  });
});
