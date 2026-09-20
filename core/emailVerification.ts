/**
 * Verifiering av en adresskandidat från en modell. Ren logik, inga nätverksanrop.
 * En modell får aldrig hitta på en adress: den måste stå ordagrant i texten som
 * skickades till modellen, vara syntaktiskt ren och tillhöra rätt bolag.
 * Se docs/moduler/utskick-och-svar.md, "Verifiering".
 *
 * Bolagskopplingen gäller ADRESSENS domän, inte sidans: en katalog- eller
 * konkurrentsida som råkar visa "Acme AB" får inte göra sin egen supportadress
 * till Acmes. Hellre avvisa än gissa; grundaren söker då manuellt.
 */

export type VerifyResult =
  | { ok: true; kind: "role" | "personal"; address: string }
  | { ok: false; reason: "syntax" | "not_in_page" | "domain_mismatch" };

const EMAIL_PATTERN =
  /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9_%+-])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
/** Tecken som gör att en träff är del av en längre adress (Unicode-bokstäver inräknade). */
const BEFORE_CHAR = /[\p{L}\p{N}._%+@-]/u;
const AFTER_CHAR = /[\p{L}\p{N}_%+@-]/u;

export const ROLE_LOCALPARTS: ReadonlySet<string> = new Set([
  "info",
  "kontakt",
  "contact",
  "hej",
  "hello",
  "kundtjanst",
  "support",
  "order",
  "ekonomi",
  "reception",
]);

const LEGAL_WORDS = new Set(["ab", "aktiebolag", "hb", "kb", "och", "co", "the", "and", "ltd", "inc"]);
/** Branschord som inte säger vilket bolag det är (används inte för att känna igen en domän). */
const GENERIC_WORDS = new Set([
  "redovisning", "redovisningsbyra", "byra", "konsult", "konsulter", "konsulting", "consulting",
  "bygg", "ekonomi", "service", "services", "solutions", "systems", "partners", "partner",
  "group", "gruppen", "sverige", "svenska", "sweden", "nordic", "nordiska", "revision",
  "revisionsbyra", "bokforing", "bokforingsbyra", "radgivning", "forvaltning", "holding", "invest",
]);

/** Tvådelade publika suffix. Förenklad lista; okända suffix behandlas som ett steg. */
const MULTI_SUFFIX = new Set([
  "co.uk", "org.uk", "ac.uk", "gov.uk", "com.au", "net.au", "org.au", "co.nz", "co.jp",
  "com.br", "co.za", "com.tr", "co.in",
]);
/** Delade värdar och fria mejltjänster: en adress eller sida där bevisar inget om bolaget. */
const UNTRUSTED_DOMAINS = [
  "vercel.app", "github.io", "wixsite.com", "blogspot.com", "netlify.app", "herokuapp.com",
  "pages.dev", "web.app", "firebaseapp.com", "wordpress.com", "myshopify.com", "square.site",
  "weebly.com", "webflow.io", "onrender.com", "azurewebsites.net", "appspot.com", "carrd.co",
  "linktr.ee", "facebook.com", "linkedin.com", "instagram.com",
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.se", "outlook.com", "outlook.se",
  "live.com", "live.se", "yahoo.com", "yahoo.se", "icloud.com", "me.com", "telia.com",
  "comhem.se", "spray.se", "passagen.se", "bredband.net",
];

function fold(text: string): string {
  return text
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/é/g, "e");
}

function isValidSyntax(address: string): boolean {
  if (address !== address.normalize("NFKC")) return false;
  if (/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}\s]/u.test(address)) return false;
  if (!EMAIL_PATTERN.test(address)) return false;
  const [local] = address.split("@");
  return local.length <= 64 && address.length <= 254 && !address.includes("..");
}

/** Den exakta träffen ur sidtexten (sidans egen stavning), som en egen adress, eller null. */
function findInPage(address: string, pageText: string): string | null {
  const hay = pageText.replace(/mailto:/gi, " ");
  const lower = hay.toLowerCase();
  const needle = address.toLowerCase();
  let from = 0;
  for (;;) {
    const at = lower.indexOf(needle, from);
    if (at === -1) return null;
    const end = at + needle.length;
    const before = at === 0 ? "" : Array.from(hay.slice(Math.max(0, at - 2), at)).at(-1) ?? "";
    const after = hay[end] ?? "";
    // En punkt följd av ett tecken fortsätter domänen (info@x.se.evil.com); en punkt före mellanrum är meningens slut.
    const continues = AFTER_CHAR.test(after) || (after === "." && AFTER_CHAR.test(hay[end + 1] ?? ""));
    if (!(before && BEFORE_CHAR.test(before)) && !continues) return hay.slice(at, end);
    from = at + 1;
  }
}

function domainParts(host: string): { sld: string } | null {
  const labels = host.toLowerCase().replace(/\.$/, "").split(".");
  if (labels.length < 2) return null;
  const last2 = labels.slice(-2).join(".");
  if (MULTI_SUFFIX.has(last2)) return labels.length >= 3 ? { sld: labels[labels.length - 3] } : null;
  return { sld: labels[labels.length - 2] };
}

function isUntrusted(host: string): boolean {
  const h = host.toLowerCase();
  return UNTRUSTED_DOMAINS.some((d) => h === d || h.endsWith(`.${d}`));
}

function companyTokens(companyName: string): { distinctive: string[]; full: string[] } {
  const tokens = fold(companyName)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !LEGAL_WORDS.has(t));
  return { distinctive: tokens.filter((t) => t.length >= 4 && !GENERIC_WORDS.has(t)), full: tokens };
}

/**
 * Bär värden bolagets namn? Strikt likhet (bindestreck bortsedda) mot bolagets
 * särskiljande ord, dessa ord ihop, eller hela namnet utan bolagsform, aldrig
 * "innehåller": `svenskabyggen-scam.se` är inte "Svenska Bygg" och `gmail.com`
 * är inte "Mail X". Saknar namnet särskiljande ord avvisas allt.
 */
export function nameMatchesHost(host: string, companyName: string): boolean {
  if (isUntrusted(host)) return false;
  const parts = domainParts(host);
  if (!parts) return false;
  const { distinctive, full } = companyTokens(companyName);
  if (distinctive.length === 0) return false;
  const sld = fold(parts.sld).replace(/-/g, "");
  return [distinctive[0], distinctive.join(""), full.join("")].includes(sld);
}

export function verifyEmailCandidate(input: {
  candidate: string;
  /** Exakt den text som skickades till modellen. */
  pageText: string;
  companyName: string;
}): VerifyResult {
  const { candidate, pageText, companyName } = input;
  if (!isValidSyntax(candidate)) return { ok: false, reason: "syntax" };
  const found = findInPage(candidate, pageText);
  if (found === null) return { ok: false, reason: "not_in_page" };
  const [local, domain] = found.split("@");
  if (!nameMatchesHost(domain, companyName)) return { ok: false, reason: "domain_mismatch" };
  return { ok: true, kind: ROLE_LOCALPARTS.has(local.toLowerCase()) ? "role" : "personal", address: found };
}
