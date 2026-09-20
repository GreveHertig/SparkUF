import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OutreachLockedError, isPlaceholderError } from "@/core/errors";

const getCurrentUser = vi.fn();
vi.mock("@/lib/server/session", () => ({ getCurrentUser: () => getCurrentUser() }));

import { assertOutreachAccessAllowed } from "./outreachAccess";

const OK_ID = "00000000-0000-4000-8000-000000000001";
const saved = { ...process.env };

beforeEach(() => {
  getCurrentUser.mockReset();
  delete process.env.OUTREACH_LIVE_ENABLED;
  delete process.env.OUTREACH_ALLOWED_USER_IDS;
});
afterEach(() => {
  process.env = { ...saved };
});

function open(flag = "true", ids = OK_ID) {
  process.env.OUTREACH_LIVE_ENABLED = flag;
  process.env.OUTREACH_ALLOWED_USER_IDS = ids;
}

describe("assertOutreachAccessAllowed", () => {
  it("nekar som standard (ingen env)", async () => {
    getCurrentUser.mockResolvedValue({ id: OK_ID, email: null });
    await expect(assertOutreachAccessAllowed()).rejects.toBeInstanceOf(OutreachLockedError);
  });

  it("nekar när flaggan är på men allowlisten är tom", async () => {
    open("true", "");
    getCurrentUser.mockResolvedValue({ id: OK_ID, email: null });
    await expect(assertOutreachAccessAllowed()).rejects.toBeInstanceOf(OutreachLockedError);
  });

  it("nekar när flaggan är av men användaren finns i allowlisten", async () => {
    open("false");
    getCurrentUser.mockResolvedValue({ id: OK_ID, email: null });
    await expect(assertOutreachAccessAllowed()).rejects.toBeInstanceOf(OutreachLockedError);
  });

  it("nekar en annan användare", async () => {
    open();
    getCurrentUser.mockResolvedValue({ id: "00000000-0000-0000-0000-000000000000", email: null });
    await expect(assertOutreachAccessAllowed()).rejects.toBeInstanceOf(OutreachLockedError);
  });

  it("nekar utan session", async () => {
    open();
    getCurrentUser.mockResolvedValue(null);
    await expect(assertOutreachAccessAllowed()).rejects.toBeInstanceOf(OutreachLockedError);
  });

  it("släpper in tillåten användare när båda villkoren är uppfyllda (blanksteg/versaler tolereras)", async () => {
    open("true", ` other , ${OK_ID.toUpperCase()} `);
    getCurrentUser.mockResolvedValue({ id: OK_ID, email: null });
    await expect(assertOutreachAccessAllowed()).resolves.toBe(OK_ID);
  });

  it("frågar inte Supabase när flaggan är av", async () => {
    await expect(assertOutreachAccessAllowed()).rejects.toBeInstanceOf(OutreachLockedError);
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it("OutreachLockedError visas som ComingSoon (isPlaceholderError)", () => {
    expect(isPlaceholderError(new OutreachLockedError())).toBe(true);
  });
});
