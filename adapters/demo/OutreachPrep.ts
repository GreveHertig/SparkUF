import type { Locale } from "@/i18n/context";
import type { DraftInput, EmailLookupResult, OutreachDraft, OutreachPrep } from "@/ports/OutreachPrep";
import { buildOutreachDraft } from "@/core/outreachDraft";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import { saraCompanies } from "./RegistryProvider";

/**
 * Demoadapter: fiktiva adresser på `.example` (RFC 2606, reserverat och kan
 * aldrig nå en riktig brevlåda). Gör inga externa anrop och skickar inget.
 */

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "");
}

export const demoOutreachPrep: OutreachPrep = {
  async suggestEmail(companyName: string): Promise<EmailLookupResult> {
    const company = saraCompanies.find((c) => c.name.toLowerCase() === companyName.trim().toLowerCase());
    if (!company) return { companyName, suggestions: [], rejectedCount: 0, searchedUrl: null };
    const host = `${slug(company.name)}.example`;
    const url = `https://${host}/kontakt`;
    return {
      companyName: company.name,
      suggestions: [
        {
          status: "suggested",
          address: `info@${host}`,
          kind: "role",
          källa: { namn: host, hämtad: "2026-01-09", url },
        },
      ],
      rejectedCount: 0,
      searchedUrl: url,
    };
  },

  async draftMessage(input: DraftInput): Promise<Record<Locale, OutreachDraft>> {
    return {
      sv: buildOutreachDraft(input, sv, "sv"),
      en: buildOutreachDraft(input, en, "en"),
    };
  },
};
