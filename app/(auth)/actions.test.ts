import { describe, it, expect, vi, beforeEach } from "vitest";

const signUpMock = vi.fn();
const signInWithPasswordMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("@/lib/server/supabase", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      signUp: signUpMock,
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
    },
  }),
}));

// Speglar next/navigation:s riktiga redirect(), som kastar internt för att
// avbryta renderingen — mocken låter testet se både VART den omdirigerar
// och att inget kod efter redirect() körs.
const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("app/(auth)/actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signUp", () => {
    it("validerar namn, e-post och lösenord innan Supabase anropas", async () => {
      const { signUp } = await import("./actions");
      const state = await signUp(undefined, formData({ name: "A", email: "inte-en-epost", password: "kort" }));

      expect(state?.fieldErrors?.name).toContain("name_too_short");
      expect(state?.fieldErrors?.email).toContain("email_invalid");
      expect(state?.fieldErrors?.password).toContain("password_too_short");
      expect(signUpMock).not.toHaveBeenCalled();
    });

    it("kräver minst en bokstav och en siffra i lösenordet", async () => {
      const { signUp } = await import("./actions");
      const state = await signUp(
        undefined,
        formData({ name: "Sara Lindqvist", email: "sara@exempel.se", password: "abcdefgh" }),
      );
      expect(state?.fieldErrors?.password).toContain("password_needs_number");
    });

    it("visar samma 'kolla din mejl'-svar för ett upptaget konto som för en ny registrering (skydd mot kontouppräkning)", async () => {
      signUpMock.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "User already registered", code: "user_already_exists" },
      });
      const { signUp } = await import("./actions");
      const state = await signUp(
        undefined,
        formData({ name: "Sara Lindqvist", email: "sara@exempel.se", password: "abcdefg1" }),
      );
      // Aldrig ett distinkt felmeddelande här — annars kan formuläret
      // användas för att lista ut vilka e-postadresser redan har konton.
      expect(state?.checkEmail).toBe(true);
      expect(state?.formError).toBeUndefined();
    });

    it("visar 'kolla din mejl' när kontot skapas utan session (e-postbekräftelse påslagen)", async () => {
      signUpMock.mockResolvedValue({ data: { user: { id: "u1" }, session: null }, error: null });
      const { signUp } = await import("./actions");
      const state = await signUp(
        undefined,
        formData({ name: "Sara Lindqvist", email: "sara@exempel.se", password: "abcdefg1" }),
      );
      expect(state?.checkEmail).toBe(true);
      expect(redirectMock).not.toHaveBeenCalled();
    });

    it("skickar namnet till Supabase som user_metadata, aldrig som en separat skrivning", async () => {
      signUpMock.mockResolvedValue({ data: { user: { id: "u1" }, session: null }, error: null });
      const { signUp } = await import("./actions");
      await signUp(undefined, formData({ name: "Sara Lindqvist", email: "sara@exempel.se", password: "abcdefg1" }));
      expect(signUpMock).toHaveBeenCalledWith({
        email: "sara@exempel.se",
        password: "abcdefg1",
        options: { data: { name: "Sara Lindqvist" } },
      });
    });

    it("omdirigerar till ett tillåtet ?next= efter en lyckad registrering med session", async () => {
      signUpMock.mockResolvedValue({ data: { user: { id: "u1" }, session: { access_token: "x" } }, error: null });
      const { signUp } = await import("./actions");
      await expect(
        signUp(
          undefined,
          formData({ name: "Sara Lindqvist", email: "sara@exempel.se", password: "abcdefg1", next: "/start" }),
        ),
      ).rejects.toThrow("NEXT_REDIRECT:/start");
    });

    it("faller tillbaka till /app om ?next= pekar utanför plattformen (open redirect-skydd)", async () => {
      signUpMock.mockResolvedValue({ data: { user: { id: "u1" }, session: { access_token: "x" } }, error: null });
      const { signUp } = await import("./actions");
      await expect(
        signUp(
          undefined,
          formData({
            name: "Sara Lindqvist",
            email: "sara@exempel.se",
            password: "abcdefg1",
            next: "https://evil.example/phish",
          }),
        ),
      ).rejects.toThrow("NEXT_REDIRECT:/app");
    });
  });

  describe("signIn", () => {
    it("mappar Supabases 'fel uppgifter'-fel till en generisk kod", async () => {
      signInWithPasswordMock.mockResolvedValue({
        error: { message: "Invalid login credentials", code: "invalid_credentials" },
      });
      const { signIn } = await import("./actions");
      const state = await signIn(undefined, formData({ email: "sara@exempel.se", password: "fel-lösenord" }));
      expect(state?.formError).toBe("invalid_credentials");
    });

    it("omdirigerar till /app som standard efter lyckad inloggning", async () => {
      signInWithPasswordMock.mockResolvedValue({ error: null });
      const { signIn } = await import("./actions");
      await expect(
        signIn(undefined, formData({ email: "sara@exempel.se", password: "abcdefg1" })),
      ).rejects.toThrow("NEXT_REDIRECT:/app");
    });
  });

  describe("signOut", () => {
    it("loggar ut och skickar till /logga-in", async () => {
      const { signOut } = await import("./actions");
      await expect(signOut()).rejects.toThrow("NEXT_REDIRECT:/logga-in");
      expect(signOutMock).toHaveBeenCalled();
    });
  });
});
