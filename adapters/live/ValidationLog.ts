import type { NewValidationContact, ValidationContact, ValidationLog, ConversationAnswer } from "@/ports/ValidationLog";
import {
  CONTACTS_MAX,
  cleanAnswer,
  cleanCompanyName,
  companyKey,
  isContactChannel,
  isContactStatus,
  isPriceStance,
  isProblemStance,
  isSizeClassKey,
  isValidPastDate,
  type ContactChannel,
} from "@/core/validationLog";
import { EmptyStateError, NotImplementedError, ValidationLogError } from "@/core/errors";
import { requireSupabaseUser } from "@/lib/server/session";
import { getActiveProjectId } from "@/lib/server/activeProject";
import { stockholmToday } from "@/adapters/live/evidenceScore";

const DOC = "docs/moduler/validering.md";
const MODULE = "Valideringen";
const TABLE = "validation_contacts";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUMNS =
  "id, company_name, size_class, channel, status, contacted_on, responded_on, problem_stance, price_stance, price_tested_kr, counter_offer_kr, quote, created_at";

/** PostgREST och Postgres svar när tabellen saknas, t.ex. när migreringen inte är körd. */
function isMissing(error: { code?: string }): boolean {
  return ["PGRST205", "42P01"].includes(error.code ?? "");
}

/** Felmeddelandet bär bara databasens kod, aldrig dess text eller grundarens. */
function failure(error: { code?: string }, what: string): Error {
  if (isMissing(error)) return new NotImplementedError(MODULE, DOC);
  if (error.code === "23505") return new ValidationLogError("duplicate");
  // Triggern (status bakåt) och check-villkoren.
  if (error.code === "22023") return new ValidationLogError("backwards");
  if (error.code === "23514") return new ValidationLogError("invalid");
  return new Error(`${MODULE}: kunde inte ${what} (${error.code ?? "okänt fel"}).`);
}

type ContactRow = {
  id: string;
  company_name: string;
  size_class: string | null;
  channel: string | null;
  status: string;
  contacted_on: string | null;
  responded_on: string | null;
  problem_stance: string | null;
  price_stance: string | null;
  price_tested_kr: number | null;
  counter_offer_kr: number | null;
  quote: string | null;
  created_at: string;
};

/** En rad som vy. En okänd status (en framtida migrering) blir "planned",
 * och ett ofullständigt svar visas inte som svar, hellre än en krasch. */
export function toContact(row: ContactRow): ValidationContact {
  const status = isContactStatus(row.status) ? row.status : "planned";
  const answer: ConversationAnswer | null =
    status === "responded" &&
    row.responded_on &&
    isSizeClassKey(row.size_class) &&
    isProblemStance(row.problem_stance) &&
    isPriceStance(row.price_stance) &&
    row.price_tested_kr !== null &&
    row.quote
      ? {
          respondedOnIso: row.responded_on,
          sizeClass: row.size_class,
          problemStance: row.problem_stance,
          priceStance: row.price_stance,
          priceTestedKr: row.price_tested_kr,
          counterOfferKr: row.counter_offer_kr,
          quote: row.quote,
        }
      : null;
  return {
    id: row.id,
    companyName: row.company_name,
    sizeClass: isSizeClassKey(row.size_class) ? row.size_class : null,
    channel: isContactChannel(row.channel) ? row.channel : null,
    status: status === "responded" && !answer ? "contacted" : status,
    contactedOnIso: row.contacted_on,
    answer,
    createdAtIso: row.created_at,
  };
}

async function requireProject() {
  const { supabase, userId } = await requireSupabaseUser();
  const projectId = await getActiveProjectId(supabase, userId);
  if (!projectId) throw new EmptyStateError(MODULE, DOC);
  return { supabase, userId, projectId };
}

async function readRows(): Promise<ContactRow[]> {
  const { supabase, userId, projectId } = await requireProject();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(CONTACTS_MAX);
  if (error) throw failure(error, "läsa kontaktlistan");
  return (data ?? []) as ContactRow[];
}

async function findRow(id: string): Promise<ContactRow> {
  if (!UUID_PATTERN.test(id)) throw new ValidationLogError("invalid");
  const row = (await readRows()).find((candidate) => candidate.id === id);
  if (!row) throw new ValidationLogError("invalid");
  return row;
}

async function update(id: string, values: Record<string, unknown>, what: string): Promise<ContactRow> {
  const { supabase, userId, projectId } = await requireProject();
  const { data, error } = await supabase
    .from(TABLE)
    .update(values)
    .eq("id", id)
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw failure(error, what);
  if (!data) throw new ValidationLogError("invalid");
  return data as ContactRow;
}

/**
 * Valideringens samtalslogg mot Supabase (`public.validation_contacts`).
 * Användaren och projektet tas ur sessionen, aldrig ur indata. RLS och
 * triggern i migreringen är de bindande spärrarna; kontrollerna här ger
 * begripliga fel innan något skrivs.
 */
export const liveValidationLog: ValidationLog = {
  async getContacts() {
    return (await readRows()).map(toContact);
  },

  async addContact(input: NewValidationContact) {
    const companyName = cleanCompanyName(input?.companyName);
    if (!companyName) throw new ValidationLogError("invalid");
    const sizeClass = input.sizeClass ?? null;
    if (sizeClass !== null && !isSizeClassKey(sizeClass)) throw new ValidationLogError("invalid");

    const rows = await readRows();
    if (rows.length >= CONTACTS_MAX) throw new ValidationLogError("limit");
    if (rows.some((row) => companyKey(row.company_name) === companyKey(companyName))) {
      throw new ValidationLogError("duplicate");
    }

    const { supabase, userId, projectId } = await requireProject();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ user_id: userId, project_id: projectId, company_name: companyName, size_class: sizeClass })
      .select(COLUMNS)
      .single();
    if (error) throw failure(error, "spara bolaget");
    return toContact(data as ContactRow);
  },

  async markContacted(id: string, channel: ContactChannel, contactedOnIso: string) {
    if (!isContactChannel(channel) || !isValidPastDate(contactedOnIso, stockholmToday())) {
      throw new ValidationLogError("invalid");
    }
    const row = await findRow(id);
    if (row.status !== "planned") throw new ValidationLogError("backwards");
    await update(id, { status: "contacted", channel, contacted_on: contactedOnIso }, "markera bolaget som kontaktat");
  },

  async markDeclined(id: string) {
    const row = await findRow(id);
    if (row.status === "responded") throw new ValidationLogError("answered");
    if (row.status === "declined") return;
    await update(
      id,
      { status: "declined", contacted_on: row.contacted_on ?? stockholmToday() },
      "markera bolaget som nej tack",
    );
  },

  async saveAnswer(id: string, channel: ContactChannel, rawAnswer: ConversationAnswer) {
    const today = stockholmToday();
    const answer = cleanAnswer(rawAnswer, today);
    if (!answer || !isContactChannel(channel)) throw new ValidationLogError("invalid");
    const row = await findRow(id);
    const saved = await update(
      id,
      {
        status: "responded",
        channel,
        // Ett bolag som svarar har kontaktats, senast samma dag.
        contacted_on: row.contacted_on && row.contacted_on <= answer.respondedOnIso ? row.contacted_on : answer.respondedOnIso,
        responded_on: answer.respondedOnIso,
        size_class: answer.sizeClass,
        problem_stance: answer.problemStance,
        price_stance: answer.priceStance,
        price_tested_kr: answer.priceTestedKr,
        counter_offer_kr: answer.counterOfferKr,
        quote: answer.quote,
      },
      "spara svaret",
    );
    return toContact(saved);
  },

  async removeContact(id: string) {
    const row = await findRow(id);
    if (row.status === "responded" || row.status === "declined") throw new ValidationLogError("answered");
    const { supabase, userId, projectId } = await requireProject();
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .eq("project_id", projectId);
    if (error) throw failure(error, "ta bort bolaget");
  },
};
