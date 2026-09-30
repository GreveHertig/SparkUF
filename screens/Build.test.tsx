import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import type { ByggBrief } from "@/core/domain";
import { Build, type BuildData, type BuildLock } from "./Build";

afterEach(() => cleanup());

const spec: ByggBrief = {
  sammanfattning: "Kvittojakten: insamling av kvitton.",
  målgrupp: "Byråer med 10–20 anställda.",
  sidor: ["Startsida", "Export"],
  ton: "Sakligt.",
  underlag: [{ påstående: "Ingen bad om OCR.", källa: { namn: "Kundsamtal", hämtad: "2026-01-23" } }],
};

function renderBuild(data: BuildData, locked: BuildLock = null) {
  return render(
    <LocaleProvider>
      <Build data={data} locked={locked} />
    </LocaleProvider>,
  );
}

describe("Build (PR 10)", () => {
  it("visar specen som rubrik, status, credits och underlaget med källa", () => {
    renderBuild({ status: { status: "published", url: "https://x.lovable.app", creditsUsed: 62 }, spec });
    expect(screen.getByRole("heading", { level: 1, name: spec.sammanfattning })).toBeInTheDocument();
    expect(screen.getByText(sv.buildPage.status.published)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `${sv.buildPage.publishedUrlLabel}: https://x.lovable.app` })).toBeInTheDocument();
    expect(screen.getByText(`${sv.buildPage.creditsUsedLabel}: 62`)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: sv.buildPage.previewTitle })).toBeInTheDocument();
    expect(screen.getByText("Ingen bad om OCR.")).toBeInTheDocument();
    expect(screen.getByText(/Kundsamtal/)).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("koncept-etiketten visas alltid, också i låst läge", () => {
    renderBuild({ status: null, spec: null }, { unlocksAfterStep: 7 });
    expect(screen.getByText(sv.common.conceptBadge)).toBeInTheDocument();
    expect(screen.getByText(`${sv.homePage.unlocksAfterStepBefore} 07`)).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("utanför scenariot visas det, inte ett steg", () => {
    renderBuild({ status: null, spec: null }, "notInScenario");
    expect(screen.getByText(sv.homePage.notInThisScenario)).toBeInTheDocument();
  });

  it("platshållare per sektion: saknad status och saknad spec ger var sin Kommer snart", () => {
    renderBuild({ status: null, spec });
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(1);
    expect(screen.getByText("Ingen bad om OCR.")).toBeInTheDocument();
    cleanup();

    renderBuild({ status: { status: "not_started" }, spec: null });
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(1);
    expect(screen.getByText(sv.buildPage.status.not_started)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: sv.buildPage.title })).toBeInTheDocument();
  });

  it("ingen spec än är ett tomläge, inte Kommer snart och inte låst", () => {
    renderBuild({ status: { status: "not_started" }, spec: "none" });
    expect(screen.getByText(sv.buildPage.specEmpty)).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    expect(screen.queryByText(new RegExp(sv.homePage.unlocksAfterStepBefore))).not.toBeInTheDocument();
  });
});
