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
function logApiError(error: unknown, operation: string): void {
  if (!(error instanceof ApiError)) return;
  let body: unknown;
  try {
    body = JSON.parse(error.message);
  } catch {
    body = undefined;
  }
  const info = (body as { error?: { code?: unknown; status?: unknown; message?: unknown; details?: unknown } })?.error;
  console.error(`Gemini avvisade ${operation} (HTTP ${error.status}, modell ${geminiModel()}):`, {
    code: info?.code,
    status: info?.status,
    message: typeof info?.message === "string" ? info.message.slice(0, 500) : undefined,
    details: info?.details,
  });
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

/** Gemini godtar inte nyckeln `$schema` i responseJsonSchema, som zods
 * `z.toJSONSchema` lägger överst. Tas bort här, för alla anropare. */
function withoutSchemaMeta(schema: unknown): unknown {
  if (schema && typeof schema === "object" && !Array.isArray(schema) && "$schema" in schema) {
    const rest: Record<string, unknown> = { ...(schema as Record<string, unknown>) };
    delete rest.$schema;
    return rest;
  }
  return schema;
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
  let response: GenerateContentResponse;
  try {
    response = await genAI.models.generateContent({
      model: geminiModel(),
      contents: [{ role: "user", parts: [{ text: userText }] }],
      config: {
        systemInstruction,
        maxOutputTokens: JSON_MAX_OUTPUT_TOKENS,
        thinkingConfig: THINKING,
        responseMimeType: "application/json",
        responseJsonSchema: withoutSchemaMeta(responseJsonSchema),
        abortSignal: AbortSignal.timeout(timeoutMs),
      },
    });
  } catch (error) {
    logApiError(error, "generateJson");
    throw error;
  }
  return textOrThrow(response);
}

export type GeminiTurn = { role: "user" | "model"; text: string };

export type GenerateTextInput = {
  systemInstruction: string;
  /** Samtalet i ordning, äldst först. Sista turen är den som ska besvaras. */
  turns: GeminiTurn[];
  timeoutMs?: number;
};

/**
 * Anropar Gemini för ett fritt textsvar i ett samtal och returnerar den råa
 * texten. Validering (längd, form) är den anropande adapterns ansvar, t.ex.
 * adapters/live/CofounderAgent.ts. Tänkandet hålls lågt (THINKING ovan) så att
 * det inte äter upp svarets tokens.
 */
export async function generateText({ systemInstruction, turns, timeoutMs = 20_000 }: GenerateTextInput): Promise<string> {
  const genAI = getGeminiClient();
  let response: GenerateContentResponse;
  try {
    response = await genAI.models.generateContent({
      model: geminiModel(),
      contents: turns.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
      config: {
        systemInstruction,
        maxOutputTokens: TEXT_MAX_OUTPUT_TOKENS,
        thinkingConfig: THINKING,
        abortSignal: AbortSignal.timeout(timeoutMs),
      },
    });
  } catch (error) {
    logApiError(error, "generateText");
    throw error;
  }
  return textOrThrow(response);
}
