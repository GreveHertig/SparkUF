import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimit } from "@/lib/server/rateLimit";
import { HONEYPOT_FIELD } from "./_lib/waitlist";

const rpcMock = vi.fn();
const resolveMxMock = vi.hoisted(() => vi.fn());
const fromMock = vi.fn();
let requestHeaders = new Headers();

vi.mock("@/lib/server/supabase", () => ({
  createSupabaseServerClient: async () => ({ rpc: rpcMock, from: fromMock }),
}));

vi.mock("next/headers", () => ({
  headers: async () => requestHeaders,
}));

// DNS mockas alltid: testerna ska aldrig gå ut på nätet.
vi.mock("node:dns/promises", () => ({ resolveMx: resolveMxMock, default: { resolveMx: resolveMxMock } }));

function dnsError(code: string): NodeJS.ErrnoException {
  return Object.assign(new Error(`queryMx ${code}`), { code });
}

function formData(email: string, honeypot = ""): FormData {
  const data = new FormData();
  data.set("email", email);
  data.set(HONEYPOT_FIELD, honeypot);
  return data;
}

function fromIp(ip: string) {
  requestHeaders = new Headers({ "x-forwarded-for": `${ip}, 10.0.0.1` });
}

describe("app/(marketing)/landingActions: joinLandingWaitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimit();
    fromIp("203.0.113.7");
    rpcMock.mockResolvedValue({ data: null, error: null });
    resolveMxMock.mockResolvedValue([{ exchange: "mx.exempel.se", priority: 10 }]);
  });

  it("sparar via Oskars joinWaitlist och join_waitlist, aldrig direkt mot tabellen", async () => {
    const { joinLandingWaitlist } = await import("./landingActions");
    const state = await joinLandingWaitlist(undefined, formData("  Sara@Exempel.SE "));

    expect(state).toEqual({ status: "joined" });
    expect(rpcMock).toHaveBeenCalledWith("join_waitlist", { p_email: "sara@exempel.se" });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("ger samma svar för en adress som redan står på listan", async () => {
    const { joinLandingWaitlist } = await import("./landingActions");
    const first = await joinLandingWaitlist(undefined, formData("sara@exempel.se"));
    const again = await joinLandingWaitlist(undefined, formData("sara@exempel.se"));

    expect(again).toEqual(first);
  });

  it("svarar som vanligt men sparar inget när honeypot-fältet är ifyllt", async () => {
    const { joinLandingWaitlist } = await import("./landingActions");
    const state = await joinLandingWaitlist(undefined, formData("bot@exempel.se", "https://spam.example"));

    expect(state).toEqual({ status: "joined" });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("spärrar en IP efter fem försök i timmen, men inte andra IP", async () => {
    const { joinLandingWaitlist } = await import("./landingActions");
    for (let i = 0; i < 5; i++) {
      expect(await joinLandingWaitlist(undefined, formData(`sara${i}@exempel.se`))).toEqual({ status: "joined" });
    }
    const blocked = await joinLandingWaitlist(undefined, formData("sara5@exempel.se"));
    expect(blocked).toEqual({ status: "error", code: "rate_limited" });
    expect(rpcMock).toHaveBeenCalledTimes(5);

    fromIp("198.51.100.4");
    expect(await joinLandingWaitlist(undefined, formData("jonas@exempel.se"))).toEqual({ status: "joined" });
  });

  it("använder x-real-ip när x-forwarded-for saknas", async () => {
    const { joinLandingWaitlist } = await import("./landingActions");
    requestHeaders = new Headers({ "x-real-ip": "192.0.2.9" });
    for (let i = 0; i < 5; i++) await joinLandingWaitlist(undefined, formData(`a${i}@exempel.se`));
    expect(await joinLandingWaitlist(undefined, formData("b@exempel.se"))).toEqual({
      status: "error",
      code: "rate_limited",
    });
  });

  it("avvisar en ogiltig adress innan Supabase anropas", async () => {
    const { joinLandingWaitlist } = await import("./landingActions");
    const state = await joinLandingWaitlist(undefined, formData("inte-en-adress"));

    expect(state).toEqual({ status: "error", code: "email_invalid" });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("ger ett allmänt fel vid databasfel, utan Supabases egen text", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: "42501", message: "permission denied" } });
    const { joinLandingWaitlist } = await import("./landingActions");
    const state = await joinLandingWaitlist(undefined, formData("sara@exempel.se"));

    expect(state).toEqual({ status: "error", code: "unexpected" });
  });

  describe("MX-kontrollen", () => {
    it.each(["ENOTFOUND", "ENODATA"])("stoppar en domän utan MX-poster (%s) innan något sparas", async (code) => {
      resolveMxMock.mockRejectedValue(dnsError(code));
      const { joinLandingWaitlist } = await import("./landingActions");
      const state = await joinLandingWaitlist(undefined, formData("sara@finnsinte-exempel.se"));

      expect(state).toEqual({ status: "error", code: "email_undeliverable" });
      expect(resolveMxMock).toHaveBeenCalledWith("finnsinte-exempel.se");
      expect(rpcMock).not.toHaveBeenCalled();
    });

    it("stoppar en domän med null MX (RFC 7505)", async () => {
      resolveMxMock.mockResolvedValue([{ exchange: "", priority: 0 }]);
      const { joinLandingWaitlist } = await import("./landingActions");
      expect(await joinLandingWaitlist(undefined, formData("sara@exempel.se"))).toEqual({
        status: "error",
        code: "email_undeliverable",
      });
    });

    it("släpper igenom gmail.com, som har MX-poster", async () => {
      resolveMxMock.mockResolvedValue([{ exchange: "gmail-smtp-in.l.google.com", priority: 5 }]);
      const { joinLandingWaitlist } = await import("./landingActions");
      const state = await joinLandingWaitlist(undefined, formData("Sara@Gmail.com"));

      expect(resolveMxMock).toHaveBeenCalledWith("gmail.com");
      expect(state).toEqual({ status: "joined" });
      expect(rpcMock).toHaveBeenCalledWith("join_waitlist", { p_email: "sara@gmail.com" });
    });

    it("släpper igenom när DNS-uppslaget tar mer än 3 sekunder", async () => {
      vi.useFakeTimers();
      try {
        resolveMxMock.mockReturnValue(new Promise(() => {}));
        const { joinLandingWaitlist } = await import("./landingActions");
        const pending = joinLandingWaitlist(undefined, formData("sara@langsam-dns.se"));
        await vi.advanceTimersByTimeAsync(3000);

        expect(await pending).toEqual({ status: "joined" });
        expect(rpcMock).toHaveBeenCalledWith("join_waitlist", { p_email: "sara@langsam-dns.se" });
      } finally {
        vi.useRealTimers();
      }
    });

    it.each(["ESERVFAIL", "ETIMEOUT", "ECONNREFUSED"])("släpper igenom vid annat DNS-fel (%s)", async (code) => {
      resolveMxMock.mockRejectedValue(dnsError(code));
      const { joinLandingWaitlist } = await import("./landingActions");
      expect(await joinLandingWaitlist(undefined, formData("sara@exempel.se"))).toEqual({ status: "joined" });
    });

    it("slår inte upp något för en adress utan domän; den avvisas som ogiltig", async () => {
      const { joinLandingWaitlist } = await import("./landingActions");
      expect(await joinLandingWaitlist(undefined, formData("inte-en-adress"))).toEqual({
        status: "error",
        code: "email_invalid",
      });
      expect(resolveMxMock).not.toHaveBeenCalled();
    });
  });
});
