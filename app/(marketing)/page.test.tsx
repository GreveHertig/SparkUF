import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import LandningPage from "./page";
import PricingPage from "./priser/page";

// jsdom saknar matchMedia — ScoreBadge/VerdictCard (via usePrefersReducedMotion)
// behöver den, se app/demo/app/locale-switch.test.tsx för samma mönster. Sätt
// matches: true (till skillnad från den filens matches: false) så att
// ScoreBadges räkneanimation (Framer Motion, requestAnimationFrame) aldrig
// startar här — annars kan en animationstick försöka köra efter att den här
// testfilens jsdom-miljö redan monterats ner, vilket gav ett flakigt
// "window is not defined" när hela sviten kördes tillsammans med andra filer.
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

afterEach(() => {
  cleanup();
});

// Ingen PublicHeader (och därmed ingen LanguageSwitch) i den här renderingen
// — layouten som bär headern testas inte här. Språket sätts därför direkt via
// localStorage (samma nyckel som i18n/context.tsx läser) i stället för att
// klicka på en SV/EN-knapp, se locale-switch.test.tsx för det mönstret.
beforeEach(() => {
  window.localStorage.removeItem("spark:locale");
});

describe("Landningssidan", () => {
  it("visar hero och alla nio sektionerna på svenska", () => {
    render(
      <LocaleProvider>
        <LandningPage />
      </LocaleProvider>,
    );

    expect(screen.getByRole("heading", { level: 1, name: /Spark gör resten/ })).toBeInTheDocument();
    expect(screen.getByText("Boka tre kundsamtal den här veckan")).toBeInTheDocument();
    expect(screen.getByText("312")).toBeInTheDocument();
    expect(screen.getByText("Tolv steg. Fyra faser. Ett bevis i taget.")).toBeInTheDocument();
    expect(screen.getByText("Om dig")).toBeInTheDocument();
    expect(screen.getByText("Poängen mäter bevis, inte optimism.")).toBeInTheDocument();
    expect(screen.getByText("En juridisk karta för just ditt företag.")).toBeInTheDocument();
    expect(screen.getByText("Spark glömmer aldrig ett beslut.")).toBeInTheDocument();
    expect(screen.getByText("Två koncept, inget avtal än.")).toBeInTheDocument();
    expect(screen.getByText("Innan du börjar")).toBeInTheDocument();
    expect(screen.getByText("Redo att testa din idé mot verkligheten?")).toBeInTheDocument();
  });

  it("visar samma sektioner på engelska utan att krascha", () => {
    window.localStorage.setItem("spark:locale", "en");

    render(
      <LocaleProvider>
        <LandningPage />
      </LocaleProvider>,
    );

    expect(screen.getByText("Book three customer calls this week")).toBeInTheDocument();
    expect(screen.getByText("Twelve steps. Four phases. One proof at a time.")).toBeInTheDocument();
    expect(screen.getByText("The score measures proof, not optimism.")).toBeInTheDocument();
  });
});

describe("/priser", () => {
  it("visar tre nivåer märkta som förslag", () => {
    render(
      <LocaleProvider>
        <PricingPage />
      </LocaleProvider>,
    );

    expect(screen.getByText("Förslag — inte fastställda priser")).toBeInTheDocument();
    expect(screen.getByText("Gratis")).toBeInTheDocument();
    expect(screen.getByText("Grundare")).toBeInTheDocument();
    expect(screen.getByText("Bygg-credits")).toBeInTheDocument();
    expect(screen.getByText("199 kr")).toBeInTheDocument();
  });
});
