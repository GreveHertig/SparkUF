import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { getScoreLevel } from "@/score/levels";
import type { ScoreSnapshot } from "@/core/domain";
import type { ScoreSuggestion } from "@/core/score";
import { Score, type ScoreData } from "./Score";

afterEach(() => cleanup());

const källa = { namn: "Bolagsverket", hämtad: "2026-09-16" };

const snapshot: ScoreSnapshot = {
  total: 43,
  previousTotal: 47,
  delta: -4,
  deltaReason: "Tre kunder säger emot.",
  calculatedAtIso: "2026-09-16",
  parts: [{ name: "Marknad", points: 9, weight: 12, source: källa, dataType: "register" }],
  lockedParts: [
    { name: "Traktion", unlocksAfterStep: 11 },
    { name: "Problem", unlocksAfterStep: 5 },
  ],
};

const suggestions: ScoreSuggestion[] = [
  {
    partId: "fit",
    label: "Passform",
    explanation: "Löses av Lovable-bygget i steg 10.",
    gapType: "structural",
    pointsGain: 0,
    estimatedMinutes: 0,
    actionLabel: "Bygg",
    pointsPerMinute: 0,
  },
];

function renderScore(overrides: Partial<ScoreData> = {}) {
  const data: ScoreData = { snapshot, suggestions, history: [20, 30, 43], ...overrides };
  return render(
    <LocaleProvider>
      <Score data={data} />
    </LocaleProvider>,
  );
}

describe("Score (skärmen, PR 4)", () => {
  it("visar nivån, poängen, rörelsen och delarna med källa", () => {
    renderScore();
    expect(screen.getByRole("heading", { level: 1, name: sv.score.levels[getScoreLevel(43).key].name })).toBeInTheDocument();
    expect(screen.getByText("43")).toBeInTheDocument();
    expect(screen.getByText("−4")).toBeInTheDocument();
    expect(screen.getByText("Marknad")).toBeInTheDocument();
    expect(screen.getByText(/Bolagsverket/)).toBeInTheDocument();
  });

  it("låsta delar står i upplåsningsordning med sitt steg", () => {
    renderScore();
    const locked = screen.getAllByText(/Låses upp efter steg/).map((node) => node.textContent);
    expect(locked).toEqual(["Låses upp efter steg 05", "Låses upp efter steg 11"]);
  });

  it("en upplåst del utan bevis visas som en lucka, aldrig som 0/vikt (beslut B4)", () => {
    renderScore({ snapshot: { ...snapshot, emptyParts: [{ name: "Konkurrens", weight: 8 }] } });
    const item = screen.getByText("Konkurrens").closest("li");
    expect(item).toHaveTextContent(sv.scorePage.emptyPart);
    expect(item).not.toHaveTextContent("/8");
  });

  it("Lovable i ett förslag får koncept-etiketten", () => {
    renderScore();
    expect(screen.getByText(sv.common.conceptBadge)).toBeInTheDocument();
  });

  it("utan poäng: Kommer snart bara i nedbrytningen, historik och förslag syns ändå, ingen påhittad nivå", () => {
    renderScore({ snapshot: null });
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: sv.scorePage.title })).toBeInTheDocument();
    expect(screen.getByText("20, 30, 43")).toBeInTheDocument();
    expect(screen.getByText("Passform")).toBeInTheDocument();
    for (const level of Object.values(sv.score.levels)) {
      expect(screen.queryByText(level.name)).not.toBeInTheDocument();
    }
  });

  it("utan förslag eller historik: Kommer snart i just de korten, poängen syns ändå", () => {
    renderScore({ suggestions: null, history: null });
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(2);
    expect(screen.getByText("43")).toBeInTheDocument();
  });

  it("tomma listor är ärliga tomlägen, inte Kommer snart", () => {
    renderScore({ suggestions: [], history: [] });
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    expect(screen.getByText(sv.scorePage.noSuggestions)).toBeInTheDocument();
    expect(screen.getByText(sv.scorePage.noHistory)).toBeInTheDocument();
  });
});
