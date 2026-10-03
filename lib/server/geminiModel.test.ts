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

  it("skickar bara nyckelord som Gemini tar emot: minLength, maxLength, pattern och maxItems tas bort på alla nivåer", async () => {
    const { generateJson } = await import("./gemini");
    const schema = {
      type: "object",
      properties: {
        // Fältnamn som råkar heta som ett nyckelord ska vara kvar.
        pattern: { type: "string", minLength: 3, maxLength: 120, pattern: "^a" },
        lista: { type: "array", maxItems: 25, items: { type: "string", enum: ["a", "b"], minLength: 1 } },
      },
      required: ["pattern", "lista"],
      additionalProperties: false,
    };
    await generateJson({ systemInstruction: "s", userText: "u", responseJsonSchema: schema });
    expect(generateContentMock.mock.calls[0][0].config.responseJsonSchema).toEqual({
      type: "object",
      properties: {
        pattern: { type: "string" },
        lista: { type: "array", items: { type: "string", enum: ["a", "b"] } },
      },
      required: ["pattern", "lista"],
      additionalProperties: false,
    });
    // Indata ändras inte.
    expect(schema.properties.pattern).toHaveProperty("minLength", 3);
  });

  it("Juridisk kolls riktiga schema skickas utan minLength, maxLength och maxItems, men med enum", async () => {
    const { z } = await import("zod");
    const { GeminiSvarSchema } = await import("@/adapters/live/legalSchema");
    const { toGeminiSchema } = await import("./gemini");
    const sent = JSON.stringify(toGeminiSchema(z.toJSONSchema(GeminiSvarSchema)));
    expect(sent).not.toMatch(/"(minLength|maxLength|pattern|maxItems|\$schema)"/);
    expect(sent).toContain('"rubrik"');
    expect(sent).toContain('"enum"');
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

describe("omförsök vid 503 och 429", () => {
  async function apiError(status: number, details?: unknown[]) {
    const { ApiError } = await import("@google/genai");
    return new ApiError({
      message: JSON.stringify({ error: { code: status, status: status === 429 ? "RESOURCE_EXHAUSTED" : "UNAVAILABLE", message: "x", details } }),
      status,
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("503 försöks om med backoff och lyckas på tredje försöket", async () => {
    const { generateText } = await import("./gemini");
    generateContentMock
      .mockRejectedValueOnce(await apiError(503))
      .mockRejectedValueOnce(await apiError(503))
      .mockResolvedValueOnce(response("Hej!"));
    const result = generateText({ systemInstruction: "s", turns: [{ role: "user", text: "Hej" }] });
    await vi.advanceTimersByTimeAsync(1_000);
    expect(generateContentMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(3_000);
    await expect(result).resolves.toBe("Hej!");
    expect(generateContentMock).toHaveBeenCalledTimes(3);
  });

  it("högst två omförsök: tredje 503 visas som fel", async () => {
    const { generateText } = await import("./gemini");
    const third = await apiError(503);
    generateContentMock
      .mockRejectedValueOnce(await apiError(503))
      .mockRejectedValueOnce(await apiError(503))
      .mockRejectedValueOnce(third);
    const result = generateText({ systemInstruction: "s", turns: [{ role: "user", text: "Hej" }] });
    const settled = expect(result).rejects.toBe(third);
    await vi.advanceTimersByTimeAsync(4_000);
    await settled;
    expect(generateContentMock).toHaveBeenCalledTimes(3);
  });

  it("429 väntar retryDelay när den är högst 10 s", async () => {
    const { generateJson } = await import("./gemini");
    const retryInfo = { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "7s" };
    generateContentMock.mockRejectedValueOnce(await apiError(429, [retryInfo])).mockResolvedValueOnce(response("{}"));
    const result = generateJson({ systemInstruction: "s", userText: "u", responseJsonSchema: {} });
    await vi.advanceTimersByTimeAsync(6_900);
    expect(generateContentMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(200);
    await expect(result).resolves.toBe("{}");
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });

  it("429 med retryDelay över 10 s visas som fel direkt, utan att vänta", async () => {
    const { generateJson } = await import("./gemini");
    const error = await apiError(429, [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "47s" }]);
    generateContentMock.mockRejectedValueOnce(error);
    await expect(generateJson({ systemInstruction: "s", userText: "u", responseJsonSchema: {} })).rejects.toBe(error);
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it("400 försöks aldrig om", async () => {
    const { generateJson } = await import("./gemini");
    const error = await apiError(400);
    generateContentMock.mockRejectedValueOnce(error);
    await expect(generateJson({ systemInstruction: "s", userText: "u", responseJsonSchema: {} })).rejects.toBe(error);
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });
});
