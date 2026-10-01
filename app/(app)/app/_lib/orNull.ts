import { isPlaceholderError } from "@/core/errors";

/** Ett platshållarfel (stubbe, tomt konto eller stängd licensgrind) blir
 * `null` — skärmen visar då "Kommer snart" i just den sektionen (platshållare
 * per sektion, docs/plan-en-design.md). Ett äkta fel kastas vidare. */
export function orNull<T>(promise: Promise<T>): Promise<T | null> {
  return promise.catch((error) => {
    if (isPlaceholderError(error)) return null;
    throw error;
  });
}
