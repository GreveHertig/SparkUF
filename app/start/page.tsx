import { OnboardingEntry } from "@/screens/OnboardingEntry";

// Inget att hämta, bara navigation. Ingen `onChoose`: plattformen har ingen
// port att spara ingångsvalet till än (docs/moduler/profil.md).
export default function StartPage() {
  return <OnboardingEntry basePath="/start" />;
}
