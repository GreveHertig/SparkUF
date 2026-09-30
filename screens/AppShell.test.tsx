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

  it("flikraden har elva riktiga länkar när navBasePath finns", () => {
    render(
      <LocaleProvider>
        <AppShell homeHref="/demo" navBasePath="/demo" dataKind="example" profile={profile}>
          <p>innehåll</p>
        </AppShell>
      </LocaleProvider>,
    );
    const nav = screen.getByRole("navigation", { name: sv.site.demo.navLabel });
    expect(nav.querySelectorAll("a")).toHaveLength(11);
    expect(screen.getByRole("link", { name: sv.appShell.nav.businessPlan })).toHaveAttribute(
      "href",
      "/demo/affarsplan",
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

  it("enabledTabs gör just de flikarna klickbara utan navBasePath", () => {
    pathname = "/app/pulsen";
    render(
      <LocaleProvider>
        <AppShell homeHref="/app" enabledTabs={["/app/pulsen"]} dataKind="live" profile={profile}>
          <p>innehåll</p>
        </AppShell>
      </LocaleProvider>,
    );
    const nav = screen.getByRole("navigation", { name: sv.appShell.navMenuLabel });
    expect(nav.querySelectorAll("a")).toHaveLength(2);
    const pulse = screen.getByRole("link", { name: sv.appShell.nav.pulse });
    expect(pulse).toHaveAttribute("href", "/app/pulsen");
    expect(pulse).toHaveAttribute("aria-current", "page");
    expect(screen.getByText(sv.appShell.nav.businessPlan).tagName).toBe("SPAN");
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
});
