import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import type { DataKind } from "@/core/domain";
import { Memory, type MemoryData } from "./Memory";

afterEach(() => cleanup());

const profile = {
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
