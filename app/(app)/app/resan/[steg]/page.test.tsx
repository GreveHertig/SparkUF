import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { NotImplementedError } from "@/core/errors";
import type { JourneyStepDetail } from "@/ports/JourneyRepository";

const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
vi.mock("next/navigation", () => ({ usePathname: () => "/app/resan/1", notFound: notFoundMock }));

const getStepDetailMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/JourneyRepository", () => ({
  liveJourneyRepository: { getStepDetail: getStepDetailMock },
}));

const getStepCompletionMock = vi.hoisted(() => vi.fn());
const completeStepMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/JourneyProgress", () => ({
  liveJourneyProgress: { getStepCompletion: getStepCompletionMock, completeStep: completeStepMock },
  JourneyStepBlockedError: class JourneyStepBlockedError extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function detail(overrides: Partial<JourneyStepDetail> = {}): JourneyStepDetail {
  return {
    stepNumber: 1,
    journeyPhase: "discover",
    title: "Om dig",
    oneLiner: "Vem du är.",
    maxPoints: 8,
    status: "current",
    why: "Berätta om dig själv.",
    doneItems: [],
    highlights: [],
    actionLabel: "",
    momentKind: "after",
    scoreDelta: null,
    newlyUnlockedParts: [],
    verdict: null,
    simulation: null,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  getStepCompletionMock.mockResolvedValue({ stepNumber: 1, status: "missing", missing: ["onboardingCompleted"], progress: [] });
});

async function renderStep(steg: string) {
  const { default: LiveJourneyStepPage } = await import("./page");
  const tree = await LiveJourneyStepPage({ params: Promise.resolve({ steg }) });
  render(<LocaleProvider>{tree}</LocaleProvider>);
  return tree;
}

describe("/app/resan/[steg] (PR 9)", () => {
  it("visar stegets text ur liveadaptern och länkar tillbaka till /app/resan", async () => {
    getStepDetailMock.mockResolvedValue(detail());
    await renderStep("1");

    expect(getStepDetailMock).toHaveBeenCalledWith(1, "sv");
    expect(screen.getByRole("heading", { level: 1, name: "Om dig" })).toBeInTheDocument();
    expect(screen.getByText("Berätta om dig själv.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(sv.journeyPage.backToJourney) })).toHaveAttribute(
      "href",
      "/app/resan",
    );
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("ett låst steg visar låst läge och inget innehåll", async () => {
    getStepDetailMock.mockResolvedValue(detail({ stepNumber: 5, title: "Utskick", status: "locked", why: "" }));
    await renderStep("5");

    expect(screen.getByText(`${sv.homePage.unlocksAfterStepBefore} 04`)).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("ett olåst steg utan text visar Kommer snart i just den rutan", async () => {
    getStepDetailMock.mockResolvedValue(detail({ why: "" }));
    await renderStep("1");

    expect(screen.getByRole("heading", { level: 2, name: sv.journeyPage.whatsNext })).toBeInTheDocument();
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(1);
  });

  it("steg 06 utan dom visar Kommer snart i domens ruta; andra steg döljer den", async () => {
    getStepDetailMock.mockResolvedValue(detail({ stepNumber: 6, title: "Domen" }));
    await renderStep("6");
    expect(screen.getByRole("heading", { level: 2, name: sv.validationPage.verdictTitle })).toBeInTheDocument();
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(1);
    cleanup();

    getStepDetailMock.mockResolvedValue(detail({ stepNumber: 7, title: "Priset" }));
    await renderStep("7");
    expect(screen.queryByRole("heading", { level: 2, name: sv.validationPage.verdictTitle })).not.toBeInTheDocument();
  });

  it("ett låst steg 06 visar ingen domruta", async () => {
    getStepDetailMock.mockResolvedValue(detail({ stepNumber: 6, title: "Domen", status: "locked", why: "" }));
    await renderStep("6");
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("ett platshållarfel ger stegets nummer och Kommer snart, ingen krasch", async () => {
    getStepDetailMock.mockRejectedValue(new NotImplementedError("Resan", "docs/moduler/resan.md"));
    await renderStep("3");

    expect(screen.getByRole("heading", { level: 1, name: `${sv.journeyPage.stepLabel} 03` })).toBeInTheDocument();
    expect(screen.getByText(sv.comingSoon.title)).toBeInTheDocument();
  });

  it.each(["0", "13", "abc", "1.5", "-1", "100"])("ogiltigt steg %s ger 404 utan anrop", async (steg) => {
    await expect(renderStep(steg)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getStepDetailMock).not.toHaveBeenCalled();
  });

  it("ett äkta fel kastas vidare", async () => {
    getStepDetailMock.mockRejectedValue(new Error("Databasen svarar inte"));
    await expect(renderStep("1")).rejects.toThrow("Databasen svarar inte");
  });

  it("skickar inga funktioner till klientskärmen", async () => {
    getStepDetailMock.mockResolvedValue(detail());
    const tree = await renderStep("1");
    const functionProps = Object.entries(tree.props as Record<string, unknown>).filter(
      ([, value]) => typeof value === "function",
    );
    expect(functionProps).toEqual([]);
  });

  it("visar vad som saknas innan steget kan markeras klart, utan knapp", async () => {
    getStepDetailMock.mockResolvedValue(detail());
    await renderStep("1");
    expect(screen.getByText(sv.stepCompletion.missingTitle)).toBeInTheDocument();
    expect(screen.getByText(sv.stepCompletion.requirements.onboardingCompleted)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: sv.stepCompletion.cta })).not.toBeInTheDocument();
  });

  it("steg 06 visar kravet om fem svar från tre bolag, men inget antal", async () => {
    getStepDetailMock.mockResolvedValue(detail({ stepNumber: 6 }));
    getStepCompletionMock.mockResolvedValue({
      stepNumber: 6,
      status: "missing",
      missing: ["verdictAnswers"],
      progress: [{ group: "verdictAnswers", count: 4, minCount: 5, subjects: 2, minSubjects: 3 }],
    });
    await renderStep("6");
    expect(screen.getByText(sv.stepCompletion.requirements.verdictAnswers)).toBeInTheDocument();
    expect(screen.queryByText(/4 av 5/)).not.toBeInTheDocument();
  });

  it("visar knappen när kraven är uppfyllda, och ett steg utan krav säger det", async () => {
    getStepDetailMock.mockResolvedValue(detail());
    getStepCompletionMock.mockResolvedValue({ stepNumber: 1, status: "completable", missing: [], progress: [] });
    await renderStep("1");
    expect(screen.getByRole("button", { name: sv.stepCompletion.cta })).toBeInTheDocument();
    cleanup();

    getStepDetailMock.mockResolvedValue(detail({ stepNumber: 6 }));
    getStepCompletionMock.mockResolvedValue({ stepNumber: 6, status: "noRequirementYet", missing: [], progress: [] });
    await renderStep("6");
    expect(screen.getByText(sv.stepCompletion.noRequirementYet)).toBeInTheDocument();
  });

  it("ett låst steg visar ingen stegmarkering", async () => {
    getStepDetailMock.mockResolvedValue(detail({ status: "locked" }));
    getStepCompletionMock.mockResolvedValue({ stepNumber: 1, status: "previousNotDone", missing: [], progress: [] });
    await renderStep("1");
    expect(screen.queryByText(sv.stepCompletion.title)).not.toBeInTheDocument();
  });
});

describe("completeJourneyStep (Server Action)", () => {
  it("markerar steget via liveadaptern och ger den nya poängen", async () => {
    const { completeJourneyStep } = await import("./actions");
    completeStepMock.mockResolvedValue({ snapshot: { total: 20 }, phaseBefore: "discover", phaseAfter: "tryBeforeCalls" });
    expect(await completeJourneyStep(3)).toEqual({ ok: true, total: 20 });
    expect(completeStepMock).toHaveBeenCalledWith(3, "sv");
  });

  it("vägrar allt som inte är ett heltal, utan att nå adaptern", async () => {
    const { completeJourneyStep } = await import("./actions");
    expect(await completeJourneyStep("3")).toEqual({ ok: false });
    expect(await completeJourneyStep(2.5)).toEqual({ ok: false });
    expect(completeStepMock).not.toHaveBeenCalled();
  });

  it("ett steg vars krav inte är uppfyllda ger ok: false", async () => {
    const { completeJourneyStep } = await import("./actions");
    const { JourneyStepBlockedError } = await import("@/adapters/live/JourneyProgress");
    completeStepMock.mockRejectedValue(new JourneyStepBlockedError("nej"));
    expect(await completeJourneyStep(3)).toEqual({ ok: false });
  });
});
