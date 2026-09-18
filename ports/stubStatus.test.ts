import { describe, expect, it } from "vitest";
import { NotImplementedError } from "@/core/errors";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { liveProjectRepository } from "@/adapters/live/ProjectRepository";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { liveEvidenceRepository } from "@/adapters/live/EvidenceRepository";
import { liveMemoryRepository } from "@/adapters/live/MemoryRepository";
import { liveCofounderAgent } from "@/adapters/live/CofounderAgent";
import { liveRegistryProvider } from "@/adapters/live/RegistryProvider";
import { liveResearchProvider } from "@/adapters/live/ResearchProvider";
import { livePulseProvider } from "@/adapters/live/PulseProvider";
import { liveSimulationProvider } from "@/adapters/live/SimulationProvider";
import { liveOutreachProvider } from "@/adapters/live/OutreachProvider";
import { liveBuildProvider } from "@/adapters/live/BuildProvider";

/**
 * Vakt, inte kontrakt: de 11 moduler som enligt docs/moduler/*.md fortfarande
 * har status "stub" ska fortsätta kasta NotImplementedError. Så fort en
 * modulsession bygger en av dem klart går den här listan sönder av sig
 * själv — ta bort raden HÄR bara samtidigt som du sätter status "klar" i
 * docs/moduler/<modul>.md och docs/status.md (docs/bygga-en-modul.md).
 * Juridisk koll är redan byggd och står därför inte i listan.
 */
const STILL_STUBS: { module: string; call: () => Promise<unknown> }[] = [
  { module: "Resan", call: () => liveJourneyRepository.getHomeSummary("sv") },
  { module: "Evidens och poäng", call: () => liveEvidenceRepository.getScoreSnapshot("sv") },
  { module: "Minnet", call: () => liveMemoryRepository.getBrainNotes() },
  { module: "Medgrundaren", call: () => liveCofounderAgent.sendMessage("hej", [], "sv") },
  { module: "Registret", call: () => liveRegistryProvider.getMarketOverview("sv") },
  { module: "Webbresearch", call: () => liveResearchProvider.search("test") },
  { module: "Pulsen", call: () => livePulseProvider.getTodaysSignal("sv") },
  { module: "Simuleringar", call: () => liveSimulationProvider.simulate("test", "sv") },
  { module: "Utskick och svar", call: () => liveOutreachProvider.getStatuses() },
  { module: "Bygg", call: () => liveBuildProvider.getStatus() },
];

describe("Stub-vakt: obyggda liveadaptrar kastar fortfarande NotImplementedError", () => {
  it.each(STILL_STUBS)("$module", async ({ call }) => {
    await expect(call()).rejects.toBeInstanceOf(NotImplementedError);
  });
});

/**
 * Session P1:s dokumenterade blinda fläck (docs/status.md, Session P2):
 * `contractIt` kan skilja "hela modulen är en stub" från "en enskild metod i
 * en annars byggd adapter kastar av misstag" — MEN bara om det fångas här
 * också. Profil och Projekt och idé är nu "påbörjade" (getProfile/getProject
 * är klara), men de två metoderna nedan är MEDVETET kvar som stubbar
 * (olösta designbeslut, se docs/moduler/profil.md och
 * docs/moduler/projekt-och-ide.md) — inte bortglömda.
 */
const PARTIELLA_STUBBAR: { module: string; metod: string; call: () => Promise<unknown> }[] = [
  {
    module: "Profil",
    metod: "getOnboardingScript",
    call: () => liveProfileRepository.getOnboardingScript("noIdea", "sv"),
  },
  {
    module: "Projekt och idé",
    metod: "getIdeaScreening",
    call: () => liveProjectRepository.getIdeaScreening("sv"),
  },
];

describe("Stub-vakt: enstaka metoder i annars klara liveadaptrar kastar fortfarande NotImplementedError", () => {
  it.each(PARTIELLA_STUBBAR)("$module.$metod", async ({ call }) => {
    await expect(call()).rejects.toBeInstanceOf(NotImplementedError);
  });
});
