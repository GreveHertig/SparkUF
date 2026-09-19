import { describe, it, expect, beforeEach } from "vitest";
import { useDemoStore } from "./demoStore";
import { demoProfileRepository } from "./ProfileRepository";
import { demoJourneyRepository } from "./JourneyRepository";
import { demoEvidenceRepository } from "./EvidenceRepository";
import { demoMemoryRepository } from "./MemoryRepository";
import { saraProfile } from "./sara";
import { jonasProfile } from "./jonas";

// Bugg fixad den här sessionen (docs/status.md): ingång B laddade tidigare
// alltid Saras data i /demo/app. De här testerna bevisar att `entry`
// (adapters/demo/demoStore.ts) faktiskt styr vilken persona demoadaptrarna
// returnerar — inte bara att skärmarna kan RENDERA Jonas data (det testas
// indirekt via adapters/demo/jonas.ts's egen kalibrering).
describe("Ingångsmedvetna demoadaptrar (avsnitt 2.1)", () => {
  beforeEach(() => {
    useDemoStore.getState().reset();
  });

  it("ProfileRepository.getProfile returnerar Jonas i ingång B, Sara i ingång A", async () => {
    expect(await demoProfileRepository.getProfile()).toEqual(saraProfile);

    useDemoStore.getState().setEntry("hasIdea");
    expect(await demoProfileRepository.getProfile()).toEqual(jonasProfile);

    useDemoStore.getState().setEntry("noIdea");
    expect(await demoProfileRepository.getProfile()).toEqual(saraProfile);
  });

  it("byte av ingång nollställer beatIndex", () => {
    useDemoStore.getState().goTo(5);
    expect(useDemoStore.getState().beatIndex).toBe(5);

    useDemoStore.getState().setEntry("hasIdea");
    expect(useDemoStore.getState().beatIndex).toBe(0);
  });

  it("JourneyRepository.getSteps returnerar Jonas 12 steg i ingång B", async () => {
    useDemoStore.getState().setEntry("hasIdea");
    const steps = await demoJourneyRepository.getSteps("sv");
    expect(steps).toHaveLength(12);
    expect(steps[1].title).toBe("Genomlysningen");
  });

  it("EvidenceRepository.getScoreSnapshot träffar Jonas målpoäng (9.4) i ingång B", async () => {
    useDemoStore.getState().setEntry("hasIdea");
    useDemoStore.getState().goTo(0);
    expect((await demoEvidenceRepository.getScoreSnapshot("sv")).total).toBe(5);

    useDemoStore.getState().goTo(1);
    expect((await demoEvidenceRepository.getScoreSnapshot("sv")).total).toBe(12);

    // Pivoten i steg 06 (index 5 = "06a-pivot"): poängen sjunker till 38.
    useDemoStore.getState().goTo(5);
    expect((await demoEvidenceRepository.getScoreSnapshot("sv")).total).toBe(38);

    // Sista beatet (index 12 = "12-kapital"): målpoängen 89.
    useDemoStore.getState().goTo(12);
    expect((await demoEvidenceRepository.getScoreSnapshot("sv")).total).toBe(89);
  });

  it("MemoryRepository.getProfileSummary visar Jonas bakgrund i ingång B", async () => {
    useDemoStore.getState().setEntry("hasIdea");
    const summary = await demoMemoryRepository.getProfileSummary("sv");
    expect(summary.name).toBe("Jonas Berg");
  });
});
