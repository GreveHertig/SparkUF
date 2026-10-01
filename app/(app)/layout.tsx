import type { ReactNode } from "react";
// Demots stil är appens stil (docs/plan-en-design.md, DESIGN.md). Skopad
// under .fd/.fdd — se PR 2 (skalet) för wrappern nedan, som demots egen
// layout (app/demo/layout.tsx) redan gör åt /demo.
import "@/design/site.css";
import { AppShell, type AppShellCurrentStep, type AppShellTabSlug } from "@/screens/AppShell";
import { SignOutButton } from "@/components/spark/SignOutButton";
import { requireUser } from "@/lib/server/session";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { liveEvidenceRepository } from "@/adapters/live/EvidenceRepository";
import { isPlaceholderError } from "@/core/errors";
import type { Profile } from "@/core/domain";

// Liveadaptrarna kan fortfarande vara stubbar (NotImplementedError,
// docs/moduler/profil.md, docs/moduler/resan.md) ELLER klara men utan data
// än för ett nytt konto (EmptyStateError) — shellen visar då en neutral
// platshållare i stället för att krascha, i båda fallen (isPlaceholderError,
// core/errors.ts). `locale` spelar ingen roll för brödsmulan och hårdkodas
// här; en senare session avgör hur en klar adapter får rätt språk för
// sidhuvudet. Poängen hämtas här för sidhuvudets lilla siffra (PR 4); ett
// platshållarfel (tomt konto) ger `null`, och skalet visar då luckan — aldrig
// en nolla.
const FALLBACK_PROFILE: Profile = { name: "—", initials: "—" };

// Flikarna länkar till sina sidor (PR 11). Pulsen tändes i steg 6 när
// /app/pulsen byggdes. Marknadsföring har bara en demosida än
// (docs/moduler/marknadsforing.md). En flik vars /app-sida saknas läggs
// till här.
const UNAVAILABLE_TABS: readonly AppShellTabSlug[] = ["marknadsforing"];

export default async function LiveAppShellLayout({ children }: { children: ReactNode }) {
  // Bindande sessionskontroll (docs/arkitektur.md) — proxy.ts har redan
  // omdirigerat de flesta obehöriga tidigare, men den här är den som gäller.
  await requireUser();

  const profile = await liveProfileRepository.getProfile().catch((error) => {
    if (isPlaceholderError(error)) return FALLBACK_PROFILE;
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

  const score = await liveEvidenceRepository
    .getScoreSnapshot("sv")
    .then((snapshot) => snapshot.total)
    .catch((error) => {
      if (isPlaceholderError(error)) return null;
      throw error;
    });

  return (
    <div className="fd">
      <div className="fdd">
        <AppShell
          homeHref="/app"
          navBasePath="/app"
          unavailableTabs={UNAVAILABLE_TABS}
          dataKind="live"
          profile={profile}
          currentStep={currentStep}
          score={score}
          headerRight={<SignOutButton />}
        >
          {children}
        </AppShell>
      </div>
    </div>
  );
}
