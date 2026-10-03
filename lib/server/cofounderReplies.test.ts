import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ insert: insertMock }));
const createClientMock = vi.fn((url: string, key: string) => ({ url, key, from: fromMock }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: (url: string, key: string) => createClientMock(url, key),
}));

import { CofounderReplyWriteError, writeCofounderReply } from "./cofounderReplies";

const USER = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
  insertMock.mockReset().mockResolvedValue({ error: null });
  fromMock.mockClear();
  createClientMock.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("writeCofounderReply", () => {
  it("skriver bara Medgrundarens rad, med service role och användaren från anroparen", async () => {
    await writeCofounderReply({ userId: USER, text: "Gör så här.", nextTask: "Ring tre kunder." });
    expect(createClientMock.mock.calls[0][1]).toBe("service-key");
    expect(fromMock).toHaveBeenCalledWith("cofounder_messages");
    expect(insertMock).toHaveBeenCalledWith({
      user_id: USER,
      role: "cofounder",
      text: "Gör så här.",
      next_task: "Ring tre kunder.",
    });
  });

  it("nekar ett ogiltigt användar-id och ett tomt svar utan att anropa databasen", async () => {
    await expect(writeCofounderReply({ userId: "user-1", text: "Svar", nextTask: null })).rejects.toThrow(/användar-id/);
    await expect(writeCofounderReply({ userId: USER, text: "", nextTask: null })).rejects.toThrow(/tomt/);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("utan nyckel kastas ett fel innan något skrivs", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    await expect(writeCofounderReply({ userId: USER, text: "Svar", nextTask: null })).rejects.toThrow(
      /SUPABASE_SERVICE_ROLE_KEY saknas/,
    );
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("ett fel från databasen blir CofounderReplyWriteError med koden", async () => {
    insertMock.mockResolvedValue({ error: { code: "23514", message: "check" } });
    const error = await writeCofounderReply({ userId: USER, text: "Svar", nextTask: null }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(CofounderReplyWriteError);
    expect((error as CofounderReplyWriteError).code).toBe("23514");
  });
});
