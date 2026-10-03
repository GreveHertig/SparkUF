import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegistryLockedError } from "@/core/errors";
import type { MarketOverview } from "@/ports/RegistryProvider";

const getMarketOverview = vi.fn();
const recordMarketEvidence = vi.fn();
const getStepCompletion = vi.fn();
const completeStep = vi.fn();
const redirect = vi.fn((url: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { url });
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirect(url),
  unstable_rethrow: (error: unknown) => {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/adapters/live/RegistryProvider", () => ({ liveRegistryProvider: { getMarketOverview: (...a: unknown[]) => getMarketOverview(...a) } }));
vi.mock("@/adapters/live/EvidenceRecorder", () => ({ recordMarketEvidence: (...a: unknown[]) => recordMarketEvidence(...a) }));
vi.mock("@/adapters/live/JourneyProgress", () => ({
  liveJourneyProgress: {
    getStepCompletion: (step: number) => getStepCompletion(step),
    completeStep: (step: number) => completeStep(step),
  },
}));

const { chooseIndustry } = await import("./actions");

const overview = { companyCount: 4210, competitors: [] } as unknown as MarketOverview;
function form(sni: string) {
  const data = new FormData();
  data.set("sni", sni);
  return data;
}
async function landing(sni: string): Promise<string> {
  const error = await chooseIndustry(form(sni)).catch((caught: { url?: string }) => caught);
  return (error as { url: string }).url;
}

beforeEach(() => {
  vi.clearAllMocks();
  getMarketOverview.mockResolvedValue(overview);
  recordMarketEvidence.mockResolvedValue({ status: "recorded" });
  completeStep.mockResolvedValue({});
});

describe("chooseIndustry", () => {
  it("hämtar marknadsbilden på servern, sparar beviset och klarar steg 03", async () => {
    getStepCompletion.mockImplementation(async (step: number) => ({ status: step === 3 ? "completable" : "missing" }));
    expect(await landing("43.210")).toBe("/app/marknad?sni=43.210&sparad=steg3");
    expect(getMarketOverview).toHaveBeenCalledWith("sv", "43.210");
    expect(recordMarketEvidence).toHaveBeenCalledWith("43.210", overview, "sv");
    expect(completeStep).toHaveBeenCalledTimes(1);
    expect(completeStep).toHaveBeenCalledWith(3);
  });

  it("ett redan klart steg 03 hoppas över, och steg 04 klaras när konkurrenterna finns", async () => {
    getStepCompletion.mockImplementation(async (step: number) => ({ status: step === 3 ? "done" : "completable" }));
    expect(await landing("43.210")).toBe("/app/marknad?sni=43.210&sparad=steg4");
    expect(completeStep).toHaveBeenCalledWith(4);
  });

  it("när steget inte går att klara än sparas beviset ändå", async () => {
    getStepCompletion.mockResolvedValue({ status: "previousNotDone" });
    expect(await landing("43.210")).toBe("/app/marknad?sni=43.210&sparad=1");
    expect(completeStep).not.toHaveBeenCalled();
  });

  it("en ogiltig kod gör ingenting", async () => {
    expect(await landing("43210; drop")).toBe("/app/marknad");
    expect(getMarketOverview).not.toHaveBeenCalled();
  });

  it("stängd grind eller 0 bolag: inget sparas och sidan säger att det inte gick", async () => {
    getMarketOverview.mockRejectedValueOnce(new RegistryLockedError());
    expect(await landing("43.210")).toBe("/app/marknad?sni=43.210&sparad=fel");
    expect(recordMarketEvidence).not.toHaveBeenCalled();
    recordMarketEvidence.mockResolvedValueOnce({ status: "noData" });
    expect(await landing("43.210")).toBe("/app/marknad?sni=43.210&sparad=fel");
    expect(completeStep).not.toHaveBeenCalled();
  });
});
