import { afterEach, describe, expect, it, vi } from "vitest";
import { PulseWatchError } from "@/core/errors";

const setFeedback = vi.hoisted(() => vi.fn());
const addWatchMock = vi.hoisted(() => vi.fn());
const removeWatchMock = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/PulseProvider", () => ({
  livePulseProvider: { setFeedback, addWatch: addWatchMock, removeWatch: removeWatchMock },
}));
vi.mock("next/cache", () => ({ revalidatePath }));

import { addWatch, giveFeedback, removeWatch } from "./actions";

afterEach(() => vi.clearAllMocks());

describe("Pulsens Server Actions", () => {
  it("giveFeedback skickar vidare ett giltigt omdöme och avvisar allt annat", async () => {
    await giveFeedback("id-1", "not_relevant");
    expect(setFeedback).toHaveBeenCalledWith("id-1", "not_relevant");
    await expect(giveFeedback("id-1", "kanske")).rejects.toThrow("ogiltigt omdöme");
    await expect(giveFeedback(42, "relevant")).rejects.toThrow("ogiltigt omdöme");
    expect(setFeedback).toHaveBeenCalledTimes(1);
  });

  it("addWatch sparar, uppdaterar sidan och svarar ok", async () => {
    expect(await addWatch("competitor", "ByråFlöde")).toEqual({ ok: true });
    expect(addWatchMock).toHaveBeenCalledWith("competitor", "ByråFlöde");
    expect(revalidatePath).toHaveBeenCalledWith("/app/pulsen");
  });

  it("addWatch översätter PulseWatchError till ett skäl och ett okänt fel till failed", async () => {
    addWatchMock.mockRejectedValueOnce(new PulseWatchError("too_many"));
    expect(await addWatch("keyword", "ord")).toEqual({ ok: false, reason: "too_many" });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    addWatchMock.mockRejectedValueOnce(new Error("hemligt databassvar"));
    expect(await addWatch("keyword", "ord")).toEqual({ ok: false, reason: "failed" });
    expect(log.mock.calls.flat().join(" ")).not.toContain("hemligt");
    log.mockRestore();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("addWatch avvisar fel sort eller icke-text utan att anropa adaptern", async () => {
    expect(await addWatch("annat", "ord")).toEqual({ ok: false, reason: "failed" });
    expect(await addWatch("keyword", { term: "x" })).toEqual({ ok: false, reason: "failed" });
    expect(addWatchMock).not.toHaveBeenCalled();
  });

  it("removeWatch tar bort och uppdaterar sidan", async () => {
    await removeWatch("w1");
    expect(removeWatchMock).toHaveBeenCalledWith("w1");
    expect(revalidatePath).toHaveBeenCalledWith("/app/pulsen");
    await expect(removeWatch(1)).rejects.toThrow("ogiltigt id");
  });
});
