import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import type { DataKind } from "@/core/domain";
import type { ProfileSummary } from "@/ports/MemoryRepository";
import { Memory, type MemoryData } from "./Memory";

afterEach(() => cleanup());

const profile: ProfileSummary = {
  entry: "noIdea",
  name: "Alva Ek",
  role: "22 år, Umeå",
  bio: "Läser ekonomi.",
  time: "10 timmar i veckan",
  money: "5 000 kr",
  risk: "Låg",
};

function renderMemory(
  overrides: Partial<MemoryData> = {},
  { dataKind = "live" as DataKind, onSave = vi.fn() } = {},
) {
  const data: MemoryData = {
    profile,
    brainNotes: "Mina tankar",
    trace: [{ id: "1", timestampIso: "2026-09-30T08:15:00.000Z", description: "Idé vald" }],
    ...overrides,
  };
  render(
    <LocaleProvider>
      <Memory data={data} dataKind={dataKind} onSaveBrainNotes={onSave} />
    </LocaleProvider>,
  );
  return { onSave };
}

function openTab(name: string) {
  fireEvent.mouseDown(screen.getByRole("tab", { name }), { button: 0 });
}

describe("Memory (skärmen, PR 5)", () => {
  it("visar profilen i rubriken och i Profilen-fliken", () => {
    renderMemory();
    expect(screen.getByRole("heading", { level: 1, name: "Alva Ek, 22 år, Umeå" })).toBeInTheDocument();
    expect(screen.getByText("10 timmar i veckan")).toBeInTheDocument();
  });

  it("visar varje besvarad fråga med frågetexten från onboardingen och svaret", () => {
    renderMemory();
    const questions = sv.onboarding.profileQuestions.noIdea;
    for (const [question, answer] of [
      [questions.role, profile.role],
      [questions.bio, profile.bio],
      [questions.time, profile.time],
      [questions.money, profile.money],
      [questions.risk, profile.risk],
    ]) {
      expect(screen.getByText(question!).closest("li")).toHaveTextContent(answer!);
    }
    expect(screen.queryByText(sv.memoryPage.notAnswered)).not.toBeInTheDocument();
  });

  it("ingång B: B:s frågetexter, och bio och risk som luckor som aldrig fylls i", () => {
    const hasIdea: ProfileSummary = { ...profile, entry: "hasIdea", bio: null, risk: null };
    renderMemory({ profile: hasIdea });
    const b = sv.onboarding.profileQuestions.hasIdea;
    const a = sv.onboarding.profileQuestions.noIdea;
    expect(screen.getByText(b.role).closest("li")).toHaveTextContent(profile.role!);
    expect(screen.getByText(b.time).closest("li")).toHaveTextContent(profile.time!);
    expect(screen.getByText(b.money).closest("li")).toHaveTextContent(profile.money!);
    expect(screen.getByText(a.bio).closest("li")).toHaveTextContent(sv.memoryPage.notAnswered);
    expect(screen.getByText(a.risk).closest("li")).toHaveTextContent(sv.memoryPage.notAnswered);
    expect(screen.getAllByText(sv.memoryPage.notAnswered)).toHaveLength(2);
    // Ingen ingress när bio saknas, och inget påhittat i dess ställe.
    expect(screen.queryByText(profile.bio!)).not.toBeInTheDocument();
  });

  it("de nyare frågorna: visas när källan skickar fältet, med svar eller lucka", () => {
    const a = sv.onboarding.profileQuestions.noIdea;
    const b = sv.onboarding.profileQuestions.hasIdea;
    renderMemory({ profile: { ...profile, frustrations: "Kvitton som försvinner.", customer: null } });
    expect(screen.getByText(a.frustrations).closest("li")).toHaveTextContent("Kvitton som försvinner.");
    // Ingång A ställer inte kundfrågan: B:s formulering, som en lucka.
    expect(screen.getByText(b.customer).closest("li")).toHaveTextContent(sv.memoryPage.notAnswered);
    cleanup();
    renderMemory({ profile: { ...profile, entry: "hasIdea", customer: "Små redovisningsbyråer", frustrations: null } });
    expect(screen.getByText(b.customer).closest("li")).toHaveTextContent("Små redovisningsbyråer");
  });

  it("de nyare frågorna visas inte alls när källan inte skickar fälten (demot)", () => {
    renderMemory();
    expect(screen.queryByText(sv.onboarding.profileQuestions.noIdea.frustrations)).not.toBeInTheDocument();
    expect(screen.queryByText(sv.onboarding.profileQuestions.hasIdea.customer)).not.toBeInTheDocument();
    expect(screen.queryByText(sv.memoryPage.notAnswered)).not.toBeInTheDocument();
  });

  it("utan namn: rollen ensam i rubriken, utan ett ensamt kommatecken", () => {
    renderMemory({ profile: { ...profile, name: null } });
    expect(screen.getByRole("heading", { level: 1, name: "22 år, Umeå" })).toBeInTheDocument();
  });

  it("utan profil: sidans namn som rubrik och Kommer snart bara i Profilen, Hjärnan och Spåret syns ändå", () => {
    renderMemory({ profile: null });
    expect(screen.getByRole("heading", { level: 1, name: sv.memoryPage.title })).toBeInTheDocument();
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(1);
    openTab(sv.memoryPage.tabs.brain);
    expect(screen.getByDisplayValue("Mina tankar")).toBeInTheDocument();
    openTab(sv.memoryPage.tabs.trace);
    expect(screen.getByText("Idé vald")).toBeInTheDocument();
  });

  it("Hjärnans ledtråd nämner Sara bara i demot", () => {
    renderMemory({}, { dataKind: "example" });
    openTab(sv.memoryPage.tabs.brain);
    expect(screen.getByText(sv.memoryPage.brainHint)).toBeInTheDocument();
    cleanup();
    renderMemory({}, { dataKind: "live" });
    openTab(sv.memoryPage.tabs.brain);
    expect(screen.getByText(sv.memoryPage.brainHintLive)).toBeInTheDocument();
    expect(screen.queryByText(sv.memoryPage.brainHint)).not.toBeInTheDocument();
  });

  it("sparar Hjärnan när fältet lämnas, och säger till om det misslyckas", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("nej"));
    renderMemory({}, { onSave });
    openTab(sv.memoryPage.tabs.brain);
    const field = screen.getByDisplayValue("Mina tankar");
    fireEvent.change(field, { target: { value: "Nya tankar" } });
    await act(async () => {
      fireEvent.blur(field);
    });
    expect(onSave).toHaveBeenCalledWith("Nya tankar");
    expect(screen.getByRole("alert")).toHaveTextContent(sv.memoryPage.brainSaveFailed);
  });

  it("Spåret visar liveadapterns hela tidsstämplar som datum, och ett ärligt tomläge", () => {
    renderMemory();
    openTab(sv.memoryPage.tabs.trace);
    expect(screen.getByText("30 september")).toBeInTheDocument();
    cleanup();
    renderMemory({ trace: [] });
    openTab(sv.memoryPage.tabs.trace);
    expect(screen.getByText(sv.memoryPage.traceEmpty)).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("Hjärnan och Spåret visar Kommer snart var för sig när deras data saknas", () => {
    renderMemory({ brainNotes: null, trace: null });
    openTab(sv.memoryPage.tabs.brain);
    expect(screen.getByText(sv.comingSoon.title)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    openTab(sv.memoryPage.tabs.trace);
    expect(screen.getByText(sv.comingSoon.title)).toBeInTheDocument();
  });
});
