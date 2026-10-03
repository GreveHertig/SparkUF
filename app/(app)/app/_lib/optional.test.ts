import { describe, expect, it, vi } from "vitest";
import { NotImplementedError } from "@/core/errors";
import { optional } from "./optional";

describe("optional (kompletterande data)", () => {
  it("ett värde går igenom, ett platshållarfel blir null utan logg", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await optional(Promise.resolve(3), "x")).toBe(3);
    expect(await optional(Promise.reject(new NotImplementedError("M", "d")), "x")).toBeNull();
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("ett äkta fel blir null och loggas utan sitt meddelande", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await optional(Promise.reject(new Error("hemligt databassvar")), "Pulsen: Min plan")).toBeNull();
    const logged = log.mock.calls.flat().join(" ");
    expect(logged).toContain("Pulsen: Min plan");
    expect(logged).not.toContain("hemligt");
    log.mockRestore();
  });

  it("Nexts signaler kastas vidare utan logg: cookies() under förrenderingen och redirect()", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    // Samma form som Nexts DynamicServerError och redirect-fel (digest).
    const dynamic = Object.assign(new Error("Dynamic server usage: cookies"), { digest: "DYNAMIC_SERVER_USAGE" });
    await expect(optional(Promise.reject(dynamic), "Pulsen: Profilen")).rejects.toBe(dynamic);
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/logga-in;307;" });
    await expect(optional(Promise.reject(redirect), "Resan: Min plan")).rejects.toBe(redirect);
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
