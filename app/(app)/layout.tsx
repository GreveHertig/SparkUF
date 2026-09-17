import type { ReactNode } from "react";
import { AppShell } from "@/screens/AppShell";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { liveEvidenceRepository } from "@/adapters/live/EvidenceRepository";
import { NotImplementedError } from "@/core/errors";
import type { Profile } from "@/core/domain";

// Liveadaptrarna är stubbar tills P1 bygger dem (docs/moduler/profil.md,
// docs/moduler/evidens-och-poang.md) — shellen visar då en neutral platshållare
// i stället för att krascha. `locale` spelar ingen roll för poängsiffran och
// hårdkodas här; P1 avgör hur den riktiga adaptern får rätt språk.
const FALLBACK_PROFILE: Profile = { name: "—", initials: "—" };

export default async function LiveAppShellLayout({ children }: { children: ReactNode }) {
  const profile = await liveProfileRepository.getProfile().catch((error) => {
    if (error instanceof NotImplementedError) return FALLBACK_PROFILE;
    throw error;
  });

  const score = await liveEvidenceRepository
    .getScoreSnapshot("sv")
    .then((snapshot) => snapshot.total)
    .catch((error) => {
      if (error instanceof NotImplementedError) return null;
      throw error;
    });

  return (
    <AppShell homeHref="/app" profile={profile} score={score}>
      {children}
    </AppShell>
  );
}
