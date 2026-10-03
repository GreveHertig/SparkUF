import { describe, expect, it } from "vitest";
import { stockholmDayStartIso } from "./stockholmDay";

describe("stockholmDayStartIso", () => {
  it("vintertid: midnatt i Stockholm är 23:00 UTC dagen före", () => {
    expect(stockholmDayStartIso(new Date("2026-01-15T12:00:00Z"))).toBe("2026-01-14T23:00:00.000Z");
  });

  it("sommartid: midnatt i Stockholm är 22:00 UTC dagen före", () => {
    expect(stockholmDayStartIso(new Date("2026-07-15T12:00:00Z"))).toBe("2026-07-14T22:00:00.000Z");
  });

  it("strax efter midnatt i Stockholm räknas till den nya dagen", () => {
    expect(stockholmDayStartIso(new Date("2026-10-02T22:30:00Z"))).toBe("2026-10-02T22:00:00.000Z");
  });

  it("strax före midnatt i Stockholm räknas till den gamla dagen", () => {
    expect(stockholmDayStartIso(new Date("2026-10-02T21:30:00Z"))).toBe("2026-10-01T22:00:00.000Z");
  });

  it("dagen då sommartiden börjar: midnatt låg på vintertid", () => {
    expect(stockholmDayStartIso(new Date("2026-03-29T12:00:00Z"))).toBe("2026-03-28T23:00:00.000Z");
  });

  it("dagen då sommartiden slutar: midnatt låg på sommartid", () => {
    expect(stockholmDayStartIso(new Date("2026-10-25T12:00:00Z"))).toBe("2026-10-24T22:00:00.000Z");
  });
});
