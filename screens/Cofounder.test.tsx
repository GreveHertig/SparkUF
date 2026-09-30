import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { Cofounder, type CofounderData } from "./Cofounder";

afterEach(() => cleanup());

const moment: CofounderData["moment"] = {
  label: "03 · Marknaden",
  items: [
    { kind: "message", role: "cofounder", text: { sv: "Jag tittar i registret.", en: "Looking at the registry." } },
    { kind: "tool", label: { sv: "Registret", en: "Registry" }, steps: { sv: ["Hämtar bolag"], en: ["Fetching companies"] } },
    { kind: "timeSkip", label: { sv: "4 dagar senare", en: "4 days later" } },
    { kind: "message", role: "founder", text: { sv: "Kan Lovable bygga det?", en: "Can Lovable build it?" } },
  ],
};

function renderCofounder(data: CofounderData) {
  return render(
    <LocaleProvider>
      <Cofounder data={data} />
    </LocaleProvider>,
  );
}

describe("Cofounder (PR 10)", () => {
  it("visar momentets etikett och alla tre sorters inslag, utan Kommer snart", () => {
    renderCofounder({ moment, context: [] });
    expect(screen.getByRole("heading", { level: 1, name: sv.cofounderPage.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "03 · Marknaden" })).toBeInTheDocument();
    expect(screen.getByText("Jag tittar i registret.")).toBeInTheDocument();
    expect(screen.getByText(`${sv.cofounderPage.toolRunningLabel}: Registret`)).toBeInTheDocument();
    expect(screen.getByText("Hämtar bolag")).toBeInTheDocument();
    expect(screen.getByText("4 dagar senare")).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("ett koncept i samtalet eller i kontexten bär koncept-etiketten", () => {
    renderCofounder({ moment, context: [{ id: "a", text: "Prissimuleringen (Hiasynth)" }] });
    expect(screen.getAllByText(sv.common.conceptBadge)).toHaveLength(2);
  });

  it("en tom kontext döljer spalten, en ifylld visas i ordning", () => {
    renderCofounder({ moment, context: [] });
    expect(screen.queryByRole("heading", { name: sv.cofounderPage.contextTitle })).not.toBeInTheDocument();
    cleanup();

    renderCofounder({ moment, context: [{ id: "a", text: "Första" }, { id: "b", text: "Andra" }] });
    const aside = screen.getByRole("complementary");
    expect(within(aside).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Första", "Andra"]);
  });

  it("ett moment utan inslag visar tomläget", () => {
    renderCofounder({ moment: { label: "01 · Om dig", items: [] }, context: [] });
    expect(screen.getByText(sv.cofounderPage.emptyStateBody)).toBeInTheDocument();
  });

  it("platshållare per sektion: saknat moment och saknad kontext ger var sin Kommer snart", () => {
    renderCofounder({ moment: null, context: [{ id: "a", text: "Känt sedan tidigare" }] });
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(1);
    expect(screen.getByText("Känt sedan tidigare")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: sv.cofounderPage.title })).toBeInTheDocument();
    cleanup();

    renderCofounder({ moment, context: null });
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(1);
    expect(screen.getByText("Jag tittar i registret.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: sv.cofounderPage.contextTitle })).toBeInTheDocument();
  });

  it("promptfältet är avstängt", () => {
    renderCofounder({ moment: null, context: null });
    expect(screen.getByRole("textbox", { name: sv.cofounderPage.promptPlaceholder })).toBeDisabled();
    expect(screen.getByRole("button", { name: sv.cofounderPage.promptSendLabel })).toBeDisabled();
  });
});
