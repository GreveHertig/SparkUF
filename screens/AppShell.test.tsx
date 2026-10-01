import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { AppShell } from "./AppShell";

let pathname = "/demo";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

afterEach(() => {
  cleanup();
  pathname = "/demo";
});

const profile = { name: "Sara Lindqvist", initials: "SL" };

describe("AppShell (PR 2, skalet)", () => {
  it("visar fiktionsmärket bara för dataKind='example'", () => {
    render(
      <LocaleProvider>
        <AppShell homeHref="/demo" navBasePath="/demo" dataKind="example" profile={profile}>
          <p>innehåll</p>
        </AppShell>
      </LocaleProvider>,
    );
    expect(screen.getByText(sv.site.demo.badge)).toBeVisible();
  });

  it("visar inget fiktionsmärke för dataKind='live'", () => {
    render(
      <LocaleProvider>
        <AppShell homeHref="/app" dataKind="live" profile={profile}>
          <p>innehåll</p>
        </AppShell>
      </LocaleProvider>,
    );
    expect(screen.queryByText(sv.site.demo.badge)).not.toBeInTheDocument();
  });

  it("flikraden har tolv riktiga länkar när navBasePath finns", () => {
    render(
      <LocaleProvider>
        <AppShell homeHref="/demo" navBasePath="/demo" dataKind="example" profile={profile}>
          <p>innehåll</p>
        </AppShell>
      </LocaleProvider>,
    );
    const nav = screen.getByRole("navigation", { name: sv.site.demo.navLabel });
    expect(nav.querySelectorAll("a")).toHaveLength(12);
    expect(screen.getByRole("link", { name: sv.appShell.nav.businessPlan })).toHaveAttribute(
      "href",
      "/demo/affarsplan",
    );
    expect(screen.getByRole("link", { name: sv.appShell.nav.marketing })).toHaveAttribute(
      "href",
      "/demo/marknadsforing",
    );
  });

  it("flikarna är inerta utan navBasePath, förutom Hem", () => {
    pathname = "/app";
    render(
      <LocaleProvider>
        <AppShell homeHref="/app" dataKind="live" profile={profile}>
          <p>innehåll</p>
        </AppShell>
      </LocaleProvider>,
    );
    const nav = screen.getByRole("navigation", { name: sv.appShell.navMenuLabel });
    expect(nav.querySelectorAll("a")).toHaveLength(1);
    expect(screen.getByRole("link", { name: sv.appShell.nav.home })).toHaveAttribute("href", "/app");
    expect(screen.getByText(sv.appShell.nav.businessPlan).tagName).toBe("SPAN");
  });

  it("unavailableTabs gör just de flikarna inerta", () => {
    pathname = "/app/poang";
    render(
      <LocaleProvider>
        <AppShell homeHref="/app" navBasePath="/app" unavailableTabs={["pulsen"]} dataKind="live" profile={profile}>
          <p>innehåll</p>
        </AppShell>
      </LocaleProvider>,
    );
    const nav = screen.getByRole("navigation", { name: sv.appShell.navMenuLabel });
    expect(nav.querySelectorAll("a")).toHaveLength(11);
    expect(screen.getByText(sv.appShell.nav.pulse).tagName).toBe("SPAN");
    expect(screen.getByRole("link", { name: sv.appShell.nav.score })).toHaveAttribute("aria-current", "page");
  });

  it("visar stegpillen bara när currentStep finns", () => {
    const { rerender } = render(
      <LocaleProvider>
        <AppShell homeHref="/app" dataKind="live" profile={profile} currentStep={null}>
          <p>innehåll</p>
        </AppShell>
      </LocaleProvider>,
    );
    expect(screen.queryByText(/Steg 03/)).not.toBeInTheDocument();

    rerender(
      <LocaleProvider>
        <AppShell
          homeHref="/app"
          dataKind="live"
          profile={profile}
          currentStep={{ number: 3, title: "Marknaden", total: 12 }}
        >
          <p>innehåll</p>
        </AppShell>
      </LocaleProvider>,
    );
    const stepPill = screen.getByText(/Steg 03 av 12/);
    expect(stepPill).toBeVisible();
    expect(stepPill.textContent).toContain("Marknaden");
  });

  it("renderar headerRight och barnen", () => {
    render(
      <LocaleProvider>
        <AppShell homeHref="/app" dataKind="live" profile={profile} headerRight={<button>Logga ut</button>}>
          <p>sidans innehåll</p>
        </AppShell>
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "Logga ut" })).toBeVisible();
    expect(screen.getByText("sidans innehåll")).toBeVisible();
  });

  it("sidhuvudet visar poängen som en liten siffra med länk till Poäng (PR 4)", () => {
    render(
      <LocaleProvider>
        <AppShell homeHref="/demo" navBasePath="/demo" dataKind="example" profile={profile} score={24}>
          <p>innehåll</p>
        </AppShell>
      </LocaleProvider>,
    );
    const link = screen.getByRole("link", { name: /^Poäng 24/ });
    expect(link).toHaveAttribute("href", "/demo/poang");
    expect(link).toHaveClass("fdd-top__score");
  });

  it("utan poäng visar sidhuvudet luckan, aldrig en nolla (PR 4)", () => {
    for (const score of [null, undefined]) {
      const { unmount } = render(
        <LocaleProvider>
          <AppShell homeHref="/app" dataKind="live" profile={profile} score={score}>
            <p>innehåll</p>
          </AppShell>
        </LocaleProvider>,
      );
      const link = screen.getByRole("link", { name: new RegExp(sv.appShell.headerScoreMissing) });
      expect(link).toHaveAttribute("href", "/app/poang");
      expect(link.textContent).toContain("—");
      expect(link.textContent).not.toMatch(/\d/);
      unmount();
    }
  });

  it("poängen 0 visas som 0, inte som luckan", () => {
    render(
      <LocaleProvider>
        <AppShell homeHref="/app" dataKind="live" profile={profile} score={0}>
          <p>innehåll</p>
        </AppShell>
      </LocaleProvider>,
    );
    expect(screen.getByRole("link", { name: /^Poäng 0/ })).toBeInTheDocument();
  });
});
