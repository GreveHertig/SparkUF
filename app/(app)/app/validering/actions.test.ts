import { afterEach, describe, expect, it, vi } from "vitest";
import { EmptyStateError, NotImplementedError, ValidationLogError } from "@/core/errors";

const addContactMock = vi.hoisted(() => vi.fn());
const markContactedMock = vi.hoisted(() => vi.fn());
const markDeclinedMock = vi.hoisted(() => vi.fn());
const saveAnswerMock = vi.hoisted(() => vi.fn());
const removeContactMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/ValidationLog", () => ({
  liveValidationLog: {
    addContact: addContactMock,
    markContacted: markContactedMock,
    markDeclined: markDeclinedMock,
    saveAnswer: saveAnswerMock,
    removeContact: removeContactMock,
  },
}));

const recordEvidenceMock = vi.hoisted(() => vi.fn());
const listEvidenceMock = vi.hoisted(() => vi.fn());
const retractEvidenceMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/EvidenceRecorder", () => ({
  liveEvidenceRecorder: {
    recordEvidence: recordEvidenceMock,
    listEvidence: listEvidenceMock,
    retractEvidence: retractEvidenceMock,
  },
  EvidenceInputError: class EvidenceInputError extends Error {},
}));
vi.mock("@/adapters/live/evidenceScore", () => ({ stockholmToday: () => "2026-10-04" }));
const revalidatePathMock = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const ID = "00000000-0000-4000-8000-000000000001";
const answer = {
  respondedOnIso: "2026-10-02",
  sizeClass: "tenToNineteen",
  problemStance: "confirms",
  priceStance: "declines",
  priceTestedKr: 990,
  counterOfferKr: 500,
  quote: "  Vi lägger flera timmar i veckan på det här.  ",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("addValidationContact och pasteValidationContacts", () => {
  it("lägger till ett rensat bolag och förnyar sidan", async () => {
    const { addValidationContact } = await import("./actions");
    addContactMock.mockResolvedValue({});
    expect(await addValidationContact(" Kvittly​ AB ", "fiveToNine")).toEqual({ ok: true });
    expect(addContactMock).toHaveBeenCalledWith({ companyName: "Kvittly AB", sizeClass: "fiveToNine" });
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/validering");
  });

  it("vägrar tomt namn och okänd storlek utan att nå adaptern, och översätter dubbletter", async () => {
    const { addValidationContact } = await import("./actions");
    expect(await addValidationContact("  ", null)).toEqual({ ok: false, reason: "invalid" });
    expect(await addValidationContact("Bolag AB", "huge")).toEqual({ ok: false, reason: "invalid" });
    expect(addContactMock).not.toHaveBeenCalled();
    addContactMock.mockRejectedValue(new ValidationLogError("duplicate"));
    expect(await addValidationContact("Bolag AB", null)).toEqual({ ok: false, reason: "duplicate" });
  });

  it("utan tabell eller projekt blir det 'unavailable', inte en krasch", async () => {
    const { addValidationContact } = await import("./actions");
    addContactMock.mockRejectedValue(new NotImplementedError("Valideringen", "docs/moduler/validering.md"));
    expect(await addValidationContact("Bolag AB", null)).toEqual({ ok: false, reason: "unavailable" });
  });

  it("en inklistrad lista läggs till rad för rad, och dubbletter räknas som överhoppade", async () => {
    const { pasteValidationContacts } = await import("./actions");
    addContactMock
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new ValidationLogError("duplicate"))
      .mockResolvedValueOnce({});
    expect(await pasteValidationContacts("Ett AB\n\nTvå AB\r\nTre AB")).toEqual({ ok: true, added: 2, skipped: 1 });
    expect(addContactMock).toHaveBeenCalledTimes(3);
  });

  it("en lista med fler än 30 bolag nekas utan att något sparas", async () => {
    const { pasteValidationContacts } = await import("./actions");
    const many = Array.from({ length: 31 }, (_, i) => `Bolag ${i}`).join("\n");
    expect(await pasteValidationContacts(many)).toEqual({ ok: false, reason: "limit" });
    expect(addContactMock).not.toHaveBeenCalled();
  });
});

describe("markValidationContacted", () => {
  it("vägrar okänd kanal och datum i framtiden", async () => {
    const { markValidationContacted } = await import("./actions");
    expect(await markValidationContacted(ID, "fax", "2026-10-01")).toEqual({ ok: false, reason: "invalid" });
    expect(await markValidationContacted(ID, "phone", "2026-10-05")).toEqual({ ok: false, reason: "invalid" });
    expect(markContactedMock).not.toHaveBeenCalled();
    expect(await markValidationContacted(ID, "phone", "2026-10-04")).toEqual({ ok: true });
  });
});

describe("logValidationAnswer", () => {
  it("sparar svaret och skriver ett problem- och ett prisbevis med bolaget som källa", async () => {
    const { logValidationAnswer } = await import("./actions");
    saveAnswerMock.mockResolvedValue({ companyName: "Kvittly AB" });
    recordEvidenceMock
      .mockResolvedValueOnce({ status: "recorded", evidenceId: "e1", snapshot: { total: 20, delta: 2 } })
      .mockResolvedValueOnce({ status: "recorded", evidenceId: "e2", snapshot: { total: 21, delta: 1 } });

    expect(await logValidationAnswer(ID, "phone", answer)).toEqual({ ok: true, scored: true, total: 21, delta: 3 });
    expect(saveAnswerMock).toHaveBeenCalledWith(ID, "phone", expect.objectContaining({ quote: "Vi lägger flera timmar i veckan på det här." }));
    const source = { namn: "Kvittly AB", hämtad: "2026-10-02" };
    expect(recordEvidenceMock).toHaveBeenNthCalledWith(
      1,
      { kind: "customerProblemConfirmed", subjectRef: "bolag:kvittly ab", source, quote: "Vi lägger flera timmar i veckan på det här.", stepNumber: 5 },
      "sv",
    );
    expect(recordEvidenceMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ kind: "customerPriceDeclined" }), "sv");
    expect(revalidatePathMock).toHaveBeenCalledWith("/app", "layout");
  });

  it("'vet inte' om priset återkallar ett tidigare prisbevis från samma bolag", async () => {
    const { logValidationAnswer } = await import("./actions");
    saveAnswerMock.mockResolvedValue({ companyName: "Kvittly AB" });
    recordEvidenceMock.mockResolvedValue({ status: "replaced", evidenceId: "e3", snapshot: { total: 20, delta: 0 } });
    listEvidenceMock.mockResolvedValue([
      { id: "p1", subjectRef: "bolag:kvittly ab", canRetract: true, status: "counted" },
      { id: "p2", subjectRef: "bolag:annat ab", canRetract: true, status: "counted" },
    ]);
    retractEvidenceMock.mockResolvedValue({ total: 18, delta: -2 });

    expect(await logValidationAnswer(ID, "phone", { ...answer, priceStance: "undecided" })).toEqual({
      ok: true,
      scored: true,
      total: 18,
      delta: -2,
    });
    expect(retractEvidenceMock).toHaveBeenCalledTimes(1);
    expect(retractEvidenceMock).toHaveBeenCalledWith("p1", expect.stringMatching(/priset/), "sv");
  });

  it("vägrar ett ofullständigt svar utan att nå adaptern eller bevisen", async () => {
    const { logValidationAnswer } = await import("./actions");
    expect(await logValidationAnswer(ID, "phone", { ...answer, quote: "Ja" })).toEqual({ ok: false, reason: "invalid" });
    expect(await logValidationAnswer(ID, "phone", { ...answer, respondedOnIso: "2026-10-09" })).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(saveAnswerMock).not.toHaveBeenCalled();
    expect(recordEvidenceMock).not.toHaveBeenCalled();
  });

  it("står svaret kvar när bevisen inte går att skriva", async () => {
    const { logValidationAnswer } = await import("./actions");
    saveAnswerMock.mockResolvedValue({ companyName: "Kvittly AB" });
    recordEvidenceMock.mockRejectedValue(new EmptyStateError("Evidens och poäng", "docs"));
    expect(await logValidationAnswer(ID, "phone", answer)).toEqual({ ok: true, scored: false });
  });

  it("ett bolag som inte finns ger ett fel utan bevis", async () => {
    const { logValidationAnswer } = await import("./actions");
    saveAnswerMock.mockRejectedValue(new ValidationLogError("invalid"));
    expect(await logValidationAnswer(ID, "phone", answer)).toEqual({ ok: false, reason: "invalid" });
    expect(recordEvidenceMock).not.toHaveBeenCalled();
  });
});
