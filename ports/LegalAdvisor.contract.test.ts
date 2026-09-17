import { describe, it, expect, vi } from "vitest";
import type { LegalAdvisor } from "./LegalAdvisor";
import { demoLegalAdvisor } from "@/adapters/demo/LegalAdvisor";
import { liveLegalAdvisor } from "@/adapters/live/LegalAdvisor";

// Kontraktstestet ska köra utan nätverk/API-nyckel i CI. liveLegalAdvisors
// egen logik (val av ämnen, injicering av kuraterad källa, validering) är
// det som avgör om kontraktet hålls — Gemini-anropet mockas därför bort med
// ett fingerat svar. Ämnes-id:na nedan är ett fast, litet urval som gäller
// för aktiebolag (se adapters/live/legalSources.ts) — de djupare fallen
// (ogiltig bolagsform, smugglad källa, trasig JSON, m.m.) täcks separat i
// adapters/live/LegalAdvisor.test.ts. vi.mock hoisas ovanför importer, så
// factoryn refererar medvetet inga importerade variabler, bara literaler.
vi.mock("@/lib/server/gemini", () => ({
  generateJson: vi.fn(async () =>
    JSON.stringify({
      krav: [
        {
          topicId: "registrering",
          rubrik: "Registrera företaget",
          beskrivning: "Registrera aktiebolaget hos Bolagsverket och skydda företagsnamnet.",
          tillamplighet: "applicable",
        },
        {
          topicId: "f_skatt",
          rubrik: "Ansök om F-skatt",
          beskrivning: "Ansök om F-skatt hos Skatteverket innan verksamheten startar.",
          tillamplighet: "applicable",
        },
      ],
    }),
  ),
}));

function legalAdvisorContractTests(name: string, advisor: LegalAdvisor) {
  describe(`LegalAdvisor-kontrakt: ${name}`, () => {
    it("returnerar en array", async () => {
      const result = await advisor.getLegalMap("aktiebolag");
      expect(Array.isArray(result)).toBe(true);
    });

    it("varje krav har en ifylld källa (Datalöftet)", async () => {
      const result = await advisor.getLegalMap("aktiebolag");
      for (const krav of result) {
        expect(krav.källa.namn).toBeTruthy();
        expect(krav.källa.hämtad).toBeTruthy();
      }
    });
  });
}

legalAdvisorContractTests("demo", demoLegalAdvisor);
legalAdvisorContractTests("live (mockad Gemini)", liveLegalAdvisor);