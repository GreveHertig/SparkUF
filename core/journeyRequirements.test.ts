import { describe, expect, it } from "vitest";
import { stepCompletion, STEP_REQUIREMENTS, type CountedEvidenceRef } from "./journeyRequirements";
import { scorePhaseForCompletedSteps } from "./journey";
import { ALL_PART_IDS, PHASE_TOTAL_CAP, PHASE_UNLOCKED_PARTS, UNLOCK_STEP } from "./score";
import { FIT_QUESTION_IDS, fitSubjectRef } from "./fitQuestions";
import { EVIDENCE_KINDS } from "./evidenceKinds";

const allFit: CountedEvidenceRef[] = FIT_QUESTION_IDS.map((id) => ({ kind: "profileFitAnswer", subjectRef: fitSubjectRef(id) }));
const steps = (n: number) => Array.from({ length: n }, (_, index) => index + 1);

function check(stepNumber: number, completed: number[], evidence: CountedEvidenceRef[] = [], hasActiveProject = true) {
  return stepCompletion({ stepNumber, completedStepNumbers: completed, countedEvidence: evidence, hasActiveProject });
}

describe("stepCompletion: regler", () => {
  it("ett klart steg är klart", () => {
    expect(check(1, [1]).status).toBe("done");
  });

  it("föregående steg måste vara klart", () => {
    expect(check(3, [1]).status).toBe("previousNotDone");
    expect(check(11, steps(9)).status).toBe("previousNotDone");
  });

  it("steg 01 kräver alla fyra passformsfrågor, och bara de fyra", () => {
    expect(check(1, [], allFit.slice(0, 3))).toEqual({ status: "missing", missing: ["fit_money"], progress: [] });
    expect(check(1, [], allFit).status).toBe("completable");
    const otherRefs = allFit.map((evidence, index) => ({ ...evidence, subjectRef: `fit:other-${index}` }));
    expect(check(1, [], otherRefs).status).toBe("missing");
  });

  it("steg 02 kräver ett aktivt projekt", () => {
    expect(check(2, [1], [], true).status).toBe("completable");
    expect(check(2, [1], [], false)).toEqual({ status: "missing", missing: ["activeProject"], progress: [] });
  });

  it("steg 05 kräver en grupp per del, och vilket bevis som helst i gruppen räcker", () => {
    expect(check(5, steps(4), [{ kind: "customerProblemRejected", subjectRef: "a" }])).toEqual({
      status: "missing",
      missing: ["willingnessToPay"],
      progress: [],
    });
    expect(
      check(5, steps(4), [
        { kind: "customerProblemRejected", subjectRef: "a" },
        { kind: "customerPriceDeclined", subjectRef: "b" },
      ]).status,
    ).toBe("completable");
  });

  it("varje steg har ett krav", () => {
    for (const step of steps(12)) expect(check(step, steps(step - 1)).status, `steg ${step}`).not.toBe("noRequirementYet");
  });

  describe("steg 06: minst fem kundsvar från minst tre bolag", () => {
    const answer = (kind: CountedEvidenceRef["kind"], company: string): CountedEvidenceRef => ({ kind, subjectRef: company });
    const four = [
      answer("customerProblemConfirmed", "a"),
      answer("customerPriceAccepted", "a"),
      answer("customerProblemRejected", "b"),
      answer("customerPriceDeclined", "c"),
    ];

    it("fyra svar från tre bolag räcker inte, och framsteget visas", () => {
      expect(check(6, steps(5), four)).toEqual({
        status: "missing",
        missing: ["verdictAnswers"],
        progress: [{ group: "verdictAnswers", count: 4, minCount: 5, subjects: 3, minSubjects: 3 }],
      });
    });

    it("fem svar från två bolag räcker inte", () => {
      const twoCompanies = [...four.slice(0, 3), answer("customerPriceDeclined", "b"), answer("customerProblemConfirmed", "b")];
      expect(check(6, steps(5), twoCompanies)).toMatchObject({
        status: "missing",
        progress: [{ count: 5, subjects: 2 }],
      });
    });

    it("fem svar från tre bolag räcker, motsägande svar räknas med", () => {
      expect(check(6, steps(5), [...four, answer("customerProblemRejected", "c")]).status).toBe("completable");
    });

    it("andra sorter räknas inte", () => {
      const other = [...four, answer("payingCustomer", "d"), answer("priceDecided", "price")];
      expect(check(6, steps(5), other).status).toBe("missing");
    });
  });

  it("steg 07 kräver ett beslutat pris, inte ett godtaget", () => {
    expect(check(7, steps(6), [{ kind: "customerPriceAccepted", subjectRef: "a" }])).toEqual({
      status: "missing",
      missing: ["priceDecided"],
      progress: [],
    });
    expect(check(7, steps(6), [{ kind: "priceDecided", subjectRef: "price" }]).status).toBe("completable");
  });

  it("steg 12 kräver en inskickad ansökan till en finansiär", () => {
    expect(check(12, steps(11)).status).toBe("missing");
    expect(check(12, steps(11), [{ kind: "fundingApplied", subjectRef: "Almi 2026-123" }]).status).toBe("completable");
  });

  it("varje krav pekar på en sort som finns", () => {
    for (const requirements of Object.values(STEP_REQUIREMENTS)) {
      for (const requirement of requirements ?? []) {
        if ("evidenceKind" in requirement) expect(EVIDENCE_KINDS).toHaveProperty(requirement.evidenceKind);
      }
    }
  });
});

// Del 3 i uppgiften 2026-10-01: "Låses upp efter steg N" (UNLOCK_STEP) ska
// stämma med fasen, som räknas ur högsta avklarade steg. Förut stod 08 för
// Produkt och 09 för Genomförbarhet, fast båda låses upp efter steg 07.
describe("UNLOCK_STEP stämmer med fasen", () => {
  it.each(ALL_PART_IDS)("%s är låst före sitt steg och upplåst exakt när det är klart", (partId) => {
    const step = UNLOCK_STEP[partId];
    expect(PHASE_UNLOCKED_PARTS[scorePhaseForCompletedSteps(steps(step))]).toContain(partId);
    // Passform och preliminär Marknad är upplåsta redan från start (7.3) och
    // visas aldrig som låsta, så de har inget "före".
    if (!PHASE_UNLOCKED_PARTS.discover.includes(partId)) expect(PHASE_UNLOCKED_PARTS[scorePhaseForCompletedSteps(steps(step - 1))]).not.toContain(partId);
  });

  it("taket följer med: efter steg 03 är taket över 18", () => {
    expect(PHASE_TOTAL_CAP[scorePhaseForCompletedSteps(steps(2))]).toBe(18);
    expect(PHASE_TOTAL_CAP[scorePhaseForCompletedSteps(steps(3))]).toBeGreaterThan(18);
  });
});
