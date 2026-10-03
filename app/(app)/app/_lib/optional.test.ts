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
});
