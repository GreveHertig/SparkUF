import type { ReactNode } from "react";
import { AppShell } from "@/screens/AppShell";
import { SignOutButton } from "@/components/spark/SignOutButton";
import { requireUser } from "@/lib/server/session";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { liveEvidenceRepository } from "@/adapters/live/EvidenceRepository";
import { isPlaceholderError } from "@/core/errors";
import type { Profile } from "@/core/domain";

// Liveadaptrarna kan fortfarande vara stubbar (NotImplementedError,
// docs/moduler/profil.md, docs/moduler/evidens-och-poang.md) ELLER klara men
// utan data än för ett nytt konto (EmptyStateError) — shellen visar då en
// neutral platshållare i stället för att krascha, i båda fallen
// (isPlaceholderError, core/errors.ts). `locale` spelar ingen roll för
// poängsiffran och hårdkodas här; en senare session avgör hur en klar
// adapter får rätt språk för sidhuvudet.
const FALLBACK_PROFILE: Profile = { name: "—", initials: "—" };

export default async function LiveAppShellLayout({ children }: { children: ReactNode }) {
  // Bindande sessionskontroll (docs/arkitektur.md) — proxy.ts har redan
  // omdirigerat de flesta obehöriga tidigare, men den här är den som gäller.
  await requireUser();

  const profile = await liveProfileRepository.getProfile().catch((error) => {
    if (isPlaceholderError(error)) return FALLBACK_PROFILE;
    throw error;
  });

  const score = await liveEvidenceRepository
    .getScoreSnapshot("sv")
    .then((snapshot) => snapshot.total)
    .catch((error) => {
      if (isPlaceholderError(error)) return null;
      throw error;
    });

  return (
    <AppShell homeHref="/app" profile={profile} score={score} headerRight={<SignOutButton />}>
      {children}
    </AppShell>
  );
}
