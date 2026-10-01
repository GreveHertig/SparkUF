import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import { JourneyStepper } from "./JourneyStepper";

afterEach(() => cleanup());

const steps: JourneyStepView[] = [
  { stepNumber: 1, journeyPhase: "discover", title: "Om dig", oneLiner: "", maxPoints: 8, status: "done" },
  { stepNumber: 2, journeyPhase: "discover", title: "Idén", oneLiner: "", maxPoints: 8, status: "current" },
];

describe("JourneyStepper (en enda version sedan PR 9)", () => {
  it("länkar varje steg till <basePath>/<nummer>", () => {
    render(
      <LocaleProvider>
        <JourneyStepper steps={steps} basePath="/demo/resan" />
      </LocaleProvider>,
    );
    expect(screen.getByRole("link", { name: /Om dig/ })).toHaveAttribute("href", "/demo/resan/1");
    expect(screen.getByRole("link", { name: /Idén/ }).closest("li")).toHaveAttribute("aria-current", "step");
  });

  it("utan basePath visas stegen utan länk", () => {
    render(
      <LocaleProvider>
        <JourneyStepper steps={steps} basePath={null} />
      </LocaleProvider>,
    );
    expect(screen.getByText("Om dig")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
