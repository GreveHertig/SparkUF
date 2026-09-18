import { OnboardingEntry } from "@/screens/OnboardingEntry";

// Inget att hämta — bara navigation, se screens/OnboardingEntry.tsx. Ingen
// `onChoose` här: plattformen har inget att spara ingångsvalet till innan P1.
export default function StartPage() {
  return <OnboardingEntry data={{ basePath: "/start" }} />;
}
