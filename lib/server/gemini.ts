import "server-only";
import { GoogleGenAI } from "@google/genai";

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
  const response = await genAI.models.generateContent({
    model: geminiModel(),
    contents: [{ role: "user", parts: [{ text: userText }] }],
    config: {
      systemInstruction,
      temperature: 0,
      candidateCount: 1,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseJsonSchema,
      abortSignal: AbortSignal.timeout(timeoutMs),
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini svarade utan text.");
  }
  return text;
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
 * adapters/live/CofounderAgent.ts. Tänkandet hålls kort så att det inte äter
 * upp svarets tokens.
 */
export async function generateText({ systemInstruction, turns, timeoutMs = 20_000 }: GenerateTextInput): Promise<string> {
  const genAI = getGeminiClient();
  const response = await genAI.models.generateContent({
    model: geminiModel(),
    contents: turns.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
    config: {
      systemInstruction,
      temperature: 0.4,
      candidateCount: 1,
      maxOutputTokens: 1024,
      thinkingConfig: { thinkingBudget: 256 },
      abortSignal: AbortSignal.timeout(timeoutMs),
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini svarade utan text.");
  }
  return text;
}
