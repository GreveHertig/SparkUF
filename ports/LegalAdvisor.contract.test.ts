import { describe, it, expect } from "vitest";
import type { LegalAdvisor } from "./LegalAdvisor";
import { demoLegalAdvisor } from "@/adapters/demo/LegalAdvisor";

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
// liveLegalAdvisor läggs till här när Claude Code byggt den nedan.