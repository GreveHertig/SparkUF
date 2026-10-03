import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlanLimitError } from "@/core/errors";
import { sv } from "@/i18n/sv";

const addItemsMock = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const getSignalsMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/PulseProvider", () => ({ livePulseProvider: { getSignals: getSignalsMock } }));
vi.mock("@/adapters/live/PlanRepository", () => ({ livePlanRepository: { addItems: addItemsMock } }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { addPlaybookToPlan } from "./actions";

const SIGNAL = "00000000-0000-4000-8000-000000000001";

afterEach(() => vi.clearAllMocks());
beforeEach(() => getSignalsMock.mockResolvedValue([]));

describe("addPlaybookToPlan (Min plan)", () => {
  it("lägger till spelbokens steg ur i18n, med rubriken som sammanhang och signalen som ursprung", async () => {
    addItemsMock.mockResolvedValue(4);
    const result = await addPlaybookToPlan({ signalId: SIGNAL, kind: "opportunity", area: "funding", headline: "Bidrag" });
    expect(result).toEqual({ ok: true, added: 4 });
    expect(addItemsMock).toHaveBeenCalledWith(
      sv.pulsePage.opportunityAreas.funding.playbook.solve.map((text) => ({
        text,
        context: "Bidrag",
        origin: "pulsen",
        originRef: SIGNAL,
        due: null,
      })),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/app/resan");
  });

  it("risker får riskens steg", async () => {
    addItemsMock.mockResolvedValue(5);
    await addPlaybookToPlan({ signalId: SIGNAL, kind: "risk", area: "finance", headline: "Räntan" });
    expect(addItemsMock.mock.calls[0][0].map((item: { text: string }) => item.text)).toEqual(
      sv.pulsePage.riskAreas.finance.playbook.solve,
    );
  });

  it("okänd sort, okänt område eller fel form sparar ingenting", async () => {
    for (const request of [
      null,
      "text",
      { signalId: SIGNAL, kind: "risk", area: "funding", headline: "x" },
      { signalId: SIGNAL, kind: "opportunity", area: "toString", headline: "x" },
      { signalId: SIGNAL, kind: "annat", area: "funding", headline: "x" },
      { signalId: 1, kind: "risk", area: "costs", headline: "x" },
    ]) {
      expect(await addPlaybookToPlan(request)).toEqual({ ok: false, reason: "failed" });
    }
    expect(addItemsMock).not.toHaveBeenCalled();
  });

  it("taket blir full, ett okänt fel blir failed utan databasens text i loggen", async () => {
    addItemsMock.mockRejectedValueOnce(new PlanLimitError(50));
    expect(await addPlaybookToPlan({ signalId: SIGNAL, kind: "risk", area: "costs", headline: "x" })).toEqual({
      ok: false,
      reason: "full",
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    addItemsMock.mockRejectedValueOnce(new Error("hemligt databassvar"));
    expect(await addPlaybookToPlan({ signalId: SIGNAL, kind: "risk", area: "costs", headline: "x" })).toEqual({
      ok: false,
      reason: "failed",
    });
    expect(log.mock.calls.flat().join(" ")).not.toContain("hemligt");
    log.mockRestore();
  });

  it("sista ansökningsdag följer med ur grundarens egen signal, med signalens källa (Pulsen v3)", async () => {
    getSignalsMock.mockResolvedValue([
      {
        id: SIGNAL,
        category: "",
        headline: "Bidrag",
        whyItMatters: "",
        timestamp: "",
        source: { namn: "energimyndigheten.se", hämtad: "2026-10-04" },
        deadline: "2026-11-30",
      },
    ]);
    addItemsMock.mockResolvedValue(4);
    await addPlaybookToPlan({ signalId: SIGNAL, kind: "opportunity", area: "funding", headline: "Bidrag" });
    expect(addItemsMock.mock.calls[0][0][0].due).toEqual({
      date: "2026-11-30",
      source: { namn: "energimyndigheten.se", hämtad: "2026-10-04" },
    });
  });
});
