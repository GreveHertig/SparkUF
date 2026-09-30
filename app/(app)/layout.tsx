import type { ReactNode } from "react";
// Demots stil är appens stil (docs/plan-en-design.md, DESIGN.md). Skopad
// under .fd/.fdd, så inget ändras förrän skärmarna använder klasserna.
import "@/design/site.css";
import { AppShell, type AppShellCurrentStep } from "@/screens/AppShell";
import { SignOutButton } from "@/components/spark/SignOutButton";
import { requireUser } from "@/lib/server/session";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { liveEvidenceRepository } from "@/adapters/live/EvidenceRepository";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { isPlaceholderError } from "@/core/errors";
import type { Profile, ScoreSnapshot } from "@/core/domain";

// Liveadaptrarna kan fortfarande vara stubbar (NotImplementedError,
// docs/moduler/profil.md, docs/moduler/evidens-och-poang.md, docs/moduler/resan.md)
// ELLER klara men utan data än för ett nytt konto (EmptyStateError) —
// shellen visar då en neutral platshållare i stället för att krascha, i
// alla tre fallen (isPlaceholderError, core/errors.ts). `locale` spelar
// ingen roll för poängsiffran/brödsmulan och hårdkodas här; en senare
// session avgör hur en klar adapter får rätt språk för sidhuvudet.
const FALLBACK_PROFILE: Profile = { name: "—", initials: "—" };

export default async function LiveAppShellLayout({ children }: { children: ReactNode }) {
  // Bindande sessionskontroll (docs/arkitektur.md) — proxy.ts har redan
  // omdirigerat de flesta obehöriga tidigare, men den här är den som gäller.
  await requireUser();

  const profile = await liveProfileRepository.getProfile().catch((error) => {
    if (isPlaceholderError(error)) return FALLBACK_PROFILE;
    throw error;
  });

  const scoreSnapshot: ScoreSnapshot | null = await liveEvidenceRepository
    .getScoreSnapshot("sv")
    .catch((error) => {
      if (isPlaceholderError(error)) return null;
      throw error;
    });

  const currentStep: AppShellCurrentStep | null = await liveJourneyRepository
    .getSteps("sv")
    .then((steps) => {
      const current = steps.find((step) => step.status === "current");
      return current ? { number: current.stepNumber, title: current.title, total: steps.length } : null;
    })
    .catch((error) => {
      if (isPlaceholderError(error)) return null;
      throw error;
    });

  return (
    <AppShell
      homeHref="/app"
      profile={profile}
      scoreSnapshot={scoreSnapshot}
      currentStep={currentStep}
      headerRight={<SignOutButton />}
    >
      {children}
    </AppShell>
  );
}
