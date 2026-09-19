import { describe, it, expect, beforeEach } from "vitest";
import { useDemoStore } from "./demoStore";
import { demoProfileRepository } from "./ProfileRepository";
import { demoJourneyRepository } from "./JourneyRepository";
import { demoEvidenceRepository } from "./EvidenceRepository";
import { demoMemoryRepository } from "./MemoryRepository";
import { demoPulseProvider } from "./PulseProvider";
import { demoOutreachProvider } from "./OutreachProvider";
import { demoLegalAdvisor } from "./LegalAdvisor";
import { demoBuildProvider } from "./BuildProvider";
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

  // Session: fem moduler (Pulsen, Kunder, Marknad — se app/demo/app/marknad/
  // page.tsx, Bygg, Juridik) visade fortfarande Saras data i ingång B, se
  // docs/status.md "Session — Jonas hela resan". Ingen av dem har en byggd
  // Jonas-motsvarighet — testerna nedan bevisar att de nu ger ett ärligt
  // tomt svar för Jonas i stället för att läcka Saras Kvittojakten-innehåll,
  // och att Sara är oförändrad.
  it("PulseProvider.getSignals ger Saras signaler i ingång A, tomt i ingång B", async () => {
    const saraSignals = await demoPulseProvider.getSignals("sv");
    expect(saraSignals.length).toBeGreaterThanOrEqual(3);

    useDemoStore.getState().setEntry("hasIdea");
    expect(await demoPulseProvider.getSignals("sv")).toEqual([]);
  });

  // Sista beatet i Saras 38-beats-array (index 37, steg 12) — långt förbi
  // alla dessa portars unlock-steg (4/5/8), så Sara-sidan garanterat har
  // data oavsett hur stegtröskeln skrivs om i framtiden.
  const LAST_SARA_BEAT = 37;

  it("OutreachProvider.getCampaign ger Saras bolag i ingång A, tomt i ingång B", async () => {
    useDemoStore.getState().goTo(LAST_SARA_BEAT);
    const saraRows = await demoOutreachProvider.getCampaign("sv");
    expect(saraRows.length).toBeGreaterThan(0);

    useDemoStore.getState().setEntry("hasIdea");
    useDemoStore.getState().goTo(LAST_SARA_BEAT);
    expect(await demoOutreachProvider.getCampaign("sv")).toEqual([]);
  });

  it("LegalAdvisor.getLegalMap ger Saras krav i ingång A, tomt i ingång B", async () => {
    useDemoStore.getState().goTo(LAST_SARA_BEAT);
    const saraKrav = await demoLegalAdvisor.getLegalMap("enskild_firma");
    expect(saraKrav.length).toBeGreaterThan(0);

    useDemoStore.getState().setEntry("hasIdea");
    useDemoStore.getState().goTo(LAST_SARA_BEAT);
    expect(await demoLegalAdvisor.getLegalMap("enskild_firma")).toEqual([]);
  });

  it("BuildProvider ger Saras spec/status i ingång A, tomt/not_started i ingång B", async () => {
    useDemoStore.getState().goTo(LAST_SARA_BEAT);
    const saraSpec = await demoBuildProvider.getSpec("sv");
    expect(saraSpec).not.toBeNull();
    expect((await demoBuildProvider.getStatus()).status).not.toBe("not_started");

    useDemoStore.getState().setEntry("hasIdea");
    useDemoStore.getState().goTo(LAST_SARA_BEAT);
    expect(await demoBuildProvider.getSpec("sv")).toBeNull();
    expect(await demoBuildProvider.getStatus()).toEqual({ status: "not_started" });
  });
});
