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

export const GEMINI_MODEL = "gemini-2.5-flash";

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
    model: GEMINI_MODEL,
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
