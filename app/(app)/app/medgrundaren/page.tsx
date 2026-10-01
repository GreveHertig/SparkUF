import { Cofounder, type CofounderData } from "@/screens/Cofounder";

/**
 * Medgrundaren i /app (PR 10, docs/plan-en-design.md). Porten
 * (`CofounderAgent`) har bara `sendMessage`, och liveadaptern är en stubbe
 * (docs/moduler/medgrundaren.md). Ingen port ger samtalets aktuella moment
 * eller det som redan är känt, så båda sektionerna visar "Kommer snart".
 * Inget samtal hittas på och demots manus används aldrig här. Promptfältet
 * är avstängt, som i demot, tills adaptern är byggd.
 */
export default function LiveCofounderPage() {
  const data: CofounderData = { moment: null, context: null };
  return <Cofounder data={data} />;
}
