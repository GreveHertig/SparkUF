import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { LocaleProvider, useI18n } from "./context";

function Switch() {
  const { locale, setLocale } = useI18n();
  return (
    <button type="button" onClick={() => setLocale(locale === "sv" ? "en" : "sv")}>
      {locale}
    </button>
  );
}

describe("LocaleProvider", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.lang = "";
  });

  it("sätter <html lang> till svenska som standard", () => {
    render(
      <LocaleProvider>
        <Switch />
      </LocaleProvider>,
    );
    expect(document.documentElement.lang).toBe("sv");
  });

  it("<html lang> följer språkbytet", () => {
    render(
      <LocaleProvider>
        <Switch />
      </LocaleProvider>,
    );
    act(() => screen.getByRole("button").click());
    expect(screen.getByRole("button").textContent).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    act(() => screen.getByRole("button").click());
    expect(document.documentElement.lang).toBe("sv");
  });

  it("läser ett sparat språk", () => {
    window.localStorage.setItem("spark:locale", "en");
    render(
      <LocaleProvider>
        <Switch />
      </LocaleProvider>,
    );
    expect(document.documentElement.lang).toBe("en");
  });
});
