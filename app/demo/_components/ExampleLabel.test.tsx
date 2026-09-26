import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { ExampleLabel } from "./DemoBlocks";

afterEach(() => cleanup());

describe("ExampleLabel (Datalöftet)", () => {
  it("märker exempeldata synligt", () => {
    render(
      <LocaleProvider>
        <ExampleLabel dataKind="example" />
      </LocaleProvider>,
    );
    expect(screen.getByText(sv.site.demo.exampleLabel)).toBeVisible();
  });

  it("visar ingenting för riktig data", () => {
    const { container } = render(
      <LocaleProvider>
        <ExampleLabel dataKind="live" />
      </LocaleProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
