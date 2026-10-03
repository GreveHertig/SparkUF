import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CofounderAgentError,
  CofounderDailyLimitError,
  CofounderInputError,
  NotAuthenticatedError,
} from "@/core/errors";

const sendMessageMock = vi.hoisted(() => vi.fn());
const getRecentMessagesMock = vi.hoisted(() => vi.fn());
const appendReplyMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/CofounderAgent", () => ({ liveCofounderAgent: { sendMessage: sendMessageMock } }));
vi.mock("@/adapters/live/CofounderConversation", () => ({
  liveCofounderConversation: { getRecentMessages: getRecentMessagesMock, appendCofounderReply: appendReplyMock },
}));

import { sendCofounderMessage } from "./actions";

const HISTORY = [
  { role: "founder", text: "Hej" },
  { role: "cofounder", text: "Hej. Vad gör du?" },
];

beforeEach(() => {
  getRecentMessagesMock.mockResolvedValue(HISTORY);
  sendMessageMock.mockResolvedValue({ role: "cofounder", text: "Ring tre kunder." });
  appendReplyMock.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe("sendCofounderMessage", () => {
  it("läser historiken på servern före meddelandet, svarar och sparar svaret", async () => {
    const result = await sendCofounderMessage("  Var börjar jag?  ");
    expect(result).toEqual({ ok: true, reply: { role: "cofounder", text: "Ring tre kunder." } });
    expect(getRecentMessagesMock).toHaveBeenCalledWith(20);
    expect(sendMessageMock).toHaveBeenCalledWith("Var börjar jag?", HISTORY, "sv");
    expect(appendReplyMock).toHaveBeenCalledWith("Ring tre kunder.");
    expect(getRecentMessagesMock.mock.invocationCallOrder[0]).toBeLessThan(sendMessageMock.mock.invocationCallOrder[0]);
  });

  it("längden räknas i tecken: 2000 emoji går igenom", async () => {
    expect((await sendCofounderMessage("😀".repeat(2000))).ok).toBe(true);
  });

  it.each([[42], [null], [""], ["   "], ["x".repeat(2001)]])("ogiltig text (%s) avvisas utan anrop", async (text) => {
    expect(await sendCofounderMessage(text)).toEqual({ ok: false, reason: "invalid" });
    expect(sendMessageMock).not.toHaveBeenCalled();
  });

  it("dagens tak blir dailyLimit, och inget sparas", async () => {
    sendMessageMock.mockRejectedValue(new CofounderDailyLimitError(40));
    expect(await sendCofounderMessage("Hej")).toEqual({ ok: false, reason: "dailyLimit" });
    expect(appendReplyMock).not.toHaveBeenCalled();
  });

  it("ett fel från modellen blir failed, och inget sparas", async () => {
    sendMessageMock.mockRejectedValue(new CofounderAgentError());
    expect(await sendCofounderMessage("Hej")).toEqual({ ok: false, reason: "failed" });
    expect(appendReplyMock).not.toHaveBeenCalled();
  });

  it("adapterns indatafel blir invalid", async () => {
    sendMessageMock.mockRejectedValue(new CofounderInputError());
    expect(await sendCofounderMessage("​")).toEqual({ ok: false, reason: "invalid" });
  });

  it("ett okänt fel kastas vidare", async () => {
    getRecentMessagesMock.mockRejectedValue(new NotAuthenticatedError());
    await expect(sendCofounderMessage("Hej")).rejects.toBeInstanceOf(NotAuthenticatedError);
  });
});
