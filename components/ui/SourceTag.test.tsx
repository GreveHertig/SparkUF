import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { SourceTag } from "./SourceTag";

// Källans datum visas bara när det är känt. Ett tomt `hämtad` (till exempel
// ett onboardingsvar som sparades utan tid) ger källan utan datum, aldrig ett
// påhittat (Datalöftet).
// Radix Popover mäter med ResizeObserver, som jsdom saknar.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("SourceTag", () => {
  afterEach(cleanup);

  it("visar källan och datumet", () => {
    render(
      <LocaleProvider>
        <SourceTag source={{ namn: "Profilsamtalet", hämtad: "2026-10-02" }} dataType="user" />
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: sv.common.sourceTag.openDetails })).toHaveTextContent(
      `${sv.common.userSourceLabel}·Profilsamtalet·2 oktober`,
    );
  });

  it("utan känt datum visas källan utan datum, i etiketten och i detaljerna", () => {
    render(
      <LocaleProvider>
        <SourceTag source={{ namn: "Profilsamtalet", hämtad: "" }} dataType="user" />
      </LocaleProvider>,
    );
    const tag = screen.getByRole("button", { name: sv.common.sourceTag.openDetails });
    expect(tag.textContent).toBe(`${sv.common.userSourceLabel}·Profilsamtalet`);
    fireEvent.click(tag);
    const details = screen.getByRole("dialog");
    expect(details).toHaveTextContent("Profilsamtalet");
    expect(details).not.toHaveTextContent(/Invalid|NaN|\d/);
  });
});
