import { describe, it, expect } from "vitest";
import {
  KURERADE_KÄLLOR,
  LEGAL_TOPICS,
  LEGAL_TOPIC_IDS,
  getLegalTopicsFor,
  type KällId,
} from "@/adapters/live/legalSources";

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

  it("varje källa pekar på rätt myndighets domän", () => {
    const domänFör = (id: KällId): string => {
      if (id.startsWith("bolagsverket")) return "bolagsverket.se";
      if (id.startsWith("verksamt")) return "verksamt.se";
      if (id.startsWith("bfn")) return "www.bfn.se";
      return {
        skatteverket: "www.skatteverket.se",
        imy: "www.imy.se",
        eurlex_gdpr: "eur-lex.europa.eu",
        konsumentverket: "www.konsumentverket.se",
        riksdagen: "www.riksdagen.se",
      }[id as string]!;
    };
    for (const [id, källa] of Object.entries(KURERADE_KÄLLOR) as [KällId, (typeof KURERADE_KÄLLOR)[KällId]][]) {
      expect(new URL(källa.url!).hostname, id).toBe(domänFör(id));
    }
  });

  it("källorna som en människa kontrollerat (Bolagsverket, verksamt.se, BFN) pekar på en undersida, inte startsidan", () => {
    const kontrollerade = Object.entries(KURERADE_KÄLLOR).filter(([id]) =>
      /^(bolagsverket|verksamt|bfn)_/.test(id),
    );
    expect(kontrollerade.length).toBeGreaterThan(0);
    for (const [id, källa] of kontrollerade) {
      expect(new URL(källa.url!).pathname.length, id).toBeGreaterThan(1);
    }
  });

  it("aktiebolag och ekonomisk förening får var sin årsredovisningskälla", () => {
    const ab = getLegalTopicsFor("aktiebolag").map((topic) => topic.id);
    const ek = getLegalTopicsFor("ekonomisk_forening").map((topic) => topic.id);
    expect(ab).toContain("arsredovisning_ab");
    expect(ab).not.toContain("arsredovisning_ek_forening");
    expect(ek).toContain("arsredovisning_ek_forening");
    expect(ek).not.toContain("arsredovisning_ab");
  });

  it("aktiebolag har bolagsordning, styrelse och revisor som tre ämnen med var sin källa", () => {
    const ämnen = LEGAL_TOPICS.filter((topic) => ["bolagsordning", "styrelse", "revisor"].includes(topic.id));
    expect(ämnen).toHaveLength(3);
    expect(new Set(ämnen.map((topic) => KURERADE_KÄLLOR[topic.källId].url)).size).toBe(3);
    for (const topic of ämnen) expect(topic.gällerFör).toEqual(["aktiebolag"]);
  });
});
