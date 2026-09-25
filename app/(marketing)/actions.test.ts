import { describe, it, expect, vi, beforeEach } from "vitest";

const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock("@/lib/server/supabase", () => ({
  createSupabaseServerClient: async () => ({ from: fromMock }),
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

  it("sparar en giltig adress, trimmad och med gemener, utan att be om raden tillbaka", async () => {
    // Mocken returnerar ett rent löfte utan .select() — skulle funktionen
    // kedja på .select() kraschar testet.
    insertMock.mockResolvedValue({ error: null });
    const { joinWaitlist } = await import("./actions");
    const state = await joinWaitlist(undefined, formData("  Sara@Exempel.SE "));

    expect(fromMock).toHaveBeenCalledWith("waitlist");
    expect(insertMock).toHaveBeenCalledWith({ email: "sara@exempel.se" });
    expect(state).toEqual({ joined: true });
  });

  it.each(["", "inte-en-epost", "sara@", `${"a".repeat(250)}@exempel.se`])(
    "avvisar ogiltig adress %j innan Supabase anropas",
    async (email) => {
      const { joinWaitlist } = await import("./actions");
      const state = await joinWaitlist(undefined, formData(email));

      expect(state).toEqual({ fieldError: "email_invalid" });
      expect(insertMock).not.toHaveBeenCalled();
    },
  );

  it("ger samma svar för en adress som redan står på listan som för en ny (skydd mot uppräkning)", async () => {
    insertMock.mockResolvedValue({ error: null });
    const { joinWaitlist } = await import("./actions");
    const nyAdress = await joinWaitlist(undefined, formData("sara@exempel.se"));

    insertMock.mockResolvedValue({
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    });
    const dubblett = await joinWaitlist(undefined, formData("sara@exempel.se"));

    expect(dubblett).toEqual(nyAdress);
  });

  it("ger ett allmänt fel vid okänt databasfel, utan Supabases egen text", async () => {
    insertMock.mockResolvedValue({ error: { code: "42501", message: "permission denied" } });
    const { joinWaitlist } = await import("./actions");
    const state = await joinWaitlist(undefined, formData("sara@exempel.se"));

    expect(state).toEqual({ formError: "unexpected" });
  });

  it("ger ett allmänt fel om anropet kastar, i stället för att krascha sidan", async () => {
    insertMock.mockRejectedValue(new Error("nätverksfel"));
    const { joinWaitlist } = await import("./actions");
    const state = await joinWaitlist(undefined, formData("sara@exempel.se"));

    expect(state).toEqual({ formError: "unexpected" });
  });
});
