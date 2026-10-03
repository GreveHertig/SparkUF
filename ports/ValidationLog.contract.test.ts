import { expect, vi } from "vitest";
import type { ConversationAnswer, ValidationLog } from "./ValidationLog";
import { createDemoValidationLog } from "@/adapters/demo/ValidationLog";
import { liveValidationLog } from "@/adapters/live/ValidationLog";
import { ValidationLogError } from "@/core/errors";
import { describeContract, contractIt } from "./testContract";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

const USER = "contract-test-user";
const PROJECT = "00000000-0000-4000-8000-0000000000aa";

// En fejkad klient per testfil: det som sparas i ett test syns i nästa, så
// varje test använder egna bolagsnamn. Databasens regler (RLS, triggern som
// hindrar status att gå bakåt, check-villkoren) prövas mot Postgres i
// supabase/migrations/validationContacts.pg.test.ts.
let n = 0;
const fake = makeSupabaseFake({
  projects: [{ id: PROJECT, user_id: USER, is_active: true }],
  validation_contacts: [],
});
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: async () => ({ supabase: withDefaults(fake), userId: USER }),
}));

/** Fejken sätter inga standardvärden, så det gör vi här, som migreringen. */
function withDefaults(client: typeof fake): typeof fake {
  return {
    ...client,
    from(table: string) {
      const builder = client.from(table);
      const insert = builder.insert.bind(builder);
      builder.insert = (payload) =>
        insert(
          (Array.isArray(payload) ? payload : [payload]).map((row) => ({
            id: crypto.randomUUID(),
            created_at: new Date(Date.UTC(2026, 9, 4, 12, 0, n++)).toISOString(),
            status: "planned",
            channel: null,
            contacted_on: null,
            responded_on: null,
            problem_stance: null,
            price_stance: null,
            price_tested_kr: null,
            counter_offer_kr: null,
            quote: null,
            ...row,
          })),
        );
      return builder;
    },
  };
}

const answer = (overrides: Partial<ConversationAnswer> = {}): ConversationAnswer => ({
  respondedOnIso: "2026-10-01",
  sizeClass: "tenToNineteen",
  problemStance: "confirms",
  priceStance: "accepts",
  priceTestedKr: 990,
  counterOfferKr: null,
  quote: "Vi lägger flera timmar i veckan på det här i dag.",
  ...overrides,
});

describeContract<ValidationLog>(
  "ValidationLog",
  { demo: createDemoValidationLog(), live: liveValidationLog },
  (log) => {
    contractIt("addContact lägger till ett planerat bolag, och listan är äldst först", async () => {
      const first = await log.addContact({ companyName: "  Kvittly   AB " });
      await log.addContact({ companyName: "Bokbyrån Norr", sizeClass: "fiveToNine" });
      expect(first.companyName).toBe("Kvittly AB");
      expect(first.status).toBe("planned");
      const names = (await log.getContacts()).map((contact) => contact.companyName);
      expect(names.indexOf("Kvittly AB")).toBeLessThan(names.indexOf("Bokbyrån Norr"));
    });

    contractIt("samma bolag två gånger nekas, oavsett stora bokstäver och mellanslag", async () => {
      await log.addContact({ companyName: "Dubblett Konsult" });
      await expect(log.addContact({ companyName: "dubblett  KONSULT" })).rejects.toBeInstanceOf(ValidationLogError);
    });

    contractIt("ett tomt namn eller en okänd storlek nekas", async () => {
      await expect(log.addContact({ companyName: "   " })).rejects.toBeInstanceOf(ValidationLogError);
      await expect(
        log.addContact({ companyName: "Okänd storlek AB", sizeClass: "huge" as never }),
      ).rejects.toBeInstanceOf(ValidationLogError);
    });

    contractIt("planerat → kontaktat → svarat, och svaret sparas rensat", async () => {
      const contact = await log.addContact({ companyName: "Flödet AB" });
      await log.markContacted(contact.id, "phone", "2026-09-29");
      const saved = await log.saveAnswer(
        contact.id,
        "phone",
        answer({ quote: "Det​ här  tar för mycket tid.", priceStance: "declines", counterOfferKr: 500 }),
      );
      expect(saved.status).toBe("responded");
      expect(saved.contactedOnIso).toBe("2026-09-29");
      expect(saved.answer).toMatchObject({ quote: "Det här tar för mycket tid.", counterOfferKr: 500, sizeClass: "tenToNineteen" });
      const listed = (await log.getContacts()).find((candidate) => candidate.id === contact.id);
      expect(listed?.answer?.priceStance).toBe("declines");
    });

    contractIt("status går aldrig bakåt: ett kontaktat bolag kan inte kontaktas igen", async () => {
      const contact = await log.addContact({ companyName: "Bakåt AB" });
      await log.markContacted(contact.id, "email", "2026-09-30");
      await expect(log.markContacted(contact.id, "email", "2026-10-01")).rejects.toBeInstanceOf(ValidationLogError);
    });

    contractIt("ett bolag som svarat kan inte bli nej tack eller tas bort", async () => {
      const contact = await log.addContact({ companyName: "Svarat AB" });
      await log.saveAnswer(contact.id, "meeting", answer());
      await expect(log.markDeclined(contact.id)).rejects.toBeInstanceOf(ValidationLogError);
      await expect(log.removeContact(contact.id)).rejects.toBeInstanceOf(ValidationLogError);
    });

    contractIt("ett nej tack kan bli ett svar, och ett planerat bolag kan tas bort", async () => {
      const declined = await log.addContact({ companyName: "Ångrade sig AB" });
      await log.markDeclined(declined.id);
      expect((await log.getContacts()).find((c) => c.id === declined.id)?.status).toBe("declined");
      const saved = await log.saveAnswer(declined.id, "phone", answer());
      expect(saved.status).toBe("responded");

      const planned = await log.addContact({ companyName: "Tas bort AB" });
      await log.removeContact(planned.id);
      expect((await log.getContacts()).some((c) => c.id === planned.id)).toBe(false);
    });

    contractIt("ett svar med datum i framtiden, för kort citat eller fel pris nekas", async () => {
      const contact = await log.addContact({ companyName: "Ogiltigt svar AB" });
      await expect(log.saveAnswer(contact.id, "phone", answer({ respondedOnIso: "2999-01-01" }))).rejects.toBeInstanceOf(
        ValidationLogError,
      );
      await expect(log.saveAnswer(contact.id, "phone", answer({ quote: "Ja." }))).rejects.toBeInstanceOf(ValidationLogError);
      await expect(log.saveAnswer(contact.id, "phone", answer({ priceTestedKr: 0 }))).rejects.toBeInstanceOf(
        ValidationLogError,
      );
      await expect(log.saveAnswer(contact.id, "fax" as never, answer())).rejects.toBeInstanceOf(ValidationLogError);
    });

    contractIt("ett okänt id ger ett fel, inte en tyst ändring", async () => {
      await expect(log.markDeclined("00000000-0000-4000-8000-00000000ffff")).rejects.toBeInstanceOf(ValidationLogError);
    });
  },
);
