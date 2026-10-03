import "server-only";
import { ApiError, FinishReason, GoogleGenAI, ThinkingLevel, type GenerateContentResponse } from "@google/genai";

/**
 * Tunn, delad Gemini-klient för liveadaptrar (CLAUDE.md, avsnitt Säkerhet:
 * nycklar bara i serverkod). `import "server-only"` gör att modulen inte går
 * att importera från en klientkomponent — bygget kraschar direkt i så fall.
 *
 * Ren SDK-inpackning: känner inget till juridik, poäng eller någon annan
 * domän. Domänlogik (prompt, schema, tolkning av svaret) hör hemma i den
 * anropande adaptern, t.ex. adapters/live/LegalAdvisor.ts.
 */

/** Standardmodellen när GEMINI_MODEL inte är satt. gemini-2.5-flash stängdes
 * för nya användare 2026-10-03 (404 i Vercel-loggen). */
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

/**
 * Modellen för alla Gemini-anrop, på ett enda ställe. Läses ur den
 * server-only-variabeln GEMINI_MODEL (se .env.example), så att modellen kan
 * bytas i Vercel utan ny kod. Tom eller saknad variabel ger standardmodellen.
 * Läses vid varje anrop, inte när modulen laddas.
 */
export function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

/**
 * Anropsformen för Gemini 3 och senare (ai.google.dev/gemini-api/docs/latest-model,
 * kontrollerad 2026-10-03 mot gemini-3.8-flash):
 * - `temperature`, `topP`, `topK` och `candidateCount` stöds inte längre och
 *   skickas inte. De, tillsammans med `thinkingBudget`, är den troliga
 *   orsaken till 400 INVALID_ARGUMENT som båda anropen fick 2026-10-03.
 * - Tänkandet styrs med `thinkingLevel` (LOW, MEDIUM, HIGH; MINIMAL ger fel på
 *   3.8 Flash), inte med `thinkingBudget`. LOW räcker för båda användningarna.
 * - `maxOutputTokens` räknar med tänkandets tokens, så gränserna är satta med
 *   marginal. Ett svar som ändå klipps av (MAX_TOKENS) är ett fel, aldrig ett svar.
 */
const THINKING = { thinkingLevel: ThinkingLevel.LOW };
const JSON_MAX_OUTPUT_TOKENS = 8192;
const TEXT_MAX_OUTPUT_TOKENS = 4096;

/**
 * Omförsök vid tillfälliga fel: 503 UNAVAILABLE ("high demand") och 429
 * RESOURCE_EXHAUSTED (kvoten, gratisnivån tål 5 anrop i minuten). Högst två
 * omförsök. 429 väntar så länge Google säger (retryDelay), men bara om det är
 * högst MAX_RETRY_DELAY_MS; längre väntan visas som fel direkt i stället för att
 * grundaren sitter och väntar. 400 och övriga fel försöks aldrig om.
 */
const MAX_RETRIES = 2;
const BACKOFF_MS = [1_000, 3_000] as const;
const MAX_RETRY_DELAY_MS = 10_000;

let client: GoogleGenAI | undefined;

function getGeminiClient(): GoogleGenAI {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY saknas. Sätt den i .env.local (se .env.example) — skaffa på aistudio.google.com.",
    );
  }
  client = new GoogleGenAI({ apiKey });
  return client;
}

/** Felet när Gemini svarar men svaret inte går att använda (avklippt, stoppat). */
export class GeminiResponseError extends Error {
  constructor(public readonly finishReason: string) {
    super(`Gemini avslutade svaret med ${finishReason}, svaret används inte.`);
    this.name = "GeminiResponseError";
  }
}

/**
 * Loggar Googles felbeskrivning för ett avvisat anrop (status, kod och
 * `error.details`, där det står vilket fält som är fel). SDK:n lägger hela
 * felsvaret som JSON i `message`. Nyckeln skickas i ett huvud och finns aldrig
 * i felsvaret, och anropets innehåll (prompt, användarens text) loggas inte.
 */
type ApiErrorBody = { code?: unknown; status?: unknown; message?: unknown; details?: unknown };

function apiErrorBody(error: ApiError): ApiErrorBody | undefined {
  try {
    return (JSON.parse(error.message) as { error?: ApiErrorBody })?.error;
  } catch {
    return undefined;
  }
}

function logApiError(error: unknown, operation: string): void {
  if (!(error instanceof ApiError)) return;
  const info = apiErrorBody(error);
  console.error(`Gemini avvisade ${operation} (HTTP ${error.status}, modell ${geminiModel()}):`, {
    code: info?.code,
    status: info?.status,
    message: typeof info?.message === "string" ? info.message.slice(0, 500) : undefined,
    details: info?.details,
  });
}

/** retryDelay ur ett 429-svar (google.rpc.RetryInfo, t.ex. "47s"), i ms. */
function retryDelayMs(error: ApiError): number | undefined {
  const details = apiErrorBody(error)?.details;
  if (!Array.isArray(details)) return undefined;
  const info = details.find((d) => String((d as { "@type"?: unknown })?.["@type"]).endsWith("RetryInfo")) as
    | { retryDelay?: unknown }
    | undefined;
  const seconds = Number.parseFloat(String(info?.retryDelay ?? ""));
  return Number.isFinite(seconds) ? seconds * 1000 : undefined;
}

/** Hur länge vi ska vänta före nästa försök, eller undefined om felet inte ska försökas om. */
function retryWaitMs(error: unknown, retry: number): number | undefined {
  if (!(error instanceof ApiError)) return undefined;
  if (error.status === 503) return BACKOFF_MS[retry];
  if (error.status === 429) {
    const wait = retryDelayMs(error) ?? BACKOFF_MS[retry];
    return wait <= MAX_RETRY_DELAY_MS ? wait : undefined;
  }
  return undefined;
}

/**
 * Kör anropet med omförsök (se MAX_RETRIES ovan). `call` skapas på nytt för
 * varje försök, så att varje försök får en egen timeout. Det sista felet loggas
 * med Googles felbeskrivning och kastas vidare.
 */
async function withRetry(
  operation: string,
  call: () => Promise<GenerateContentResponse>,
): Promise<GenerateContentResponse> {
  for (let retry = 0; ; retry++) {
    try {
      return await call();
    } catch (error) {
      const wait = retry < MAX_RETRIES ? retryWaitMs(error, retry) : undefined;
      if (wait === undefined) {
        logApiError(error, operation);
        throw error;
      }
      console.warn(
        `Gemini ${operation}: HTTP ${(error as ApiError).status}, nytt försök om ${Math.round(wait / 100) / 10} s (${retry + 1} av ${MAX_RETRIES}).`,
      );
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
}

/** Text ur svaret, eller ett fel om svaret är avklippt eller stoppat. */
function textOrThrow(response: GenerateContentResponse): string {
  const finishReason = response.candidates?.[0]?.finishReason;
  // STOP är ett färdigt svar. MAX_TOKENS (avklippt), SAFETY, RECITATION m.fl.
  // ger ett halvt eller tomt svar, och halv JSON eller en avklippt mening
  // får aldrig visas som om den vore hel.
  if (finishReason && finishReason !== FinishReason.STOP) {
    throw new GeminiResponseError(finishReason);
  }
  const text = response.text;
  if (!text) {
    throw new Error("Gemini svarade utan text.");
  }
  return text;
}

/**
 * De nyckelord som `responseJsonSchema` stöder, enligt SDK:ns dokumentation
 * (`GenerateContentConfig.responseJsonSchema` i @google/genai 2.23): "only the
 * following properties are supported". Äldre modeller ignorerade resten, men
 * mot gemini-3.8-flash gav schemat 400 INVALID_ARGUMENT (2026-10-03). `$schema`,
 * `minLength`, `maxLength` och `pattern` saknas i listan.
 *
 * `maxItems` står i listan men tas ändå bort: Eriks felsökning mot
 * gemini-3.8-flash (2026-10-03, scratchpad/gemini-schema-probe.mjs) visade att
 * Juridisk kolls schema avvisas med `enum` och `maxItems` tillsammans, men går
 * igenom utan `maxItems` och utan `enum`. `enum` behövs för att modellen ska
 * välja bland katalogens ämnen, så `maxItems` är den som tas bort.
 */
const SUPPORTED_SCHEMA_KEYWORDS = new Set([
  "$id",
  "$defs",
  "$ref",
  "$anchor",
  "type",
  "format",
  "title",
  "description",
  "enum",
  "items",
  "prefixItems",
  "minItems",
  "minimum",
  "maximum",
  "anyOf",
  "oneOf",
  "properties",
  "additionalProperties",
  "required",
  "propertyOrdering",
]);
/** Nyckelord vars värde är en mapp från namn till schema (namnen är inte nyckelord). */
const SCHEMA_MAPS = new Set(["properties", "$defs"]);

/**
 * Schemat med bara de nyckelord Gemini tar emot, på alla nivåer. Det som tas
 * bort (`minLength`, `maxLength`, `pattern`, `maxItems` m.fl.) gäller ändå:
 * adaptrarna validerar svaret mot sitt zod-schema efteråt. Ändrar aldrig indata.
 */
export function toGeminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (!schema || typeof schema !== "object") return schema;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
    if (!SUPPORTED_SCHEMA_KEYWORDS.has(key)) continue;
    if (SCHEMA_MAPS.has(key) && value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = Object.fromEntries(Object.entries(value).map(([name, sub]) => [name, toGeminiSchema(sub)]));
    } else if (key === "enum" || key === "required" || key === "propertyOrdering") {
      result[key] = value;
    } else {
      result[key] = toGeminiSchema(value);
    }
  }
  return result;
}

export type GenerateJsonInput = {
  systemInstruction: string;
  userText: string;
  /** JSON-schema (t.ex. från zods `z.toJSONSchema`) som svaret måste följa. */
  responseJsonSchema: unknown;
  timeoutMs?: number;
};

/**
 * Anropar Gemini och returnerar rå JSON-text. Parsning och validering mot
 * domänschemat är den anropande adapterns ansvar — den här funktionen vet
 * inget om vad JSON:en betyder.
 */
export async function generateJson({
  systemInstruction,
  userText,
  responseJsonSchema,
  timeoutMs = 20_000,
}: GenerateJsonInput): Promise<string> {
  const genAI = getGeminiClient();
  const schema = toGeminiSchema(responseJsonSchema);
  const response = await withRetry("generateJson", () =>
    genAI.models.generateContent({
      model: geminiModel(),
      contents: [{ role: "user", parts: [{ text: userText }] }],
      config: {
        systemInstruction,
        maxOutputTokens: JSON_MAX_OUTPUT_TOKENS,
        thinkingConfig: THINKING,
        responseMimeType: "application/json",
        responseJsonSchema: schema,
        abortSignal: AbortSignal.timeout(timeoutMs),
      },
    }),
  );
  return textOrThrow(response);
}

export type GeminiTurn = { role: "user" | "model"; text: string };

export type GenerateTextInput = {
  systemInstruction: string;
  /** Samtalet i ordning, äldst först. Sista turen är den som ska besvaras. */
  turns: GeminiTurn[];
  /**
   * Valfritt JSON-schema för strukturerad output i samtalet (t.ex. från zods
   * `z.toJSONSchema`). Med schemat svarar modellen med JSON i stället för
   * fri text, och svaret är fortfarande rå text som adaptern tolkar och
   * validerar. Utan schemat är anropet oförändrat.
   */
  responseJsonSchema?: unknown;
  timeoutMs?: number;
};

/**
 * Anropar Gemini för ett svar i ett samtal och returnerar den råa texten
 * (fri text, eller JSON med `responseJsonSchema`). Validering (längd, form,
 * schema) är den anropande adapterns ansvar, t.ex.
 * adapters/live/CofounderAgent.ts. Tänkandet hålls lågt (THINKING ovan) så att
 * det inte äter upp svarets tokens.
 */
export async function generateText({
  systemInstruction,
  turns,
  responseJsonSchema,
  timeoutMs = 20_000,
}: GenerateTextInput): Promise<string> {
  const genAI = getGeminiClient();
  const structured =
    responseJsonSchema === undefined
      ? {}
      : { responseMimeType: "application/json", responseJsonSchema: toGeminiSchema(responseJsonSchema) };
  const response = await withRetry("generateText", () =>
    genAI.models.generateContent({
      model: geminiModel(),
      contents: turns.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
      config: {
        systemInstruction,
        maxOutputTokens: TEXT_MAX_OUTPUT_TOKENS,
        thinkingConfig: THINKING,
        ...structured,
        abortSignal: AbortSignal.timeout(timeoutMs),
      },
    }),
  );
  return textOrThrow(response);
}
