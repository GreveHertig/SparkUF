import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { NotImplementedError } from "@/core/errors";
import type { IdeaScreening } from "@/ports/ProjectRepository";
import type { OnboardingScript } from "@/ports/ProfileRepository";

// Onboardingen i /app (PR 11, docs/plan-en-design.md): samma skärmar som
// /demo/start, med liveadaptrarna. Stubbar ger "Kommer snart" per sektion,
// aldrig demots data.

const requireUserMock = vi.hoisted(() => vi.fn().mockResolvedValue({ id: "u1", email: "sara@example.com" }));
vi.mock("@/lib/server/session", () => ({ requireUser: requireUserMock }));

// redirect() i Next kastar; här kastas ett igenkännbart fel med målet.
const redirectMock = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
);
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

const getIdeaScreeningMock = vi.hoisted(() => vi.fn());
const getProjectMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/ProjectRepository", () => ({
  liveProjectRepository: { getIdeaScreening: getIdeaScreeningMock, getProject: getProjectMock },
}));

const getOnboardingScriptMock = vi.hoisted(() => vi.fn());
const getOnboardingStatusMock = vi.hoisted(() => vi.fn());
const getOnboardingAnswersMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/ProfileRepository", () => ({
  liveProfileRepository: {
    getOnboardingScript: getOnboardingScriptMock,
    getOnboardingStatus: getOnboardingStatusMock,
    getOnboardingAnswers: getOnboardingAnswersMock,
  },
}));

const PROJECT = { id: "p1", name: "Min idé", oneLiner: "En rad." };

beforeEach(() => {
  getOnboardingStatusMock.mockResolvedValue({ entry: null, completed: false });
  getOnboardingAnswersMock.mockResolvedValue({});
  getProjectMock.mockResolvedValue(PROJECT);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const screening: IdeaScreening = {
  originalIdea: "Min idé.",
  assumptions: [{ text: "Ett antagande.", testableNow: true }],
  registerFacts: [{ label: "Bolag i branschen", value: "120", source: { namn: "Bolagsverket", hämtad: "2026-09-01" } }],
  weakness: "Det svaga.",
  sharperIdea: { name: "Skarpare", oneLiner: "En rad.", why: "Därför." },
};

const script: OnboardingScript = {
  questions: [{ id: "q1", cofounderText: "Vad gör du idag?", suggestedAnswer: "Jag studerar." }],
  closingMessage: "Tack.",
};

function renderTree(tree: React.ReactNode) {
  return render(<LocaleProvider>{tree}</LocaleProvider>);
}

describe("/start (PR 11)", () => {
  it("layouten kräver inloggning och visar varken demorad eller fiktionsmärke", async () => {
    const { default: StartLayout } = await import("./layout");
    renderTree(await StartLayout({ children: <p>innehåll</p> }));
    expect(requireUserMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("innehåll")).toBeInTheDocument();
    expect(screen.queryByText(sv.site.demo.badge)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Logga ut/ })).toBeInTheDocument();
  });

  it("en färdig onboarding skickas till /app", async () => {
    getOnboardingStatusMock.mockResolvedValue({ entry: "noIdea", completed: true });
    const { default: StartLayout } = await import("./layout");
    await expect(StartLayout({ children: null })).rejects.toThrow("REDIRECT /app");
  });

  it("utan session nås aldrig onboardingstatusen (ingen loop)", async () => {
    requireUserMock.mockRejectedValueOnce(new Error("REDIRECT /logga-in"));
    const { default: StartLayout } = await import("./layout");
    await expect(StartLayout({ children: null })).rejects.toThrow("REDIRECT /logga-in");
    expect(getOnboardingStatusMock).not.toHaveBeenCalled();
  });

  it("ett äkta fel i sessionen kastas vidare", async () => {
    requireUserMock.mockRejectedValueOnce(new Error("ingen session"));
    const { default: StartLayout } = await import("./layout");
    await expect(StartLayout({ children: null })).rejects.toThrow("ingen session");
  });

  it("ingångarna länkar under /start", async () => {
    const { default: StartPage } = await import("./page");
    renderTree(StartPage());
    expect(screen.getByRole("link", { name: /Jag har ingen idé än/ })).toHaveAttribute("href", "/start/profil");
    expect(screen.getByRole("link", { name: /Jag har redan en idé/ })).toHaveAttribute("href", "/start/ide");
  });

  it("/start/ide: stubbad adapter ger Kommer snart i varje sektion", async () => {
    getIdeaScreeningMock.mockRejectedValue(new NotImplementedError("Projekt", "docs/moduler/projekt-och-ide.md"));
    const { default: StartIdeaPage } = await import("./ide/page");
    renderTree(await StartIdeaPage());
    expect(screen.getByRole("heading", { level: 1, name: sv.onboarding.idea.title })).toBeInTheDocument();
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(5);
  });

  it("/start/ide: visar adapterns genomlysning", async () => {
    getIdeaScreeningMock.mockResolvedValue(screening);
    const { default: StartIdeaPage } = await import("./ide/page");
    renderTree(await StartIdeaPage());
    expect(screen.getByText("Bolag i branschen")).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("/start/ide: ett äkta fel kastas vidare", async () => {
    getIdeaScreeningMock.mockRejectedValue(new Error("databasen svarar inte"));
    const { default: StartIdeaPage } = await import("./ide/page");
    await expect(StartIdeaPage()).rejects.toThrow("databasen svarar inte");
  });

  it("/start/ide: utan projekt visas idéformuläret, inte genomlysningen", async () => {
    getProjectMock.mockResolvedValue(null);
    const { default: StartIdeaPage } = await import("./ide/page");
    renderTree(await StartIdeaPage());
    expect(screen.getByLabelText(sv.onboarding.idea.nameLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(sv.onboarding.idea.oneLinerLabel)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: sv.onboarding.idea.submitCta })).toBeInTheDocument();
    expect(getIdeaScreeningMock).not.toHaveBeenCalled();
  });

  it("/start/profil: ingången härleds ur projektet (B med projekt, A utan)", async () => {
    getOnboardingScriptMock.mockResolvedValue(script);
    const { default: StartProfilePage } = await import("./profil/page");
    await StartProfilePage();
    expect(getOnboardingScriptMock).toHaveBeenLastCalledWith("hasIdea", "sv");
    getProjectMock.mockResolvedValue(null);
    await StartProfilePage();
    expect(getOnboardingScriptMock).toHaveBeenLastCalledWith("noIdea", "sv");
  });

  it("/start/profil: kärnfrågorna en i taget med val, inga färdiga svar", async () => {
    getProjectMock.mockResolvedValue(null);
    const { liveProfileRepository: real } = await vi.importActual<typeof import("@/adapters/live/ProfileRepository")>(
      "@/adapters/live/ProfileRepository",
    );
    getOnboardingScriptMock.mockImplementation((entry, locale) => real.getOnboardingScript(entry, locale));
    const { default: StartProfilePage } = await import("./profil/page");
    renderTree(await StartProfilePage());
    expect(screen.getByText(sv.onboarding.profile.formSubtitle)).toBeInTheDocument();
    expect(screen.getByText("Fråga 1 av 4")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: sv.onboarding.v4Questions.noIdea.situation })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: sv.onboarding.v4Questions.choices.situation.employed })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("/start/profil: fortsätter med de sparade svaren, och med kärnfrågorna besvarade visas startkortet", async () => {
    getProjectMock.mockResolvedValue(null);
    const { liveProfileRepository: real } = await vi.importActual<typeof import("@/adapters/live/ProfileRepository")>(
      "@/adapters/live/ProfileRepository",
    );
    getOnboardingScriptMock.mockImplementation((entry, locale) => real.getOnboardingScript(entry, locale));
    getOnboardingAnswersMock.mockResolvedValue({ situation: "employed", time: "h3to6", money: "none", soldB2b: "no" });
    const { default: StartProfilePage } = await import("./profil/page");
    renderTree(await StartProfilePage());
    expect(screen.getByRole("heading", { name: sv.onboarding.startFrame.titleNoIdea })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: sv.onboarding.startFrame.continueCta })).toBeInTheDocument();
  });

  it("/start/profil: stubbad adapter ger Kommer snart i samtalet och profilen", async () => {
    getOnboardingScriptMock.mockRejectedValue(new NotImplementedError("Profil", "docs/moduler/profil.md"));
    const { default: StartProfilePage } = await import("./profil/page");
    renderTree(await StartProfilePage());
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(2);
  });

  it("/start/profil: utan körd migrering (svaren går inte att läsa) visas Kommer snart, inte ett samtal som inte kan sparas", async () => {
    getOnboardingScriptMock.mockResolvedValue(script);
    getOnboardingAnswersMock.mockRejectedValue(new NotImplementedError("Profil (onboarding v4)", "docs/moduler/profil.md"));
    const { default: StartProfilePage } = await import("./profil/page");
    renderTree(await StartProfilePage());
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(2);
    expect(screen.queryByText("Vad gör du idag?")).not.toBeInTheDocument();
  });

  it("/start/profil: ett äkta fel kastas vidare", async () => {
    getOnboardingScriptMock.mockResolvedValue(script);
    getOnboardingAnswersMock.mockRejectedValue(new Error("databasen svarar inte"));
    const { default: StartProfilePage } = await import("./profil/page");
    await expect(StartProfilePage()).rejects.toThrow("databasen svarar inte");
  });

  it("importerar inget ur demot", () => {
    for (const file of ["layout.tsx", "page.tsx", "ide/page.tsx", "profil/page.tsx", "actions.ts", "_lib/entry.ts"]) {
      expect(readFileSync(join(__dirname, file), "utf8")).not.toMatch(/adapters\/demo|app\/demo/);
    }
  });
});
