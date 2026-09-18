import { redirect } from "next/navigation";

// Demot ska alltid börja i onboardingen (avsnitt 9.1). Ersätter Eriks
// ursprungliga platshållare (mockPoäng ur lib/demo-data/mock.ts) — den filen
// rörs inte, men är inte längre importerad någonstans.
export default function DemoRootPage() {
  redirect("/demo/start");
}
