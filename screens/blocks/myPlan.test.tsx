import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { Journey, groupPlanItems, type JourneyPlan } from "@/screens/Journey";
import type { PlanItem } from "@/ports/PlanRepository";

vi.mock("next/navigation", () => ({ usePathname: () => "/app/resan" }));

afterEach(() => cleanup());

const item = (id: string, text: string, extra: Partial<PlanItem> = {}): PlanItem => ({
  id,
  text,
  context: "Bidrag",
  origin: "pulsen",
  done: false,
  createdAtIso: "",
  ...extra,
});

function renderPlan(overrides: Partial<JourneyPlan> = {}, items: PlanItem[] = [item("a", "Läs villkoren")]) {
  const plan: JourneyPlan = {
    items,
    onToggle: vi.fn().mockResolvedValue(undefined),
    onRemove: vi.fn().mockResolvedValue(undefined),
    onEdit: vi.fn().mockResolvedValue({ ok: true }),
    onAdd: vi.fn().mockResolvedValue({ ok: true }),
    pulseHref: "/app/pulsen",
    cofounderHref: "/app/medgrundaren",
    ...overrides,
  };
  render(
    <LocaleProvider>
      <Journey data={{ steps: [] }} basePath="/app/resan" plan={plan} />
    </LocaleProvider>,
  );
  return plan;
}

describe("groupPlanItems", () => {
  it("grupperar per sammanhang, egna för sig, övriga för sig, öppna först i varje grupp", () => {
    const groups = groupPlanItems(
      [
        item("1", "Ett", { done: true }),
        item("2", "Två"),
        item("3", "Eget", { origin: "own", context: null }),
        item("4", "Utan sammanhang", { context: null }),
      ],
      { own: "Egna", other: "Övriga" },
    );
    expect(groups.map((group) => group.title)).toEqual(["Bidrag", "Egna", "Övriga"]);
    expect(groups[0].items.map((entry) => entry.text)).toEqual(["Två", "Ett"]);
  });
});

describe("Min plan i Resan", () => {
  it("Ändra byter texten och sparar via onEdit", async () => {
    const plan = renderPlan();
    fireEvent.click(screen.getByRole("button", { name: sv.journeyPage.plan.edit }));
    const input = screen.getByRole("textbox", { name: sv.journeyPage.plan.editLabel });
    fireEvent.change(input, { target: { value: "Läs villkoren hos Energimyndigheten" } });
    fireEvent.click(screen.getByRole("button", { name: sv.journeyPage.plan.save }));
    await waitFor(() => expect(screen.getByText("Läs villkoren hos Energimyndigheten")).toBeInTheDocument());
    expect(plan.onEdit).toHaveBeenCalledWith("a", "Läs villkoren hos Energimyndigheten");
  });

  it("en dubblett visar felet och behåller fältet öppet", async () => {
    renderPlan({ onEdit: vi.fn().mockResolvedValue({ ok: false, reason: "duplicate" }) });
    fireEvent.click(screen.getByRole("button", { name: sv.journeyPage.plan.edit }));
    fireEvent.click(screen.getByRole("button", { name: sv.journeyPage.plan.save }));
    expect(await screen.findByRole("alert")).toHaveTextContent(sv.journeyPage.plan.errors.duplicate);
    expect(screen.getByRole("textbox", { name: sv.journeyPage.plan.editLabel })).toBeInTheDocument();
  });

  it("en egen uppgift skickas via onAdd och fältet töms", async () => {
    const plan = renderPlan();
    const input = screen.getByRole("textbox", { name: sv.journeyPage.plan.addLabel });
    fireEvent.change(input, { target: { value: "Ring HSB" } });
    fireEvent.click(screen.getByRole("button", { name: sv.journeyPage.plan.addButton }));
    await waitFor(() => expect(input).toHaveValue(""));
    expect(plan.onAdd).toHaveBeenCalledWith("Ring HSB");
  });

  it("en avbockad uppgift har ingen Hjälp mig-länk", () => {
    renderPlan({}, [item("a", "Klar uppgift", { done: true })]);
    expect(screen.queryByRole("link", { name: sv.journeyPage.plan.help })).not.toBeInTheDocument();
  });
});
