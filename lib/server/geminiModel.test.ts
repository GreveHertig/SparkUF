import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// SDK:n mockas: testet prövar vilken modell och vilken anropsform som skickas,
// inte Gemini självt (det gör de opt-in-märkta *.live.test.ts).
const generateContentMock = vi.hoisted(() => vi.fn());
vi.mock("@google/genai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@google/genai")>()),
  GoogleGenAI: class {
    models = { generateContent: generateContentMock };
  },
}));

/** Ett svar som SDK:n ger det: text och kandidatens finishReason. */
function response(text: string, finishReason = "STOP") {
  return { text, candidates: [{ finishReason }] };
}

const original = { key: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL };

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-key";
  delete process.env.GEMINI_MODEL;
  generateContentMock.mockReset();
  generateContentMock.mockResolvedValue(response('{"ok":true}'));
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
    generateContentMock.mockResolvedValue(response("Hej!"));
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

describe("anropsformen för Gemini 3 och senare", () => {
  it("skickar inte temperature, candidateCount eller thinkingBudget, och tänkandet som thinkingLevel LOW", async () => {
    const { generateJson, generateText } = await import("./gemini");
    await generateJson({ systemInstruction: "s", userText: "u", responseJsonSchema: {} });
    await generateText({ systemInstruction: "s", turns: [{ role: "user", text: "Hej" }] });
    for (const [params] of generateContentMock.mock.calls) {
      expect(params.config).not.toHaveProperty("temperature");
      expect(params.config).not.toHaveProperty("topP");
      expect(params.config).not.toHaveProperty("topK");
      expect(params.config).not.toHaveProperty("candidateCount");
      expect(params.config.thinkingConfig).toEqual({ thinkingLevel: "LOW" });
      expect(params.config.maxOutputTokens).toBeGreaterThanOrEqual(4096);
    }
  });

  it("tar bort $schema ur JSON-schemat för alla anropare", async () => {
    const { generateJson } = await import("./gemini");
    const schema = { $schema: "https://json-schema.org/draft/2020-12/schema", type: "object" };
    await generateJson({ systemInstruction: "s", userText: "u", responseJsonSchema: schema });
    expect(generateContentMock.mock.calls[0][0].config.responseJsonSchema).toEqual({ type: "object" });
    expect(schema).toHaveProperty("$schema");
  });
});

describe("avklippta och stoppade svar är fel", () => {
  it("MAX_TOKENS ger GeminiResponseError, även när det finns text", async () => {
    const { generateJson, generateText, GeminiResponseError } = await import("./gemini");
    generateContentMock.mockResolvedValue(response('{"krav": [', "MAX_TOKENS"));
    await expect(generateJson({ systemInstruction: "s", userText: "u", responseJsonSchema: {} })).rejects.toBeInstanceOf(
      GeminiResponseError,
    );
    generateContentMock.mockResolvedValue(response("En mening som klipps", "MAX_TOKENS"));
    await expect(generateText({ systemInstruction: "s", turns: [{ role: "user", text: "Hej" }] })).rejects.toThrow(
      /MAX_TOKENS/,
    );
  });

  it("SAFETY ger också ett fel", async () => {
    const { generateText } = await import("./gemini");
    generateContentMock.mockResolvedValue(response("", "SAFETY"));
    await expect(generateText({ systemInstruction: "s", turns: [{ role: "user", text: "Hej" }] })).rejects.toThrow(
      /SAFETY/,
    );
  });
});

describe("ett avvisat anrop loggas med Googles felbeskrivning", () => {
  it("loggar status och error.details, men varken nyckeln eller användarens text, och kastar felet vidare", async () => {
    const { ApiError } = await import("@google/genai");
    const { generateText } = await import("./gemini");
    const details = [
      {
        "@type": "type.googleapis.com/google.rpc.BadRequest",
        fieldViolations: [{ field: "generation_config.thinking_config", description: "Invalid field." }],
      },
    ];
    const apiError = new ApiError({
      message: JSON.stringify({
        error: { code: 400, status: "INVALID_ARGUMENT", message: "Request contains an invalid argument.", details },
      }),
      status: 400,
    });
    generateContentMock.mockRejectedValue(apiError);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      generateText({ systemInstruction: "hemlig instruktion", turns: [{ role: "user", text: "grundarens text" }] }),
    ).rejects.toBe(apiError);

    expect(log).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(log.mock.calls[0]);
    expect(logged).toContain("generation_config.thinking_config");
    expect(logged).toContain("INVALID_ARGUMENT");
    expect(logged).not.toContain("test-key");
    expect(logged).not.toContain("grundarens text");
    expect(logged).not.toContain("hemlig instruktion");
    log.mockRestore();
  });
});
