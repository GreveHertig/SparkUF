import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { NotImplementedError } from "@/core/errors";
import type { CofounderContext } from "@/adapters/live/cofounderContext";

const getRecentMessagesMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/CofounderConversation", () => ({
  liveCofounderConversation: { getRecentMessages: getRecentMessagesMock },
}));
const loadContextMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/cofounderContext", () => ({ loadCofounderContext: loadContextMock }));
const sendMessageMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/CofounderAgent", () => ({
  liveCofounderAgent: { sendMessage: sendMessageMock },
}));

const getSignalsMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/PulseProvider", () => ({ livePulseProvider: { getSignals: getSignalsMock } }));

const emptyContext: CofounderContext = { step: null, profile: null, brainNotes: null, trace: null, project: null };

beforeEach(() => {
  getRecentMessagesMock.mockResolvedValue([]);
  loadContextMock.mockResolvedValue({
    ...emptyContext,
    step: { number: 2, title: "Möjligheter", oneLiner: "Idéer.", why: "", doneItems: [] },
    profile: { role: "Konsult", time: "10 timmar i veckan" },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function renderPage() {
  const { default: LiveCofounderPage } = await import("./page");
  const tree = await LiveCofounderPage();
  render(<LocaleProvider>{tree}</LocaleProvider>);
  return tree;
}

describe("/app/medgrundaren (version 1)", () => {
  it("visar det aktuella steget, ett aktivt promptfält och tomläget för ett nytt samtal", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: sv.cofounderPage.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "02 · Möjligheter" })).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeEnabled();
    expect(screen.getByText(sv.cofounderPage.live.emptyBody)).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    expect(screen.queryByText(sv.cofounderPage.emptyStateBody)).not.toBeInTheDocument();
  });

  it("visar det sparade samtalet", async () => {
    getRecentMessagesMock.mockResolvedValue([
      { role: "founder", text: "Var börjar jag?" },
      { role: "cofounder", text: "Ring tre kunder." },
    ]);
    await renderPage();
    expect(getRecentMessagesMock).toHaveBeenCalledWith(40);
    expect(screen.getByText("Var börjar jag?")).toBeInTheDocument();
    expect(screen.getByText("Ring tre kunder.")).toBeInTheDocument();
  });

  it("Sedan tidigare visar det som är känt, och en siffra får grundarens egen källa", async () => {
    await renderPage();
    const aside = screen.getByRole("complementary");
    expect(within(aside).getByText(`${sv.cofounderPage.known.role}: Konsult`)).toBeInTheDocument();
    const timeItem = within(aside).getByText(/10 timmar i veckan/).closest("li")!;
    expect(within(timeItem).getByText(sv.common.userSourceLabel)).toBeInTheDocument();
    expect(within(timeItem).getByText("Profilsamtalet")).toBeInTheDocument();
  });

  it("utan något känt döljs Sedan tidigare", async () => {
    loadContextMock.mockResolvedValue(emptyContext);
    await renderPage();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("utan tabell (migreringen inte körd) visas Kommer snart och fältet är avstängt", async () => {
    getRecentMessagesMock.mockRejectedValue(new NotImplementedError("Medgrundaren (samtalet)", "docs"));
    await renderPage();
    expect(screen.getByText(sv.comingSoon.title)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("ett riktigt fel kastas vidare, aldrig tyst till Kommer snart", async () => {
    getRecentMessagesMock.mockRejectedValue(new Error("nätverk"));
    const { default: LiveCofounderPage } = await import("./page");
    await expect(LiveCofounderPage()).rejects.toThrow("nätverk");
  });

  it("anropar inte modellen när sidan visas och importerar inget ur demot", async () => {
    await renderPage();
    expect(sendMessageMock).not.toHaveBeenCalled();
    const source = readFileSync(join(__dirname, "page.tsx"), "utf8");
    expect(source).not.toMatch(/adapters\/demo/);
  });

  it("den enda funktionen som skickas till skärmen är server action", async () => {
    const tree = await renderPage();
    const props = (tree as { props: Record<string, unknown> }).props;
    expect(typeof props.data).toBe("object");
    const { sendCofounderMessage } = await import("./actions");
    expect((props.live as { onSend: unknown }).onSend).toBe(sendCofounderMessage);
  });
  it("från en spelbok i Pulsen: grundarens egen signal förifyller frågan, inget skickas", async () => {
    const id = "00000000-0000-4000-8000-000000000009";
    getSignalsMock.mockResolvedValue([
      {
        id,
        category: "Möjlighet",
        headline: "Nytt bidrag till laddboxar",
        whyItMatters: "",
        timestamp: "",
        source: { namn: "energimyndigheten.se", hämtad: "2026-10-03" },
      },
    ]);
    const { default: LiveCofounderPage } = await import("./page");
    render(<LocaleProvider>{await LiveCofounderPage({ searchParams: Promise.resolve({ signal: id }) })}</LocaleProvider>);
    expect(screen.getByRole("textbox")).toHaveValue(
      'Jag läste nyheten "Nytt bidrag till laddboxar" (energimyndigheten.se, 3 oktober). Vad betyder den för min idé, och vad borde jag göra först?',
    );
    expect(sendMessageMock).not.toHaveBeenCalled();
  });

  it("ett id som inte är ett uuid, eller en okänd signal, ger ett tomt fält", async () => {
    const { default: LiveCofounderPage } = await import("./page");
    render(
      <LocaleProvider>{await LiveCofounderPage({ searchParams: Promise.resolve({ signal: "1 or 1=1" }) })}</LocaleProvider>,
    );
    expect(getSignalsMock).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveValue("");

    cleanup();
    getSignalsMock.mockResolvedValue([]);
    render(
      <LocaleProvider>
        {await LiveCofounderPage({ searchParams: Promise.resolve({ signal: "00000000-0000-4000-8000-000000000010" }) })}
      </LocaleProvider>,
    );
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
});
