/**
 * Förslag på rättelse av vanliga stavfel i mejldomäner ("Menade du …?" i
 * väntelistans formulär). Bara ett förslag: formuläret skickar adressen som
 * den står om besökaren inte klickar.
 */

// Felstavat domännamn (utan toppdomän) → rätt domän.
const NAME_TYPOS: Record<string, string> = {
  gmial: "gmail.com",
  gmal: "gmail.com",
  gamil: "gmail.com",
  gmaill: "gmail.com",
  gmai: "gmail.com",
  gnail: "gmail.com",
  hotmial: "hotmail.com",
  hotmal: "hotmail.com",
  hotmai: "hotmail.com",
  hotmaill: "hotmail.com",
  outlok: "outlook.com",
  outllok: "outlook.com",
  outloook: "outlook.com",
  otlook: "outlook.com",
  iclod: "icloud.com",
  icoud: "icloud.com",
  icluod: "icloud.com",
  iclould: "icloud.com",
  icload: "icloud.com",
  iclud: "icloud.com",
};

// Rätt domännamn med felstavad toppdomän. Bara ".com"-varianter: hotmail.se
// och outlook.se finns på riktigt och ska lämnas i fred.
const TLD_TYPOS = new Set(["con", "cmo", "cm", "om", "vom", "comm"]);
const KNOWN_NAMES: Record<string, string> = {
  gmail: "gmail.com",
  hotmail: "hotmail.com",
  outlook: "outlook.com",
  icloud: "icloud.com",
};

/** Adressen med rättad domän, eller null om det inte finns något att föreslå. */
export function suggestEmailFix(email: string): string | null {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0) return null;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();
  const dot = domain.indexOf(".");
  if (dot <= 0 || dot === domain.length - 1) return null;
  const name = domain.slice(0, dot);
  const tld = domain.slice(dot + 1);

  const fixed = NAME_TYPOS[name] ?? (TLD_TYPOS.has(tld) ? KNOWN_NAMES[name] : undefined);
  return fixed && fixed !== domain ? `${local}@${fixed}` : null;
}
