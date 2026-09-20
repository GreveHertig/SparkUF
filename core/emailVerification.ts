/**
 * Verifiering av en adresskandidat från en modell. Ren logik, inga nätverksanrop.
 * En modell får aldrig hitta på en adress: den måste stå ordagrant i texten som
 * skickades till modellen, vara syntaktiskt ren och höra till rätt bolag.
 * Se docs/moduler/utskick-och-svar.md, "Verifiering".
 */

export type VerifyResult =
  | { ok: true; kind: "role" | "personal" }
  | { ok: false; reason: "syntax" | "not_in_page" | "domain_mismatch" };

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const ADDRESS_CHAR = /[A-Za-z0-9._%+-]/;

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

const LEGAL_WORDS = new Set(["ab", "aktiebolag", "hb", "kb", "och", "co", "the", "and"]);

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

/** Står adressen ordagrant i texten, som en egen adress (inte en del av en längre)? */
function appearsInPage(address: string, pageText: string): boolean {
  const hay = pageText.toLowerCase().replace(/mailto:/g, " ");
  const needle = address.toLowerCase();
  let from = 0;
  for (;;) {
    const at = hay.indexOf(needle, from);
    if (at === -1) return false;
    const before = at === 0 ? "" : hay[at - 1];
    const end = at + needle.length;
    const after = hay[end] ?? "";
    // En punkt följd av ett tecken fortsätter domänen (info@x.se.evil.com); en punkt före mellanrum är meningens slut.
    const continues = /[A-Za-z0-9-]/.test(after) || (after === "." && /[A-Za-z0-9-]/.test(hay[end + 1] ?? ""));
    if (!(before && ADDRESS_CHAR.test(before)) && !continues) return true;
    from = at + 1;
  }
}

/** Sista två etiketterna. Förenklad (ingen publik suffixlista); avvisar hellre än släpper igenom. */
function registrableDomain(host: string): string {
  return host.toLowerCase().split(".").slice(-2).join(".");
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function nameTokens(companyName: string): string[] {
  return fold(companyName)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !LEGAL_WORDS.has(t));
}

function domainBelongsToCompany(
  addressDomain: string,
  pageUrl: string,
  companyName: string,
): boolean {
  const pageHost = hostOf(pageUrl);
  if (pageHost && registrableDomain(addressDomain) === registrableDomain(pageHost)) return true;
  const sld = fold(registrableDomain(addressDomain).split(".")[0]).replace(/-/g, "");
  return nameTokens(companyName).some((token) => sld.includes(token));
}

export function verifyEmailCandidate(input: {
  candidate: string;
  /** Exakt den text som skickades till modellen. */
  pageText: string;
  pageUrl: string;
  companyName: string;
}): VerifyResult {
  const { candidate, pageText, pageUrl, companyName } = input;
  if (!isValidSyntax(candidate)) return { ok: false, reason: "syntax" };
  if (!appearsInPage(candidate, pageText)) return { ok: false, reason: "not_in_page" };
  const [local, domain] = candidate.split("@");
  if (!domainBelongsToCompany(domain, pageUrl, companyName)) {
    return { ok: false, reason: "domain_mismatch" };
  }
  return { ok: true, kind: ROLE_LOCALPARTS.has(local.toLowerCase()) ? "role" : "personal" };
}
