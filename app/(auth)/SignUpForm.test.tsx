import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";

const signUpMock = vi.hoisted(() => vi.fn());
vi.mock("./actions", () => ({ signUp: signUpMock }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function submitWith(formError: string) {
  signUpMock.mockResolvedValue({ formError });
  const { SignUpForm } = await import("./SignUpForm");
  render(
    <LocaleProvider>
      <SignUpForm next="/app" />
    </LocaleProvider>,
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: sv.auth.signUp.submitCta }));
  });
}

describe("SignUpForm: felet från registreringen", () => {
  it("mejlgränsen ger en egen text, inte Något gick fel", async () => {
    await submitWith("rate_limited");
    expect(await screen.findByRole("alert")).toHaveTextContent(sv.auth.errors.tooManyAttempts);
    expect(screen.queryByText(sv.auth.errors.unexpected)).not.toBeInTheDocument();
  });

  it("övriga fel visas som förut", async () => {
    await submitWith("unexpected");
    expect(await screen.findByRole("alert")).toHaveTextContent(sv.auth.errors.unexpected);
  });
});
