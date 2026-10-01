import { describe, expect, it } from "vitest";
import type { RegistryCompany } from "@/ports/RegistryProvider";
import { dominantBucket, employeeSpan, sizeDistribution } from "./market";

const company = (employees: number): RegistryCompany => ({
  name: `Bolag ${employees}`,
  sniCode: "69.201",
  employees,
  revenueKsek: 1000,
  county: "",
});

describe("market", () => {
  it("räknar bolag per storleksklass", () => {
    const distribution = sizeDistribution([company(3), company(6), company(8), company(12)]);
    expect(distribution.map((bucket) => bucket.count)).toEqual([1, 2, 1, 0, 0]);
  });

  it("ger den vanligaste klassen med andel, och null utan bolag", () => {
    const companies = [company(6), company(8), company(12)];
    expect(dominantBucket(sizeDistribution(companies), companies.length)).toEqual({
      key: "fiveToNine",
      count: 2,
      percent: 67,
    });
    expect(dominantBucket(sizeDistribution([]), 0)).toBeNull();
  });

  it("ger spannet av anställda, och null utan bolag", () => {
    expect(employeeSpan([company(5), company(19)])).toEqual({ min: 5, max: 19 });
    expect(employeeSpan([])).toBeNull();
  });
});
