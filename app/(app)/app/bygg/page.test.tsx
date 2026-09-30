import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { NotImplementedError } from "@/core/errors";
import type { ByggBrief } from "@/core/domain";
import type { JourneyStepView } from "@/ports/JourneyRepository";

const getStepsMock = vi.hoisted(() => vi.fn());
const getStatusMock = vi.hoisted(() => vi.fn());
const getSpecMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/JourneyRepository", () => ({ liveJourneyRepository: { getSteps: getStepsMock } }));
vi.mock("@/adapters/live/BuildProvider", () => ({
  liveBuildProvider: { getStatus: getStatusMock, getSpec: getSpecMock, startBuild: vi.fn() },
}));

const stub = () => new NotImplementedError("Bygg", "docs/moduler/bygg.md");

function stepsWithStep7(status: JourneyStepView["status"]): JourneyStepView[] {
  return [{ stepNumber: 7, journeyPhase: "launch", title: "Erbjudandet", oneLiner: "", maxPoints: 8, status }];
}

const spec: ByggBrief = {
  sammanfattning: "Riktig spec.",
  målgrupp: "Byråer.",
  sidor: ["Start"],
  ton: "Sakligt.",
  underlag: [{ påstående: "Ett belagt påstående.", källa: { namn: "Kundsamtal", hämtad: "2026-02-01" } }],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function renderPage() {
  const { default: LiveBuildPage } = await import("./page");
  const tree = await LiveBuildPage();
  render(<LocaleProvider>{tree}</LocaleProvider>);
  return tree;
}

describe("/app/bygg (PR 10)", () => {
  it("låst tills steg 07 är klart, utan anrop till Bygg", async () => {
    getStepsMock.mockResolvedValue(stepsWithStep7("current"));
    await renderPage();
    expect(screen.getByText(`${sv.homePage.unlocksAfterStepBefore} 07`)).toBeInTheDocument();
    expect(getStatusMock).not.toHaveBeenCalled();
    expect(getSpecMock).not.toHaveBeenCalled();
  });

  it("stubbarna ger Kommer snart i status och i specen, var för sig", async () => {
    getStepsMock.mockResolvedValue(stepsWithStep7("done"));
    getStatusMock.mockRejectedValue(stub());
    getSpecMock.mockRejectedValue(stub());
    await renderPage();
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(2);
    expect(screen.getByText(sv.common.conceptBadge)).toBeInTheDocument();
  });

  it("portens null för specen ger tomläget, inte Kommer snart", async () => {
    getStepsMock.mockResolvedValue(stepsWithStep7("done"));
    getStatusMock.mockResolvedValue({ status: "not_started" });
    getSpecMock.mockResolvedValue(null);
    await renderPage();
    expect(screen.getByText(sv.buildPage.specEmpty)).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("en riktig spec visas med sitt underlag", async () => {
    getStepsMock.mockResolvedValue(stepsWithStep7("done"));
    getStatusMock.mockResolvedValue({ status: "building", creditsUsed: 3 });
    getSpecMock.mockResolvedValue(spec);
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Riktig spec." })).toBeInTheDocument();
    expect(screen.getByText("Ett belagt påstående.")).toBeInTheDocument();
  });

  it("credits från porten visas utan exempelkälla (PR 11: exempel bara i demot)", async () => {
    getStepsMock.mockResolvedValue(stepsWithStep7("done"));
    getStatusMock.mockResolvedValue({ status: "building", creditsUsed: 12 });
    getSpecMock.mockResolvedValue(spec);
    await renderPage();
    expect(screen.getByText(new RegExp(`${sv.buildPage.creditsUsedLabel}: 12`))).toBeInTheDocument();
    expect(screen.queryByText(sv.common.exampleSourceLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(/Påhittad data/)).not.toBeInTheDocument();
  });

  it("okända steg ger inget låst läge; sektionerna visar sina luckor", async () => {
    getStepsMock.mockRejectedValue(new NotImplementedError("Resan", "docs/moduler/resan.md"));
    getStatusMock.mockRejectedValue(stub());
    getSpecMock.mockRejectedValue(stub());
    await renderPage();
    expect(screen.queryByText(new RegExp(sv.homePage.unlocksAfterStepBefore))).not.toBeInTheDocument();
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(2);
  });

  it("ett äkta fel kastas vidare", async () => {
    getStepsMock.mockResolvedValue(stepsWithStep7("done"));
    getStatusMock.mockRejectedValue(new Error("nätverket"));
    getSpecMock.mockResolvedValue(null);
    await expect(renderPage()).rejects.toThrow("nätverket");
  });

  it("skickar inga funktioner till klientskärmen och importerar inget ur demot", async () => {
    getStepsMock.mockResolvedValue(stepsWithStep7("current"));
    const tree = await renderPage();
    const functionProps = Object.entries(tree.props as Record<string, unknown>).filter(([, v]) => typeof v === "function");
    expect(functionProps).toEqual([]);
    expect(readFileSync(join(__dirname, "page.tsx"), "utf8")).not.toMatch(/adapters\/demo/);
  });
});
