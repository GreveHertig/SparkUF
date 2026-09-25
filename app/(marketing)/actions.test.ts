import { describe, it, expect, vi, beforeEach } from "vitest";

const rpcMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/server/supabase", () => ({
  createSupabaseServerClient: async () => ({ rpc: rpcMock, from: fromMock }),
}));

function formData(email: string): FormData {
  const data = new FormData();
  data.set("email", email);
  return data;
}

describe("app/(marketing)/actions: joinWaitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sparar en giltig adress, trimmad och med gemener, via join_waitlist och aldrig direkt mot tabellen", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    const { joinWaitlist } = await import("./actions");
    const state = await joinWaitlist(undefined, formData("  Sara@Exempel.SE "));

    expect(rpcMock).toHaveBeenCalledWith("join_waitlist", { p_email: "sara@exempel.se" });
    // Besökare har inga rättigheter på public.waitlist (migreringen).
    expect(fromMock).not.toHaveBeenCalled();
    expect(state).toEqual({ joined: true });
  });

  it.each(["", "inte-en-epost", "sara@", `${"a".repeat(250)}@exempel.se`])(
    "avvisar ogiltig adress %j innan Supabase anropas",
    async (email) => {
      const { joinWaitlist } = await import("./actions");
      const state = await joinWaitlist(undefined, formData(email));

      expect(state).toEqual({ fieldError: "email_invalid" });
      expect(rpcMock).not.toHaveBeenCalled();
    },
  );

  it("ger samma svar för en adress som redan står på listan som för en ny (skydd mot uppräkning)", async () => {
    // join_waitlist gör on conflict do nothing och returnerar void, så
    // databasen svarar likadant båda gångerna. Actionen får inte heller
    // skilja på dem.
    rpcMock.mockResolvedValue({ data: null, error: null });
    const { joinWaitlist } = await import("./actions");
    const nyAdress = await joinWaitlist(undefined, formData("sara@exempel.se"));
    const dubblett = await joinWaitlist(undefined, formData("sara@exempel.se"));

    expect(dubblett).toEqual(nyAdress);
    expect(rpcMock).toHaveBeenNthCalledWith(1, "join_waitlist", { p_email: "sara@exempel.se" });
    expect(rpcMock).toHaveBeenNthCalledWith(2, "join_waitlist", { p_email: "sara@exempel.se" });
  });

  it("ger ett allmänt fel vid okänt databasfel, utan Supabases egen text", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: "42501", message: "permission denied" } });
    const { joinWaitlist } = await import("./actions");
    const state = await joinWaitlist(undefined, formData("sara@exempel.se"));

    expect(state).toEqual({ formError: "unexpected" });
  });

  it("ger ett allmänt fel om anropet kastar, i stället för att krascha sidan", async () => {
    rpcMock.mockRejectedValue(new Error("nätverksfel"));
    const { joinWaitlist } = await import("./actions");
    const state = await joinWaitlist(undefined, formData("sara@exempel.se"));

    expect(state).toEqual({ formError: "unexpected" });
  });
});
