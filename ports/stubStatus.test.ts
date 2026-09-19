import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NotImplementedError, RegistryLockedError } from "@/core/errors";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { liveProjectRepository } from "@/adapters/live/ProjectRepository";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
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
  { module: "Medgrundaren", call: () => liveCofounderAgent.sendMessage("hej", [], "sv") },
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
 * också. Profil, Projekt och idé och Resan är alla "påbörjade" (inte
 * "klara") — huvudmetoderna fungerar, men metoden nedan per modul är
 * MEDVETET kvar som stub (olösta designbeslut eller ett beroende på en
 * annan, obyggd modul — se respektive docs/moduler/<modul>.md) — inte
 * bortglömd.
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
  {
    module: "Resan",
    metod: "getHomeSummary",
    call: () => liveJourneyRepository.getHomeSummary("sv"),
  },
];

describe("Stub-vakt: enstaka metoder i annars påbörjade liveadaptrar kastar fortfarande NotImplementedError", () => {
  it.each(PARTIELLA_STUBBAR)("$module.$metod", async ({ call }) => {
    await expect(call()).rejects.toBeInstanceOf(NotImplementedError);
  });
});

/**
 * Licensvakt (docs/moduler/registret.md, "Licensgrind"): Registret är BYGGT men
 * får inte exponeras för någon utom Erik och Theodor förrän licensen för
 * namngivna aktiebolag är Verifierat (docs/dataspiken.md §6 fråga 1). Utan
 * REGISTRY_LIVE_ENABLED och allowlist ska varje metod neka med
 * RegistryLockedError. Går det här testet sönder har grinden tagits bort eller
 * försvagats — lyft den bara i samma commit som dataspiken ändras till Verifierat.
 * (Transporten är oskriven, så ett släppt igenom-anrop skulle ge ett annat fel.)
 */
describe("Licensvakt: Registret nekar utan öppen grind", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    delete process.env.REGISTRY_LIVE_ENABLED;
    delete process.env.REGISTRY_ALLOWED_USER_IDS;
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("searchCompanies", async () => {
    await expect(liveRegistryProvider.searchCompanies({ sniCode: "69.201" })).rejects.toBeInstanceOf(
      RegistryLockedError,
    );
  });
  it("grinden slår indatavalideringen (ogiltig SNI ger ändå RegistryLockedError)", async () => {
    await expect(liveRegistryProvider.searchCompanies({ sniCode: "ogiltig" })).rejects.toBeInstanceOf(
      RegistryLockedError,
    );
  });
  it("getMarketOverview", async () => {
    await expect(liveRegistryProvider.getMarketOverview("sv")).rejects.toBeInstanceOf(RegistryLockedError);
  });
});
