/**
 * Manuell bekräftelse av adress OCH text (docs/moduler/utskick-och-svar.md,
 * "Bekräftelse"). Ingenting får någonsin skickas till en riktig mottagare
 * utan att grundaren manuellt bekräftat båda, och ingen automatisk logik får
 * hoppa över det steget, nu eller i framtiden.
 *
 * `ConfirmedOutreach` är en typ som INGEN kod i repot kan skapa. Det är
 * avsiktligt: ingen konstruktör byggs förrän Theodor och grundaren uttryckligen
 * sagt ja till sändning. Den dag det sker skapas exakt en funktion, i den här
 * filen, som tar redigerad adress och redigerad text från en människohandling.
 *
 * Vaktat av ports/outreachConfirmation.guard.test.ts: ingen annan fil får
 * nämna brandet eller casta till typen.
 */
declare const CONFIRMED_BY_HUMAN: unique symbol;

export type ConfirmedOutreach = {
  readonly status: "confirmed";
  readonly [CONFIRMED_BY_HUMAN]: true;
  readonly address: string;
  readonly subject: string;
  readonly body: string;
  readonly confirmedByUserId: string;
  readonly confirmedAt: string;
};
