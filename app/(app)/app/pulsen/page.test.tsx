import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { EmptyStateError, NotImplementedError } from "@/core/errors";
import type { PulseSignal } from "@/core/domain";

const getSignalsMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/PulseProvider", () => ({
  livePulseProvider: { getSignals: getSignalsMock },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/** Async Server Component — anropas som en funktion, trädet renderas sedan. */
async function renderPage() {
  const { default: LiveAppPulsePage } = await import("./page");
  const tree = await LiveAppPulsePage();
  return render(<LocaleProvider>{tree}</LocaleProvider>);
}

const signal: PulseSignal = {
  category: "Nyheter",
  headline: "Kvittohantering blir krav för småföretag",
  whyItMatters: "Påverkar efterfrågan på din tjänst.",
  timestamp: "",
  source: { namn: "exempel.se", hämtad: "2026-09-30", url: "https://exempel.se/artikel" },
};

describe("/app/pulsen (steg 6)", () => {
  it("visar liveadapterns signaler med rubrik och källa", async () => {
    getSignalsMock.mockResolvedValue([signal]);

    await renderPage();

    expect(getSignalsMock).toHaveBeenCalledWith("sv");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(signal.headline);
    expect(screen.getByText(/exempel\.se/)).toBeInTheDocument();
    // Riktig data får inget fiktionsmärke och ingen exempelkälla (PR 11).
    expect(screen.queryByText(sv.site.demo.badge)).not.toBeInTheDocument();
    expect(screen.queryByText(sv.common.exampleSourceLabel)).not.toBeInTheDocument();
  });

  it("visar tomläget när det inte finns några signaler (t.ex. inget aktivt projekt)", async () => {
    getSignalsMock.mockResolvedValue([]);

    await renderPage();

    expect(screen.getByText(sv.pulsePage.emptyState)).toBeInTheDocument();
  });

  it.each([
    ["stubbe", new NotImplementedError("Pulsen", "docs/moduler/webbresearch-och-pulsen.md")],
    ["tomt konto", new EmptyStateError("Pulsen", "docs/moduler/webbresearch-och-pulsen.md")],
  ])("visar Kommer snart för en platshållare (%s)", async (_label, error) => {
    getSignalsMock.mockRejectedValue(error);

    await renderPage();

    expect(screen.getByText(sv.comingSoon.title)).toBeInTheDocument();
  });

  it("ett riktigt fel sväljs inte", async () => {
    getSignalsMock.mockRejectedValue(new Error("Tavily-nyckel saknas"));

    await expect(renderPage()).rejects.toThrow("Tavily-nyckel saknas");
  });
});
