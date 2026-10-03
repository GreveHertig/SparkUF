import { describe, expect, it } from "vitest";
import type { ConversationAnswer, ValidationContact } from "@/ports/ValidationLog";
import { computeVerdict } from "@/core/verdict";
import {
  answerWarnings,
  cleanAnswer,
  cleanCompanyName,
  companySubjectRef,
  evidenceKindsForAnswer,
  logStats,
  nextAction,
  step06Progress,
  toVerdictInput,
} from "./validationLog";

const TODAY = "2026-10-04";

const answer = (overrides: Partial<ConversationAnswer> = {}): ConversationAnswer => ({
  respondedOnIso: "2026-10-01",
  sizeClass: "tenToNineteen",
  problemStance: "confirms",
  priceStance: "accepts",
  priceTestedKr: 990,
  counterOfferKr: null,
  quote: "Vi lägger flera timmar i veckan på det här.",
  ...overrides,
});

let n = 0;
const contact = (status: ValidationContact["status"], a: ConversationAnswer | null = null): ValidationContact => {
  n += 1;
  return {
    id: `id-${n}`,
    companyName: `Bolag ${n} AB`,
    sizeClass: a?.sizeClass ?? null,
    channel: status === "planned" ? null : "phone",
    status,
    contactedOnIso: status === "planned" ? null : "2026-09-28",
    answer: status === "responded" ? (a ?? answer()) : null,
    createdAtIso: "2026-09-27T10:00:00Z",
  };
};

describe("cleanCompanyName och companySubjectRef", () => {
  it("rensar dolda tecken och mellanslag, och samma bolag ger samma sak", () => {
    expect(cleanCompanyName("  Kvittly​   AB ")).toBe("Kvittly AB");
    expect(cleanCompanyName("x".repeat(121))).toBe("");
    expect(cleanCompanyName(42)).toBe("");
    expect(companySubjectRef("Kvittly AB")).toBe(companySubjectRef("kvittly  ab"));
    expect(companySubjectRef("Kvittly AB")).toBe("bolag:kvittly ab");
  });
});

describe("cleanAnswer", () => {
  it("godtar ett komplett svar och tar bort motbudet när priset godtogs", () => {
    expect(cleanAnswer(answer({ counterOfferKr: 500 }), TODAY)?.counterOfferKr).toBeNull();
    expect(cleanAnswer(answer({ priceStance: "declines", counterOfferKr: 500 }), TODAY)?.counterOfferKr).toBe(500);
  });

  it("nekar datum i framtiden, påhittade datum, för korta citat och fel pris", () => {
    expect(cleanAnswer(answer({ respondedOnIso: "2026-10-05" }), TODAY)).toBeNull();
    expect(cleanAnswer(answer({ respondedOnIso: "2026-02-30" }), TODAY)).toBeNull();
    expect(cleanAnswer(answer({ quote: "Ja visst" }), TODAY)).toBeNull();
    expect(cleanAnswer(answer({ priceTestedKr: 9.5 }), TODAY)).toBeNull();
    expect(cleanAnswer(answer({ sizeClass: "huge" as never }), TODAY)).toBeNull();
    expect(cleanAnswer(null, TODAY)).toBeNull();
  });
});

describe("evidenceKindsForAnswer", () => {
  it("delvis räknas som bekräftat, avvisar som motsagt, vet inte ger inget prisbevis", () => {
    expect(evidenceKindsForAnswer({ problemStance: "partial", priceStance: "undecided" })).toEqual({
      problem: "customerProblemConfirmed",
      price: null,
    });
    expect(evidenceKindsForAnswer({ problemStance: "rejects", priceStance: "declines" })).toEqual({
      problem: "customerProblemRejected",
      price: "customerPriceDeclined",
    });
    expect(evidenceKindsForAnswer({ problemStance: "confirms", priceStance: "accepts" }).price).toBe("customerPriceAccepted");
  });
});

describe("logStats", () => {
  it("räknar kontaktade utan de planerade, och ger ingen svarsfrekvens utan kontaktade", () => {
    expect(logStats([contact("planned")]).responseRate).toBeNull();
    const stats = logStats([contact("planned"), contact("contacted"), contact("declined"), contact("responded")]);
    expect(stats).toEqual({ contacted: 3, responded: 1, declined: 1, planned: 1, responseRate: 33 });
  });
});

describe("toVerdictInput", () => {
  it("ger Domen svaren med storleksklassens nedre gräns och bolaget som källa", () => {
    const input = toVerdictInput([contact("contacted"), contact("responded", answer({ sizeClass: "fiveToNine" }))], TODAY);
    expect(input.contacted).toBe(2);
    expect(input.responses).toHaveLength(1);
    expect(input.responses[0].employees).toBe(5);
    expect(input.responses[0].source.hämtad).toBe("2026-10-01");
    expect(input.responses[0].source.namn).toMatch(/AB$/);
  });

  it("utesluter svar äldre än 180 dagar (beslut B9)", () => {
    const input = toVerdictInput([contact("responded", answer({ respondedOnIso: "2026-03-01" }))], TODAY);
    expect(input.responses).toEqual([]);
  });

  it("ger en dom som Domen räknar: tre som säger nej till priset bland små bolag ger förfina", () => {
    const contacts = [
      contact("responded", answer({ sizeClass: "tenToNineteen" })),
      contact("responded", answer({ sizeClass: "twentyToFortyNine" })),
      contact("responded", answer({ sizeClass: "tenToNineteen" })),
      contact("responded", answer({ sizeClass: "oneToFour", priceStance: "declines", counterOfferKr: 400 })),
      contact("responded", answer({ sizeClass: "oneToFour", priceStance: "declines", counterOfferKr: 600 })),
    ];
    const verdict = computeVerdict(toVerdictInput(contacts, TODAY));
    expect(verdict.decision).toBe("refine");
    expect(verdict.reasonCodes).toEqual(expect.arrayContaining(["priceTooHigh", "segmentSkew"]));
  });
});

describe("step06Progress", () => {
  it("räknar ett problemsvar och ett prissvar per bolag, som databasen", () => {
    const progress = step06Progress(
      [contact("responded"), contact("responded", answer({ priceStance: "undecided" })), contact("contacted")],
      TODAY,
    );
    expect(progress).toEqual({ answers: 3, companies: 2, minAnswers: 5, minCompanies: 3, reached: false });
  });

  it("tre bolag som tagit ställning till både problem och pris räcker", () => {
    const progress = step06Progress([contact("responded"), contact("responded"), contact("responded")], TODAY);
    expect(progress.reached).toBe(true);
  });
});

describe("nextAction", () => {
  it("leder från en tom lista till kontakter, utskick, fler svar och domen", () => {
    expect(nextAction([], TODAY)).toEqual({ code: "addContacts", missing: 15 });
    expect(nextAction([contact("planned")], TODAY)).toEqual({ code: "reachOut", planned: 1 });
    expect(nextAction([contact("contacted"), contact("responded")], TODAY)).toEqual({ code: "addContacts", missing: 13 });
    const many = Array.from({ length: 15 }, () => contact("contacted"));
    expect(nextAction([...many, contact("responded")], TODAY)).toEqual({ code: "moreAnswers", missing: 4 });
    expect(nextAction(Array.from({ length: 5 }, () => contact("responded")), TODAY)).toEqual({ code: "readVerdict" });
  });
});

describe("answerWarnings", () => {
  it("varnar när alla svar är positiva", () => {
    const all = Array.from({ length: 3 }, () => contact("responded"));
    expect(answerWarnings(all, TODAY)).toContain("allPositive");
  });

  it("varnar när priset inte prövats och när alla är lika stora", () => {
    const undecided = Array.from({ length: 4 }, () => contact("responded", answer({ priceStance: "undecided" })));
    expect(answerWarnings(undecided, TODAY)).toEqual(expect.arrayContaining(["priceNotTested", "oneSize"]));
  });

  it("varnar inte för ett blandat underlag", () => {
    const mixed = [
      contact("responded", answer({ sizeClass: "oneToFour", priceStance: "declines" })),
      contact("responded", answer({ problemStance: "partial" })),
      contact("responded"),
    ];
    expect(answerWarnings(mixed, TODAY)).toEqual([]);
  });
});
