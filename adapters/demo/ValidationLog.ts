import type { ConversationAnswer, NewValidationContact, ValidationContact, ValidationLog } from "@/ports/ValidationLog";
import {
  CONTACTS_MAX,
  cleanAnswer,
  cleanCompanyName,
  companyKey,
  isContactChannel,
  isSizeClassKey,
  isValidPastDate,
  type ContactChannel,
} from "@/core/validationLog";
import { ValidationLogError } from "@/core/errors";

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Demots samtalslogg ligger i minnet och används inte av någon demosida:
 * demots Validering visar Saras manusstyrda utskick
 * (adapters/demo/OutreachProvider.ts). Finns för att varje port ska ha en
 * demoadapter och för kontraktstestet. Samma regler som liveadaptern och
 * databasen: ett bolag en gång, status aldrig bakåt, svar tas aldrig bort.
 */
export function createDemoValidationLog(): ValidationLog {
  let contacts: ValidationContact[] = [];
  let nextId = 0;

  const find = (id: string) => {
    const contact = contacts.find((candidate) => candidate.id === id);
    if (!contact) throw new ValidationLogError("invalid");
    return contact;
  };
  const replace = (next: ValidationContact) => {
    contacts = contacts.map((contact) => (contact.id === next.id ? next : contact));
    return next;
  };

  return {
    async getContacts() {
      return contacts.map((contact) => ({ ...contact }));
    },

    async addContact(input: NewValidationContact) {
      const companyName = cleanCompanyName(input?.companyName);
      if (!companyName) throw new ValidationLogError("invalid");
      const sizeClass = input.sizeClass ?? null;
      if (sizeClass !== null && !isSizeClassKey(sizeClass)) throw new ValidationLogError("invalid");
      if (contacts.length >= CONTACTS_MAX) throw new ValidationLogError("limit");
      if (contacts.some((contact) => companyKey(contact.companyName) === companyKey(companyName))) {
        throw new ValidationLogError("duplicate");
      }
      nextId += 1;
      const contact: ValidationContact = {
        id: `00000000-0000-4000-9000-${String(nextId).padStart(12, "0")}`,
        companyName,
        sizeClass,
        channel: null,
        status: "planned",
        contactedOnIso: null,
        answer: null,
        createdAtIso: new Date(Date.UTC(2026, 9, 4, 12, 0, nextId)).toISOString(),
      };
      contacts = [...contacts, contact];
      return { ...contact };
    },

    async markContacted(id: string, channel: ContactChannel, contactedOnIso: string) {
      if (!isContactChannel(channel) || !isValidPastDate(contactedOnIso, todayIso())) {
        throw new ValidationLogError("invalid");
      }
      const contact = find(id);
      if (contact.status !== "planned") throw new ValidationLogError("backwards");
      replace({ ...contact, status: "contacted", channel, contactedOnIso });
    },

    async markDeclined(id: string) {
      const contact = find(id);
      if (contact.status === "responded") throw new ValidationLogError("answered");
      if (contact.status === "declined") return;
      replace({ ...contact, status: "declined", contactedOnIso: contact.contactedOnIso ?? todayIso() });
    },

    async saveAnswer(id: string, channel: ContactChannel, rawAnswer: ConversationAnswer) {
      const answer = cleanAnswer(rawAnswer, todayIso());
      if (!answer || !isContactChannel(channel)) throw new ValidationLogError("invalid");
      const contact = find(id);
      return {
        ...replace({
          ...contact,
          status: "responded",
          channel,
          sizeClass: answer.sizeClass,
          contactedOnIso:
            contact.contactedOnIso && contact.contactedOnIso <= answer.respondedOnIso
              ? contact.contactedOnIso
              : answer.respondedOnIso,
          answer,
        }),
      };
    },

    async removeContact(id: string) {
      const contact = find(id);
      if (contact.status === "responded" || contact.status === "declined") throw new ValidationLogError("answered");
      contacts = contacts.filter((candidate) => candidate.id !== id);
    },
  };
}
