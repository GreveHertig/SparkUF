import { afterEach, describe, expect, it, vi } from "vitest";
import { EmptyStateError, RegistryLockedError, RegistryTransportError } from "@/core/errors";
import { sourceFiles } from "@/test/repoFiles";

const getMarketOverviewMock = vi.hoisted(() => vi.fn());
const recordRegistryEvidenceMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/RegistryProvider", () => ({
  liveRegistryProvider: { getMarketOverview: getMarketOverviewMock, searchCompanies: vi.fn() },
}));
vi.mock("@/adapters/live/EvidenceRecorder", () => ({ recordRegistryEvidence: recordRegistryEvidenceMock }));
const revalidatePathMock = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const overview = {
  companyCount: 812,
  medianRevenueKsek: 0,
  growthSharePercent: 0,
  regionSharePercent: 31,
  source: { namn: "SCB:s företagsregister och Bolagsverket", hämtad: "2026-10-04" },
  competitors: [
    { name: "Ett AB", description: "Redovisning." },
    { name: "Två AB", description: "Bokföring." },
  ],
  basis: { medianRevenueCompanies: 0, growthCompanies: 0, regionCompanies: 800 },
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("saveMarketEvidence (Server Action)", () => {
  it("hämtar siffrorna själv och sparar antal och konkurrenter, utan bolagsnamn", async () => {
    const { saveMarketEvidence } = await import("./actions");
    getMarketOverviewMock.mockResolvedValue(overview);
    recordRegistryEvidenceMock.mockResolvedValue({ total: 30, delta: 6 });

    expect(await saveMarketEvidence(" 69.201 ")).toEqual({ ok: true, total: 30, delta: 6 });
    expect(getMarketOverviewMock).toHaveBeenCalledWith("sv", "69.201");
    const [items] = recordRegistryEvidenceMock.mock.calls[0];
    expect(items).toEqual([
      {
        kind: "registerMarketCount",
        subjectRef: "sni:69201:antal",
        source: overview.source,
        quote: "812 verksamma aktiebolag med SNI 69.201 som huvudbransch",
        stepNumber: 3,
      },
      {
        kind: "registerCompetitorSet",
        subjectRef: "sni:69201:konkurrenter",
        source: overview.source,
        quote: "2 konkurrenter med SNI 69.201 som huvudbransch, med beskrivning från Bolagsverket",
        stepNumber: 4,
      },
    ]);
    expect(JSON.stringify(items)).not.toMatch(/Ett AB|Två AB/);
    expect(revalidatePathMock).toHaveBeenCalledWith("/app", "layout");
  });

  it("utan konkurrenter sparas bara antalet, och utan något sparas inget", async () => {
    const { saveMarketEvidence } = await import("./actions");
    getMarketOverviewMock.mockResolvedValue({ ...overview, competitors: [] });
    recordRegistryEvidenceMock.mockResolvedValue({ total: 28, delta: 4 });
    await saveMarketEvidence("69.201");
    expect(recordRegistryEvidenceMock.mock.calls[0][0]).toHaveLength(1);

    getMarketOverviewMock.mockResolvedValue({ ...overview, companyCount: 0, competitors: [] });
    expect(await saveMarketEvidence("69.201")).toEqual({ ok: false, reason: "empty" });
    expect(recordRegistryEvidenceMock).toHaveBeenCalledTimes(1);
  });

  it("ogiltig kod, stängd grind, transportfel och saknat projekt ger en orsak, inte en krasch", async () => {
    const { saveMarketEvidence } = await import("./actions");
    expect(await saveMarketEvidence("69201; drop")).toEqual({ ok: false, reason: "invalid" });
    expect(await saveMarketEvidence(42)).toEqual({ ok: false, reason: "invalid" });
    expect(getMarketOverviewMock).not.toHaveBeenCalled();

    getMarketOverviewMock.mockRejectedValueOnce(new RegistryLockedError());
    expect(await saveMarketEvidence("69.201")).toEqual({ ok: false, reason: "closed" });
    getMarketOverviewMock.mockRejectedValueOnce(new RegistryTransportError("SCB: HTTP 503."));
    expect(await saveMarketEvidence("69.201")).toEqual({ ok: false, reason: "failed" });

    getMarketOverviewMock.mockResolvedValue(overview);
    recordRegistryEvidenceMock.mockRejectedValue(new EmptyStateError("Evidens och poäng", "docs"));
    expect(await saveMarketEvidence("69.201")).toEqual({ ok: false, reason: "noProject" });
    expect(recordRegistryEvidenceMock).toHaveBeenCalledTimes(1);
  });
});

describe("vakt: registerbevisen", () => {
  // recordRegistryEvidence skriver systembevis med service role och litar på
  // att anroparen hämtat siffrorna själv. Den här Server Action är den enda
  // som får anropa den (säkerhetsgranskningen 2026-10-04).
  it("recordRegistryEvidence anropas bara från marknadens Server Action", () => {
    const callers = sourceFiles()
      .filter((file) => !/\.test\.tsx?$/.test(file.path))
      .filter((file) => file.text.includes("recordRegistryEvidence"))
      .map((file) => file.path)
      .sort();
    expect(callers).toEqual(["adapters/live/EvidenceRecorder.ts", "app/(app)/app/marknad/actions.ts"]);
  });
});
