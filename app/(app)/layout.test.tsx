import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { EmptyStateError, NotImplementedError } from "@/core/errors";
import type { JourneyStepView } from "@/ports/JourneyRepository";

vi.mock("next/navigation", () => ({ usePathname: () => "/app" }));

const requireUserMock = vi.hoisted(() => vi.fn().mockResolvedValue({ id: "u1", email: "sara@example.com" }));
vi.mock("@/lib/server/session", () => ({ requireUser: requireUserMock }));

const getProfileMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/ProfileRepository", () => ({
  liveProfileRepository: { getProfile: getProfileMock },
}));

const getStepsMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/JourneyRepository", () => ({
  liveJourneyRepository: { getSteps: getStepsMock },
}));

const getScoreSnapshotMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/EvidenceRepository", () => ({
  liveEvidenceRepository: { getScoreSnapshot: getScoreSnapshotMock },
}));

const EVIDENCE_DOC = "docs/moduler/evidens-och-poang.md";

beforeEach(() => {
  getScoreSnapshotMock.mockRejectedValue(new EmptyStateError("Evidens och poäng", EVIDENCE_DOC));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/** `LiveAppShellLayout` är en async Server Component — anropas direkt som en
 * funktion (Next-mönster) och det returnerade elementträdet renderas sedan
 * med testing-library, precis som en klientkomponent. */
async function renderLayout(children: ReactNode = <p>sidans innehåll</p>) {
  const { default: LiveAppShellLayout } = await import("./layout");
  const tree = await LiveAppShellLayout({ children });
  return render(<LocaleProvider>{tree}</LocaleProvider>);
}

describe("/app-skalet (PR 2)", () => {
  it("visar en neutral platshållarprofil när liveadaptrarna fortfarande är stubbar", async () => {
    getProfileMock.mockRejectedValue(new NotImplementedError("Profil", "docs/moduler/profil.md"));
    getStepsMock.mockRejectedValue(new NotImplementedError("Resan", "docs/moduler/resan.md"));

    await renderLayout();

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.queryByText(sv.site.demo.badge)).not.toBeInTheDocument();
    expect(screen.getByText("sidans innehåll")).toBeVisible();
  });

  it("visar profilen och det pågående steget när liveadaptrarna har data", async () => {
    getProfileMock.mockResolvedValue({ name: "Sara Lindqvist", initials: "SL" });
    const steps: JourneyStepView[] = [
      {
        stepNumber: 3,
        journeyPhase: "discover",
        title: "Marknaden",
        oneLiner: "",
        maxPoints: 12,
        status: "current",
      },
    ];
    getStepsMock.mockResolvedValue(steps);

    await renderLayout();

    expect(screen.getByTitle("Sara Lindqvist")).toBeVisible();
    const stepPill = screen.getByText(/Steg 03 av 1/);
    expect(stepPill.textContent).toContain("Marknaden");
  });

  it("flikarna länkar till /app-sidorna, Pulsen också (PR 11, steg 6)", async () => {
    getProfileMock.mockRejectedValue(new NotImplementedError("Profil", "docs/moduler/profil.md"));
    getStepsMock.mockRejectedValue(new NotImplementedError("Resan", "docs/moduler/resan.md"));

    await renderLayout();

    const nav = screen.getByRole("navigation", { name: sv.appShell.navMenuLabel });
    expect(nav.querySelectorAll("a")).toHaveLength(11);
    expect(nav.querySelectorAll(".fdd-tab--disabled")).toHaveLength(0);
    expect(screen.getByRole("link", { name: sv.appShell.nav.businessPlan })).toHaveAttribute("href", "/app/affarsplan");
    expect(screen.getByRole("link", { name: sv.appShell.nav.cofounder })).toHaveAttribute("href", "/app/medgrundaren");
    expect(screen.getByRole("link", { name: sv.appShell.nav.pulse })).toHaveAttribute("href", "/app/pulsen");
  });

  it("sidhuvudet visar poängen från liveadaptern som en liten siffra, länkad till Poäng (PR 4)", async () => {
    getProfileMock.mockRejectedValue(new NotImplementedError("Profil", "docs/moduler/profil.md"));
    getStepsMock.mockRejectedValue(new NotImplementedError("Resan", "docs/moduler/resan.md"));
    getScoreSnapshotMock.mockResolvedValue({ total: 43 });

    await renderLayout();

    const link = screen.getByRole("link", { name: /^Poäng 43/ });
    expect(link).toHaveAttribute("href", "/app/poang");
  });

  it("utan poäng visar sidhuvudet luckan, aldrig en nolla (PR 4)", async () => {
    getProfileMock.mockRejectedValue(new NotImplementedError("Profil", "docs/moduler/profil.md"));
    getStepsMock.mockRejectedValue(new NotImplementedError("Resan", "docs/moduler/resan.md"));

    await renderLayout();

    const link = screen.getByRole("link", { name: new RegExp(sv.appShell.headerScoreMissing) });
    expect(link.textContent).toContain("—");
    expect(link.textContent).not.toMatch(/\d/);
  });

  it("ett riktigt fel i poängen sväljs inte", async () => {
    getProfileMock.mockResolvedValue({ name: "Sara Lindqvist", initials: "SL" });
    getStepsMock.mockResolvedValue([]);
    getScoreSnapshotMock.mockRejectedValue(new Error("Poänghistoriken svarar inte"));

    await expect(renderLayout()).rejects.toThrow("Poänghistoriken svarar inte");
  });

  it("ett riktigt fel sväljs inte", async () => {
    getProfileMock.mockRejectedValue(new Error("Databasen svarar inte"));
    getStepsMock.mockResolvedValue([]);

    await expect(renderLayout()).rejects.toThrow("Databasen svarar inte");
  });
});
