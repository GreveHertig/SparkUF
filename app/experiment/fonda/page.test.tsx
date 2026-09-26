import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { en } from "@/i18n/en";
import { sv } from "@/i18n/sv";
import FondaLandingPage from "./page";
import { FONDA_DEMO_HREF } from "./_components/DemoLink";
import { FONDA_PRIVACY_HREF } from "./_components/EmailSignup";
import { HONEYPOT_FIELD } from "./_lib/waitlist";

// Server Action körs på servern; här prövas bara formulärets beteende.
const joinMock = vi.hoisted(() => vi.fn());
vi.mock("./actions", () => ({ joinFondaWaitlist: joinMock }));

// Samma matchMedia-stubb som app/(marketing)/page.test.tsx.
beforeAll(() => {
  window.matchMedia = ((query: string) =>
    ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
});

afterEach(() => cleanup());
beforeEach(() => {
  window.localStorage.removeItem("spark:locale");
  joinMock.mockReset();
});

async function renderPage() {
  const result = render(
    <LocaleProvider>
      <FondaLandingPage />
    </LocaleProvider>,
  );
  // Registerkortet hämtar sin data i en effekt.
  await act(async () => {});
  return result;
}

function allStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(allStrings);
  return [];
}

describe("/experiment/fonda", () => {
  it("visar kärninnehållet: rubrik, registret, priset och demot märkt med fiktiv data", async () => {
    await renderPage();
    const copy = sv.experimentFonda;

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(copy.hero.titleEm);
    expect(screen.getByText(/Bolagsverket och SCB\./)).toBeInTheDocument();
    expect(screen.getByText(copy.price.amount)).toBeInTheDocument();
    expect(screen.getByText(copy.price.name)).toBeInTheDocument();

    const demoLinks = screen.getAllByRole("link", { name: new RegExp(copy.demoLink.label) });
    expect(demoLinks.length).toBeGreaterThan(0);
    for (const link of demoLinks) {
      expect(link).toHaveAttribute("href", FONDA_DEMO_HREF);
      expect(link).toHaveTextContent(copy.demoLink.note);
    }
  });

  it("har ett synligt mejlfält med label, autocomplete och en länk till integritetstexten", async () => {
    const { container } = await renderPage();
    const copy = sv.experimentFonda.close;

    const visible = [...container.querySelectorAll("input")].filter((input) => input.name !== HONEYPOT_FIELD);
    expect(visible).toHaveLength(1);
    const input = screen.getByLabelText(copy.emailLabel);
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(screen.getByRole("button", { name: copy.submit })).toHaveTextContent("Skriv upp mig");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("link", { name: copy.privacyLink })).toHaveAttribute("href", FONDA_PRIVACY_HREF);

    // Honeypoten: utanför tabbordningen och dold för skärmläsare.
    const honeypot = container.querySelector(`input[name="${HONEYPOT_FIELD}"]`);
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot?.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("stoppar en ogiltig adress i webbläsaren med ett felmeddelande under fältet", async () => {
    await renderPage();
    const copy = sv.experimentFonda.close;
    const input = screen.getByLabelText(copy.emailLabel);

    fireEvent.change(input, { target: { value: "inte-en-adress" } });
    fireEvent.click(screen.getByRole("button", { name: copy.submit }));

    expect(screen.getByRole("status")).toHaveTextContent(copy.invalid);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(joinMock).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "namn@exempel.se" } });
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("inaktiverar knappen medan adressen skickas och tackar sedan", async () => {
    let resolve: (value: unknown) => void = () => {};
    joinMock.mockImplementation(() => new Promise((r) => (resolve = r)));
    await renderPage();
    const copy = sv.experimentFonda.close;

    fireEvent.change(screen.getByLabelText(copy.emailLabel), { target: { value: "namn@exempel.se" } });
    fireEvent.click(screen.getByRole("button", { name: copy.submit }));

    const pending = await screen.findByRole("button", { name: copy.submitting });
    expect(pending).toBeDisabled();
    expect(joinMock).toHaveBeenCalledTimes(1);
    expect((joinMock.mock.calls[0][1] as FormData).get("email")).toBe("namn@exempel.se");

    await act(async () => resolve({ status: "joined" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(copy.joined));
    expect(screen.queryByLabelText(copy.emailLabel)).not.toBeInTheDocument();
  });

  it("visar serverns fel som text och låter besökaren försöka igen", async () => {
    joinMock.mockResolvedValue({ status: "error", code: "rate_limited" });
    await renderPage();
    const copy = sv.experimentFonda.close;

    fireEvent.change(screen.getByLabelText(copy.emailLabel), { target: { value: "namn@exempel.se" } });
    fireEvent.click(screen.getByRole("button", { name: copy.submit }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(copy.rateLimited));
    expect(screen.getByRole("button", { name: copy.submit })).toBeEnabled();
  });

  it("föreslår en rättelse av stavfel i domänen, som byter adressen vid klick", async () => {
    await renderPage();
    const copy = sv.experimentFonda.close;
    const input = screen.getByLabelText(copy.emailLabel) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "sara@gmial.com" } });
    const suggestion = screen.getByRole("button", { name: "Menade du sara@gmail.com?" });

    fireEvent.click(suggestion);
    expect(input.value).toBe("sara@gmail.com");
    expect(screen.queryByRole("button", { name: /Menade du/ })).not.toBeInTheDocument();
  });

  it("stoppar inte inskicket när besökaren inte tar förslaget", async () => {
    joinMock.mockResolvedValue({ status: "joined" });
    await renderPage();
    const copy = sv.experimentFonda.close;

    fireEvent.change(screen.getByLabelText(copy.emailLabel), { target: { value: "sara@hotmial.com" } });
    expect(screen.getByRole("button", { name: "Menade du sara@hotmail.com?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: copy.submit }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(copy.joined));
    expect((joinMock.mock.calls[0][1] as FormData).get("email")).toBe("sara@hotmial.com");
  });

  it("visar att adressen inte kan ta emot mejl när servern säger det", async () => {
    joinMock.mockResolvedValue({ status: "error", code: "email_undeliverable" });
    await renderPage();
    const copy = sv.experimentFonda.close;
    const input = screen.getByLabelText(copy.emailLabel);

    fireEvent.change(input, { target: { value: "sara@finnsinte-exempel.se" } });
    fireEvent.click(screen.getByRole("button", { name: copy.submit }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Den adressen verkar inte kunna ta emot mejl. Kolla stavningen."),
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("räknar om poängen och sänker den när tre kunder säger emot", async () => {
    await renderPage();
    const copy = sv.experimentFonda.proof;
    const toggle = screen.getByRole("switch", { name: copy.toggle });
    const before = Number(document.querySelector(".fd-proof__number > span")?.textContent);

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    const after = Number(document.querySelector(".fd-proof__number > span")?.textContent);
    expect(after).toBeLessThan(before);
    expect(screen.getByText(copy.deltaReason, { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText(copy.contradicts, { selector: ".fd-sr-only" })).toHaveLength(3);
  });

  it("växlar till engelska", async () => {
    await renderPage();
    fireEvent.click(screen.getAllByRole("button", { name: "EN" })[0]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.experimentFonda.hero.titleEm);
    expect(screen.getByText(en.experimentFonda.price.amount)).toBeInTheDocument();
  });

  it("nämner inte Fonda, påstår inget om att vara ensam och har inga tankstreck", () => {
    for (const text of [...allStrings(sv.experimentFonda), ...allStrings(en.experimentFonda)]) {
      expect(text).not.toMatch(/fonda/i);
      expect(text).not.toMatch(/\b(den enda|det enda|only)\b/i);
      expect(text).not.toContain("—");
    }
  });
});
