import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";

afterEach(() => cleanup());

async function renderPage() {
  const { default: LiveBusinessPlanPage } = await import("./page");
  const tree = LiveBusinessPlanPage();
  render(<LocaleProvider>{tree}</LocaleProvider>);
  return tree;
}

describe("/app/affarsplan (PR 10)", () => {
  it("visar Kommer snart i vart och ett av de nio avsnitten och ingen mognadssiffra", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: sv.businessPlanPage.title })).toBeInTheDocument();
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(9);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("använder aldrig demots hopsamling", () => {
    const source = readFileSync(join(__dirname, "page.tsx"), "utf8");
    expect(source).not.toMatch(/adapters\/demo/);
  });

  it("skickar inga funktioner till klientskärmen", async () => {
    const tree = await renderPage();
    const functionProps = Object.entries(tree.props as Record<string, unknown>).filter(([, v]) => typeof v === "function");
    expect(functionProps).toEqual([]);
  });
});
