import { afterEach, describe, expect, it, vi } from "vitest";

const setDoneMock = vi.hoisted(() => vi.fn());
const removeItemMock = vi.hoisted(() => vi.fn());
const updateTextMock = vi.hoisted(() => vi.fn());
const addItemsMock = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/PlanRepository", () => ({
  livePlanRepository: {
    setDone: setDoneMock,
    removeItem: removeItemMock,
    updateText: updateTextMock,
    addItems: addItemsMock,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath }));

import { PlanLimitError, PlanTextError } from "@/core/errors";
import { addOwnPlanItem, editPlanItem, removePlanItem, togglePlanItem } from "./actions";

const ID = "00000000-0000-4000-8000-000000000001";

afterEach(() => vi.clearAllMocks());

describe("Min plans Server Actions i Resan", () => {
  it("togglePlanItem skickar vidare ett giltigt värde och avvisar allt annat", async () => {
    await togglePlanItem(ID, true);
    expect(setDoneMock).toHaveBeenCalledWith(ID, true);
    expect(revalidatePath).toHaveBeenCalledWith("/app/resan");
    await expect(togglePlanItem(ID, "ja")).rejects.toThrow("ogiltig");
    await expect(togglePlanItem(42, true)).rejects.toThrow("ogiltig");
    expect(setDoneMock).toHaveBeenCalledTimes(1);
  });

  it("removePlanItem tar bort och avvisar ett id som inte är text", async () => {
    await removePlanItem(ID);
    expect(removeItemMock).toHaveBeenCalledWith(ID);
    await expect(removePlanItem({ id: ID })).rejects.toThrow("ogiltigt id");
    expect(removeItemMock).toHaveBeenCalledTimes(1);
  });

  it("editPlanItem: ok, tom, dubblett och okänt fel blir rätt orsak, utan databasens text i loggen", async () => {
    updateTextMock.mockResolvedValueOnce(undefined);
    expect(await editPlanItem(ID, "Ny text")).toEqual({ ok: true });
    expect(updateTextMock).toHaveBeenCalledWith(ID, "Ny text");
    updateTextMock.mockRejectedValueOnce(new PlanTextError("empty"));
    expect(await editPlanItem(ID, " ")).toEqual({ ok: false, reason: "empty" });
    updateTextMock.mockRejectedValueOnce(new PlanTextError("duplicate"));
    expect(await editPlanItem(ID, "x")).toEqual({ ok: false, reason: "duplicate" });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    updateTextMock.mockRejectedValueOnce(new Error("hemligt databassvar"));
    expect(await editPlanItem(ID, "x")).toEqual({ ok: false, reason: "failed" });
    expect(log.mock.calls.flat().join(" ")).not.toContain("hemligt");
    log.mockRestore();
    expect(await editPlanItem(42, "x")).toEqual({ ok: false, reason: "failed" });
  });

  it("addOwnPlanItem sparar med ursprunget own, och en dubblett eller full plan blir rätt orsak", async () => {
    addItemsMock.mockResolvedValueOnce(1);
    expect(await addOwnPlanItem("Ring HSB")).toEqual({ ok: true });
    expect(addItemsMock).toHaveBeenCalledWith([{ text: "Ring HSB", origin: "own" }]);
    addItemsMock.mockResolvedValueOnce(0);
    expect(await addOwnPlanItem("Ring HSB")).toEqual({ ok: false, reason: "duplicate" });
    addItemsMock.mockRejectedValueOnce(new PlanLimitError(50));
    expect(await addOwnPlanItem("En till")).toEqual({ ok: false, reason: "full" });
    expect(await addOwnPlanItem("   ")).toEqual({ ok: false, reason: "empty" });
    expect(await addOwnPlanItem({ text: "x" })).toEqual({ ok: false, reason: "failed" });
  });
});
