import { OnboardingEntry } from "@/screens/OnboardingEntry";

// Inget att hämta, bara navigation. Ingen `onChoose`: plattformen sparar inte
// valet här. Ingång B skapar ett projekt på /start/ide, och /start/profil
// härleder ingången ur det (app/start/_lib/entry.ts).
export default function StartPage() {
  return <OnboardingEntry basePath="/start" />;
}
