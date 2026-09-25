import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import type { WaitlistFormState } from "./actions";

// Serverfunktionen testas för sig i actions.test.ts. Här byts den mot en
// mock så att bara formulärets visning av koderna prövas.
const joinWaitlistMock = vi.fn<(prev: WaitlistFormState, data: FormData) => Promise<WaitlistFormState>>();
vi.mock("./actions", () => ({
  joinWaitlist: (prev: WaitlistFormState, data: FormData) => joinWaitlistMock(prev, data),
}));

const { WaitlistForm } = await import("./WaitlistForm");

function renderForm() {
  render(
    <LocaleProvider>
      <WaitlistForm />
    </LocaleProvider>,
  );
}

function submit(email: string, buttonName: RegExp) {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: buttonName }));
}

afterEach(() => {
  cleanup();
});

// Språket sätts via localStorage, samma nyckel som i18n/context.tsx läser
// (samma mönster som page.test.tsx).
beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.removeItem("spark:locale");
});

describe("WaitlistForm på svenska", () => {
  it("visar bara ett mejlfält, knappen och raden om vad adressen används till", () => {
    renderForm();

    expect(screen.getByLabelText("Få besked när Spark öppnar")).toHaveAttribute("type", "email");
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Ställ mig på väntelistan" })).toBeInTheDocument();
    expect(
      screen.getByText("Vi sparar bara din mejladress och använder den bara för att meddela dig när Spark öppnar."),
    ).toBeInTheDocument();
  });

  it("skickar adressen och visar bekräftelsen", async () => {
    joinWaitlistMock.mockResolvedValue({ joined: true });
    renderForm();
    submit("sara@exempel.se", /Ställ mig på väntelistan/);

    expect(await screen.findByRole("status")).toHaveTextContent("Tack! Du står på väntelistan.");
    expect(joinWaitlistMock.mock.calls[0][1].get("email")).toBe("sara@exempel.se");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("visar felet för en ogiltig adress", async () => {
    joinWaitlistMock.mockResolvedValue({ fieldError: "email_invalid" });
    renderForm();
    submit("inte-en-epost", /Ställ mig på väntelistan/);

    expect(await screen.findByText("Skriv en giltig mejladress.")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("visar ett allmänt fel vid oväntat fel", async () => {
    joinWaitlistMock.mockResolvedValue({ formError: "unexpected" });
    renderForm();
    submit("sara@exempel.se", /Ställ mig på väntelistan/);

    expect(await screen.findByText("Något gick fel. Försök igen om en stund.")).toBeInTheDocument();
  });
});

describe("WaitlistForm på engelska", () => {
  beforeEach(() => {
    window.localStorage.setItem("spark:locale", "en");
  });

  it("visar fältet, knappen och raden om vad adressen används till", async () => {
    renderForm();

    expect(await screen.findByLabelText("Get notified when Spark opens")).toHaveAttribute("type", "email");
    expect(screen.getByRole("button", { name: "Join the waitlist" })).toBeInTheDocument();
    expect(
      screen.getByText("We only store your email address and only use it to let you know when Spark opens."),
    ).toBeInTheDocument();
  });

  it("skickar adressen och visar bekräftelsen", async () => {
    joinWaitlistMock.mockResolvedValue({ joined: true });
    renderForm();
    await screen.findByRole("button", { name: "Join the waitlist" });
    submit("sara@example.com", /Join the waitlist/);

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Thanks! You're on the waitlist."));
  });

  it("visar felet för en ogiltig adress", async () => {
    joinWaitlistMock.mockResolvedValue({ fieldError: "email_invalid" });
    renderForm();
    await screen.findByRole("button", { name: "Join the waitlist" });
    submit("not-an-email", /Join the waitlist/);

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("visar ett allmänt fel vid oväntat fel", async () => {
    joinWaitlistMock.mockResolvedValue({ formError: "unexpected" });
    renderForm();
    await screen.findByRole("button", { name: "Join the waitlist" });
    submit("sara@example.com", /Join the waitlist/);

    expect(await screen.findByText("Something went wrong. Please try again shortly.")).toBeInTheDocument();
  });
});
