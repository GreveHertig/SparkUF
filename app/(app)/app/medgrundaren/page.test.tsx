import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";

const sendMessageMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/CofounderAgent", () => ({
  liveCofounderAgent: { sendMessage: sendMessageMock },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function renderPage() {
  const { default: LiveCofounderPage } = await import("./page");
  const tree = LiveCofounderPage();
  render(<LocaleProvider>{tree}</LocaleProvider>);
  return tree;
}

describe("/app/medgrundaren (PR 10)", () => {
  it("visar Kommer snart i samtalet och i kontexten, aldrig demots manus", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: sv.cofounderPage.title })).toBeInTheDocument();
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(2);
    expect(screen.queryByText(sv.cofounderPage.emptyStateBody)).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("anropar inte liveadaptern och importerar inget ur demot", async () => {
    await renderPage();
    expect(sendMessageMock).not.toHaveBeenCalled();
    const source = readFileSync(join(__dirname, "page.tsx"), "utf8");
    expect(source).not.toMatch(/adapters\/demo/);
  });

  it("skickar inga funktioner som props till skärmen", async () => {
    const tree = await renderPage();
    const values = Object.values((tree as { props: Record<string, unknown> }).props);
    expect(values.some((value) => typeof value === "function")).toBe(false);
  });
});
