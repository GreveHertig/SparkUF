import { describe, it, expect } from "vitest";
import { KURERADE_KÄLLOR, LEGAL_TOPICS, LEGAL_TOPIC_IDS } from "@/adapters/live/legalSources";

const BOLAGSFORMER = ["enskild_firma", "aktiebolag", "handelsbolag", "ekonomisk_forening"] as const;

describe("legalSources — kuraterad data", () => {
  it("varje ämne pekar på en källa som finns i KURERADE_KÄLLOR", () => {
    for (const topic of LEGAL_TOPICS) {
      expect(KURERADE_KÄLLOR[topic.källId]).toBeDefined();
    }
  });

  it("varje källa har ett ifyllt namn, ett giltigt hämtad-datum (inte i framtiden) och en https-url", () => {
    const today = new Date();
    for (const källa of Object.values(KURERADE_KÄLLOR)) {
      expect(källa.namn.length).toBeGreaterThan(0);
      const hämtad = new Date(källa.hämtad);
      expect(Number.isNaN(hämtad.getTime())).toBe(false);
      expect(hämtad.getTime()).toBeLessThanOrEqual(today.getTime());
      expect(källa.url).toMatch(/^https:\/\//);
    }
  });

  it("ämnes-id:n är unika", () => {
    const ids = LEGAL_TOPICS.map((topic) => topic.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ämnes-id:n är ASCII (inga å/ä/ö) eftersom de skickas till Gemini som enum-värden", () => {
    for (const id of LEGAL_TOPIC_IDS) {
      expect(id).toMatch(/^[a-z_]+$/);
    }
  });

  it("LEGAL_TOPIC_IDS matchar LEGAL_TOPICS.map(t => t.id) exakt", () => {
    expect(LEGAL_TOPIC_IDS).toEqual(LEGAL_TOPICS.map((topic) => topic.id));
  });

  it("varje bolagsform har minst ett tillämpligt ämne", () => {
    for (const bolagsform of BOLAGSFORMER) {
      const matchande = LEGAL_TOPICS.filter((topic) => topic.gällerFör.includes(bolagsform));
      expect(matchande.length).toBeGreaterThan(0);
    }
  });
});
