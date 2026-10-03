import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegistryLockedError, RegistryTransportError } from "@/core/errors";

// Marknadsbilden när SCB:s hela bolagslista inte är byggd (lib/server/scb.ts):
// bara antalet, med källa och länk, resten luckor. Det räcker för steg 03.
const assertAllowed = vi.fn();
const fetchCompanyCount = vi.fn();
const searchIndustries = vi.fn();
const fetchIndustryName = vi.fn();
class ScbListingUnavailableError extends Error {}
vi.mock("@/lib/server/registryAccess", () => ({ assertRegistryAccessAllowed: () => assertAllowed() }));
vi.mock("@/lib/server/scb", () => ({
  fetchCompanies: async () => {
    throw new ScbListingUnavailableError();
  },
  fetchCompanyCount: (sni: string) => fetchCompanyCount(sni),
  searchIndustries: (text: string) => searchIndustries(text),
  fetchIndustryName: (sni: string) => fetchIndustryName(sni),
  fromAfrSni: (code: string) => `${code.slice(0, 2)}.${code.slice(2)}`,
  ScbListingUnavailableError,
  SCB_REGISTER_INFO_URL: "https://www.scb.se/vara-tjanster/foretagsregistret/",
}));
vi.mock("@/lib/server/bolagsverket", () => ({ fetchAnnualFigures: vi.fn() }));

const { liveRegistryProvider, searchLiveIndustries, getLiveIndustryName } = await import("./RegistryProvider");

beforeEach(() => {
  vi.clearAllMocks();
  assertAllowed.mockResolvedValue(undefined);
});

describe("getMarketOverview utan bolagslistan", () => {
  it("ger SCB:s antal med källa och länk; allt annat är luckor, aldrig gissningar", async () => {
    fetchCompanyCount.mockResolvedValue(4210);
    const overview = await liveRegistryProvider.getMarketOverview("sv", "43.210");
    expect(fetchCompanyCount).toHaveBeenCalledWith("43.210");
    expect(overview).toMatchObject({
      companyCount: 4210,
      competitors: [],
      basis: { medianRevenueCompanies: 0, growthCompanies: 0, regionCompanies: 0 },
      source: { namn: "SCB:s företagsregister", url: "https://www.scb.se/vara-tjanster/foretagsregistret/" },
    });
    expect(overview.source.hämtad).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("utan bransch finns inget att räkna: felet går vidare", async () => {
    await expect(liveRegistryProvider.getMarketOverview("sv")).rejects.toBeInstanceOf(ScbListingUnavailableError);
    expect(fetchCompanyCount).not.toHaveBeenCalled();
  });

  it("ett transportfel från /count går vidare som ett riktigt fel", async () => {
    fetchCompanyCount.mockRejectedValue(new RegistryTransportError("SCB (antal): HTTP 500."));
    await expect(liveRegistryProvider.getMarketOverview("sv", "43.210")).rejects.toBeInstanceOf(RegistryTransportError);
  });
});

describe("branschsökningen bakom licensgrinden", () => {
  it("stängd grind: ingen sökning och inget namn hämtas", async () => {
    assertAllowed.mockRejectedValue(new RegistryLockedError());
    await expect(searchLiveIndustries("el")).rejects.toBeInstanceOf(RegistryLockedError);
    await expect(getLiveIndustryName("43.210")).rejects.toBeInstanceOf(RegistryLockedError);
    expect(searchIndustries).not.toHaveBeenCalled();
    expect(fetchIndustryName).not.toHaveBeenCalled();
  });

  it("träffarna får appens form på koden", async () => {
    searchIndustries.mockResolvedValue([{ code: "43210", name: "Elinstallationer" }]);
    await expect(searchLiveIndustries("elinstall")).resolves.toEqual([{ sniCode: "43.210", name: "Elinstallationer" }]);
  });
});
