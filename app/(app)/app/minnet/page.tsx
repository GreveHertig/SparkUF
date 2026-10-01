import { Memory, type MemoryData } from "@/screens/Memory";
import { liveMemoryRepository } from "@/adapters/live/MemoryRepository";
import { orNull } from "../_lib/orNull";
import { saveBrainNotes } from "./actions";

/**
 * Minnet i /app (PR 5, docs/plan-en-design.md). Liveadaptern är byggd, men en
 * profil som inte är ifylld ger `EmptyStateError`. De tre anropen fångas var
 * för sig (platshållare per sektion), så att Hjärnan och Spåret syns även när
 * profilen saknas. Minnet har inget låst läge, varken i demot eller här.
 */
export default async function LiveMemoryPage() {
  const [profile, brainNotes, trace] = await Promise.all([
    orNull(liveMemoryRepository.getProfileSummary("sv")),
    orNull(liveMemoryRepository.getBrainNotes()),
    orNull(liveMemoryRepository.getTraceEvents("sv")),
  ]);

  const data: MemoryData = { profile, brainNotes, trace };

  return <Memory data={data} dataKind="live" onSaveBrainNotes={saveBrainNotes} />;
}
