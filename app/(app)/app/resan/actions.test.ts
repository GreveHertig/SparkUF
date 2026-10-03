import { afterEach, describe, expect, it, vi } from "vitest";

const setDoneMock = vi.hoisted(() => vi.fn());
const removeItemMock = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/PlanRepository", () => ({
  livePlanRepository: { setDone: setDoneMock, removeItem: removeItemMock },
}));
vi.mock("next/cache", () => ({ revalidatePath }));

import { removePlanItem, togglePlanItem } from "./actions";

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
});
