import { beforeEach, describe, expect, it } from "vitest";
import { OutreachRateLimitError } from "@/core/errors";
import { checkRateLimit, resetRateLimit } from "./rateLimit";

const limits = { perHour: 2, perDay: 3 };
beforeEach(resetRateLimit);

describe("checkRateLimit", () => {
  it("släpper igenom upp till timgränsen och nekar sedan", () => {
    checkRateLimit("u", limits, 0);
    checkRateLimit("u", limits, 1);
    expect(() => checkRateLimit("u", limits, 2)).toThrow(OutreachRateLimitError);
  });
  it("öppnar igen efter en timme men respekterar dygnsgränsen", () => {
    const h = 3_600_000;
    checkRateLimit("u", limits, 0);
    checkRateLimit("u", limits, 1);
    checkRateLimit("u", limits, h + 2);
    expect(() => checkRateLimit("u", limits, 2 * h)).toThrow(OutreachRateLimitError);
  });
  it("räknar per användare", () => {
    checkRateLimit("a", limits, 0);
    checkRateLimit("a", limits, 1);
    expect(() => checkRateLimit("b", limits, 2)).not.toThrow();
  });
});
