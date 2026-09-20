import { describe, expect, it } from "vitest";
import { nameMatchesHost, verifyEmailCandidate } from "./emailVerification";

const base = {
  companyName: "Ekbacka Redovisning AB",
  pageText: "Kontakta oss: info@ekbacka.se eller anna.svensson@ekbacka.se. Byrå: hej@webbyra.se",
};
const check = (candidate: string, over: Partial<typeof base> = {}) =>
  verifyEmailCandidate({ ...base, ...over, candidate });

describe("verifyEmailCandidate", () => {
  it("godtar en rollbaserad adress som står i texten och hör till bolaget, med sidans stavning", () => {
    expect(check("INFO@ekbacka.se")).toEqual({ ok: true, kind: "role", address: "info@ekbacka.se" });
  });
  it("flaggar personliga adresser", () => {
    expect(check("anna.svensson@ekbacka.se")).toMatchObject({ ok: true, kind: "personal" });
  });
  it("avvisar en påhittad adress som inte står i texten", () => {
    expect(check("kontakt@ekbacka.se")).toEqual({ ok: false, reason: "not_in_page" });
  });
  it("avvisar en adress som bara är en del av en längre adress", () => {
    for (const pageText of ["xinfo@ekbacka.se", "info@ekbacka.se.evil.com", "info@ekbacka.se_evil", "рinfo@ekbacka.se", "info@ekbacka.se@evil.com"]) {
      expect(check("info@ekbacka.se", { pageText })).toEqual({ ok: false, reason: "not_in_page" });
    }
  });
  it("godtar adress följd av meningens slut", () => {
    expect(check("info@ekbacka.se", { pageText: "Mejla info@ekbacka.se." }).ok).toBe(true);
  });
  it("avvisar nollbreddstecken, blanksteg och homoglyfer (NFKC)", () => {
    expect(check("info@ekbacka.se\u200B").ok).toBe(false);
    expect(check("info@ekbacka.se ").ok).toBe(false);
    expect(check("ｉnfo@ekbacka.se", { pageText: "ｉnfo@ekbacka.se" })).toEqual({ ok: false, reason: "syntax" });
  });
  it("avvisar syntaxfel, även etiketter som börjar eller slutar med bindestreck/punkt", () => {
    for (const c of ["info@ekbacka", "a..b@ekbacka.se", ".a@ekbacka.se", "a@-ekbacka.se", "a@ekbacka-.se"]) {
      expect(check(c, { pageText: c })).toEqual({ ok: false, reason: "syntax" });
    }
  });
  it("avvisar en främmande domän (webbyråns adress i sidfoten)", () => {
    expect(check("hej@webbyra.se")).toEqual({ ok: false, reason: "domain_mismatch" });
  });
  it("kopplar inte adressen till bolaget via sidan: en katalogsidas egen adress avvisas", () => {
    expect(check("support@katalogen.se", { pageText: "Acme AB på katalogen. support@katalogen.se" })).toEqual({
      ok: false,
      reason: "domain_mismatch",
    });
  });
  it("avvisar co.uk-förväxling och delade värdar", () => {
    const r = (name: string, address: string) =>
      verifyEmailCandidate({ candidate: address, pageText: address, companyName: name });
    expect(r("Foo Bar Ltd", "info@evil.co.uk")).toEqual({ ok: false, reason: "domain_mismatch" });
    expect(r("Victim Group Ltd", "info@victim.co.uk").ok).toBe(true);
    expect(r("Acme Konsult AB", "info@acme.vercel.app")).toEqual({ ok: false, reason: "domain_mismatch" });
    expect(r("Mail Xpress AB", "info@gmail.com")).toEqual({ ok: false, reason: "domain_mismatch" });
  });
  it("godtar bolagets namn som domän, även med bindestreck och hela namnet, men inte 'innehåller'", () => {
    expect(nameMatchesHost("mail.ekbacka.se", "Ekbacka Redovisning AB")).toBe(true);
    expect(nameMatchesHost("ekbacka-redovisning.com", "Ekbacka Redovisning AB")).toBe(true);
    expect(nameMatchesHost("ekbacka-scam.se", "Ekbacka Redovisning AB")).toBe(false);
    expect(nameMatchesHost("redovisning-billigt.se", "Ekbacka Redovisning AB")).toBe(false);
  });
  it("avvisar allt när namnet bara består av branschord", () => {
    expect(nameMatchesHost("svenskabygg.se", "Svenska Bygg AB")).toBe(false);
  });
});
