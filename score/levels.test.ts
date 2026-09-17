import { describe, expect, it } from "vitest";
import { getScoreLevel } from "./levels";

describe("getScoreLevel", () => {
  it("mappar varje tröskel i avsnitt 7.5 till rätt nivå", () => {
    expect(getScoreLevel(1).key).toBe("unproven");
    expect(getScoreLevel(29).key).toBe("unproven");
    expect(getScoreLevel(30).key).toBe("underbuiltUnproven");
    expect(getScoreLevel(49).key).toBe("underbuiltUnproven");
    expect(getScoreLevel(50).key).toBe("demandConfirmed");
    expect(getScoreLevel(69).key).toBe("demandConfirmed");
    expect(getScoreLevel(70).key).toBe("builtAndLaunched");
    expect(getScoreLevel(84).key).toBe("builtAndLaunched");
    expect(getScoreLevel(85).key).toBe("provenBusiness");
    expect(getScoreLevel(100).key).toBe("provenBusiness");
  });

  it("klamrar aldrig till 0 — minsta poäng är 1", () => {
    expect(getScoreLevel(0).key).toBe("unproven");
    expect(getScoreLevel(-5).key).toBe("unproven");
  });

  it("klamrar värden över 100", () => {
    expect(getScoreLevel(140).key).toBe("provenBusiness");
  });
});
