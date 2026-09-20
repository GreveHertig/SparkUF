import { describe, expect, it } from "vitest";
import { verifyEmailCandidate } from "./emailVerification";

const base = {
  pageUrl: "https://www.ekbacka.se/kontakt",
  companyName: "Ekbacka Redovisning AB",
  pageText: "Kontakta oss: info@ekbacka.se eller anna.svensson@ekbacka.se. Byrå: hej@webbyra.se",
};
const check = (candidate: string, over: Partial<typeof base> = {}) =>
  verifyEmailCandidate({ ...base, ...over, candidate });

describe("verifyEmailCandidate", () => {
  it("godtar en rollbaserad adress som står i texten och hör till bolaget", () => {
    expect(check("info@ekbacka.se")).toEqual({ ok: true, kind: "role" });
  });
  it("flaggar personliga adresser", () => {
    expect(check("anna.svensson@ekbacka.se")).toEqual({ ok: true, kind: "personal" });
  });
  it("avvisar en påhittad adress som inte står i texten", () => {
    expect(check("kontakt@ekbacka.se")).toEqual({ ok: false, reason: "not_in_page" });
  });
  it("avvisar en adress som bara är en del av en längre adress", () => {
    expect(check("info@ekbacka.se", { pageText: "xinfo@ekbacka.se" })).toEqual({
      ok: false,
      reason: "not_in_page",
    });
    expect(check("info@ekbacka.se", { pageText: "info@ekbacka.se.evil.com" })).toEqual({
      ok: false,
      reason: "not_in_page",
    });
  });
  it("avvisar nollbreddstecken, blanksteg och homoglyfer (NFKC)", () => {
    expect(check("info@ekbacka.se​").ok).toBe(false);
    expect(check("info@ekbacka.se ", {}).ok).toBe(false);
    expect(check("info@ekbacka.se", { pageText: "info@ekbacka.se" }).ok).toBe(true);
    expect(check("ｉnfo@ekbacka.se", { pageText: "ｉnfo@ekbacka.se" })).toEqual({ ok: false, reason: "syntax" });
  });
  it("avvisar syntaxfel", () => {
    expect(check("info@ekbacka")).toEqual({ ok: false, reason: "syntax" });
    expect(check("a..b@ekbacka.se")).toEqual({ ok: false, reason: "syntax" });
  });
  it("avvisar en främmande domän (webbyråns adress i sidfoten)", () => {
    expect(check("hej@webbyra.se")).toEqual({ ok: false, reason: "domain_mismatch" });
  });
  it("godtar en annan domän om den bär bolagets namn", () => {
    const r = check("info@ekbacka-redovisning.com", {
      pageText: "info@ekbacka-redovisning.com",
      pageUrl: "https://portal.example.org/x",
    });
    expect(r).toEqual({ ok: true, kind: "role" });
  });
  it("godtar mailto: och är okänslig för versaler", () => {
    expect(check("info@ekbacka.se", { pageText: "mailto:INFO@Ekbacka.SE" }).ok).toBe(true);
  });
});
