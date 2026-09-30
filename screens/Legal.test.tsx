import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import type { JuridisktKrav } from "@/core/domain";
import { Legal, type BolagsformPicker, type LegalData, type LegalLock } from "./Legal";

afterEach(() => cleanup());

const krav: JuridisktKrav[] = [
  {
    id: "f-skatt",
    rubrik: "Ansök om F-skatt",
    beskrivning: "Krävs innan du fakturerar.",
    gällerFör: ["enskild_firma"],
    källa: { namn: "Skatteverket", hämtad: "2026-09-17", url: "https://www.skatteverket.se" },
    status: "ej_uppfyllt",
  },
  {
    id: "bokforing",
    rubrik: "Bokföringsskyldighet",
    beskrivning: "Från första kronan.",
    gällerFör: ["enskild_firma"],
    källa: { namn: "Bokföringsnämnden (BFN)", hämtad: "2026-09-30" },
    status: "uppfyllt",
  },
];

function renderLegal(data: LegalData, locked: LegalLock = null, bolagsformPicker?: BolagsformPicker) {
  return render(
    <LocaleProvider>
      <Legal data={data} locked={locked} bolagsformPicker={bolagsformPicker} />
    </LocaleProvider>,
  );
}

describe("Legal (skärmen, PR 5)", () => {
  it("visar bolagsformen, varje krav med källa och datum, status och ansvarsbegränsningen", () => {
    renderLegal({ krav });
    expect(screen.getByRole("heading", { level: 1, name: "Enskild firma" })).toBeInTheDocument();
    expect(screen.getByText("Skatteverket")).toBeInTheDocument();
    expect(screen.getByText("17 september")).toBeInTheDocument();
    expect(screen.getByText("30 september")).toBeInTheDocument();
    expect(screen.getByText(sv.legalPage.status.uppfyllt)).toBeInTheDocument();
    expect(screen.getByText(sv.legalPage.disclaimer)).toBeInTheDocument();
  });

  it("en källa utan datum visas som en lucka, aldrig som en källa", () => {
    renderLegal({ krav: [{ ...krav[0], källa: { namn: "Skatteverket", hämtad: "" } }] });
    expect(screen.getByText(sv.legalPage.sourceMissing)).toBeInTheDocument();
    expect(screen.queryByText("Skatteverket")).not.toBeInTheDocument();
  });

  it("låst läge: stegets nummer, ingen karta", () => {
    renderLegal({ krav: [] }, { unlocksAfterStep: 4 });
    expect(screen.getByText("Låses upp efter steg 04")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("låst läge utanför scenariot", () => {
    renderLegal({ krav: [] }, "notInScenario");
    expect(screen.getByText(sv.homePage.notInThisScenario)).toBeInTheDocument();
  });

  it("utan låsning är en tom karta ett ärligt tomläge, och null är Kommer snart", () => {
    renderLegal({ krav: [] });
    expect(screen.getByText(sv.legalPage.empty)).toBeInTheDocument();
    cleanup();
    renderLegal({ krav: null });
    expect(screen.getByText(sv.comingSoon.title)).toBeInTheDocument();
  });

  it("valet av bolagsform: länkar per form, en uppmaning innan något är valt", () => {
    renderLegal({ krav: null }, null, { current: null, basePath: "/app/juridik" });
    expect(screen.getByText(sv.legalPage.bolagsformPrompt)).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Aktiebolag" })).toHaveAttribute(
      "href",
      "/app/juridik?bolagsform=aktiebolag",
    );
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("den valda bolagsformen blir rubriken och är markerad", () => {
    renderLegal({ krav: [] }, null, { current: "aktiebolag", basePath: "/app/juridik" });
    expect(screen.getByRole("heading", { level: 1, name: "Aktiebolag" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Aktiebolag" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText(sv.legalPage.empty)).toBeInTheDocument();
  });
});
