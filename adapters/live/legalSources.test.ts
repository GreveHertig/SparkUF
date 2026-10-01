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
      if (id.startsWith("skatteverket")) return "www.skatteverket.se";
      if (id.startsWith("imy")) return "www.imy.se";
      if (id.startsWith("eurlex")) return "eur-lex.europa.eu";
      if (id.startsWith("konsumentverket")) return "www.konsumentverket.se";
      if (id === "riksdagen") return "www.riksdagen.se";
      throw new Error(`Okänd källa: ${id}`);
    };
    for (const [id, källa] of Object.entries(KURERADE_KÄLLOR) as [KällId, (typeof KURERADE_KÄLLOR)[KällId]][]) {
      expect(new URL(källa.url!).hostname, id).toBe(domänFör(id));
    }
  });

  it("alla källor utom den okontrollerade riksdagen pekar på en undersida, inte startsidan", () => {
    const kontrollerade = Object.entries(KURERADE_KÄLLOR).filter(([id]) => id !== "riksdagen");
    expect(kontrollerade.length).toBeGreaterThan(0);
    for (const [id, källa] of kontrollerade) {
      expect(new URL(källa.url!).pathname.length, id).toBeGreaterThan(1);
    }
  });

  it("varje ämne pekar på en källa som en människa kontrollerat (hämtad 2026-09-30 eller senare)", () => {
    for (const topic of LEGAL_TOPICS) {
      expect(KURERADE_KÄLLOR[topic.källId].hämtad >= "2026-09-30", topic.id).toBe(true);
    }
  });

  it("GDPR-förordningen pekar på den svenska versionen hos EUR-Lex", () => {
    expect(KURERADE_KÄLLOR.eurlex_gdpr.url).toContain("/legal-content/SV/");
  });

  it("rättslig grund och register för GDPR är två ämnen med var sin IMY-sida", () => {
    const ämnen = LEGAL_TOPICS.filter((topic) => ["gdpr_rattslig_grund", "gdpr_register"].includes(topic.id));
    expect(ämnen).toHaveLength(2);
    const urls = ämnen.map((topic) => KURERADE_KÄLLOR[topic.källId].url!);
    expect(new Set(urls).size).toBe(2);
    for (const url of urls) expect(new URL(url).hostname).toBe("www.imy.se");
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
