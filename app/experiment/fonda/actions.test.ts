import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimit } from "@/lib/server/rateLimit";
import { HONEYPOT_FIELD } from "./_lib/waitlist";

const rpcMock = vi.fn();
const fromMock = vi.fn();
let requestHeaders = new Headers();

vi.mock("@/lib/server/supabase", () => ({
  createSupabaseServerClient: async () => ({ rpc: rpcMock, from: fromMock }),
}));

vi.mock("next/headers", () => ({
  headers: async () => requestHeaders,
}));

function formData(email: string, honeypot = ""): FormData {
  const data = new FormData();
  data.set("email", email);
  data.set(HONEYPOT_FIELD, honeypot);
  return data;
}

function fromIp(ip: string) {
  requestHeaders = new Headers({ "x-forwarded-for": `${ip}, 10.0.0.1` });
}

describe("app/experiment/fonda/actions: joinFondaWaitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimit();
    fromIp("203.0.113.7");
    rpcMock.mockResolvedValue({ data: null, error: null });
  });

  it("sparar via Oskars joinWaitlist och join_waitlist, aldrig direkt mot tabellen", async () => {
    const { joinFondaWaitlist } = await import("./actions");
    const state = await joinFondaWaitlist(undefined, formData("  Sara@Exempel.SE "));

    expect(state).toEqual({ status: "joined" });
    expect(rpcMock).toHaveBeenCalledWith("join_waitlist", { p_email: "sara@exempel.se" });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("ger samma svar för en adress som redan står på listan", async () => {
    const { joinFondaWaitlist } = await import("./actions");
    const first = await joinFondaWaitlist(undefined, formData("sara@exempel.se"));
    const again = await joinFondaWaitlist(undefined, formData("sara@exempel.se"));

    expect(again).toEqual(first);
  });

  it("svarar som vanligt men sparar inget när honeypot-fältet är ifyllt", async () => {
    const { joinFondaWaitlist } = await import("./actions");
    const state = await joinFondaWaitlist(undefined, formData("bot@exempel.se", "https://spam.example"));

    expect(state).toEqual({ status: "joined" });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("spärrar en IP efter fem försök i timmen, men inte andra IP", async () => {
    const { joinFondaWaitlist } = await import("./actions");
    for (let i = 0; i < 5; i++) {
      expect(await joinFondaWaitlist(undefined, formData(`sara${i}@exempel.se`))).toEqual({ status: "joined" });
    }
    const blocked = await joinFondaWaitlist(undefined, formData("sara5@exempel.se"));
    expect(blocked).toEqual({ status: "error", code: "rate_limited" });
    expect(rpcMock).toHaveBeenCalledTimes(5);

    fromIp("198.51.100.4");
    expect(await joinFondaWaitlist(undefined, formData("jonas@exempel.se"))).toEqual({ status: "joined" });
  });

  it("använder x-real-ip när x-forwarded-for saknas", async () => {
    const { joinFondaWaitlist } = await import("./actions");
    requestHeaders = new Headers({ "x-real-ip": "192.0.2.9" });
    for (let i = 0; i < 5; i++) await joinFondaWaitlist(undefined, formData(`a${i}@exempel.se`));
    expect(await joinFondaWaitlist(undefined, formData("b@exempel.se"))).toEqual({
      status: "error",
      code: "rate_limited",
    });
  });

  it("avvisar en ogiltig adress innan Supabase anropas", async () => {
    const { joinFondaWaitlist } = await import("./actions");
    const state = await joinFondaWaitlist(undefined, formData("inte-en-adress"));

    expect(state).toEqual({ status: "error", code: "email_invalid" });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("ger ett allmänt fel vid databasfel, utan Supabases egen text", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: "42501", message: "permission denied" } });
    const { joinFondaWaitlist } = await import("./actions");
    const state = await joinFondaWaitlist(undefined, formData("sara@exempel.se"));

    expect(state).toEqual({ status: "error", code: "unexpected" });
  });
});
