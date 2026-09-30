"use client";

import { useDemoStore } from "@/adapters/demo/demoStore";
import { OnboardingEntry } from "@/screens/OnboardingEntry";
import { FONDA_DEMO_PATHS } from "../_lib/paths";

/** Val av ingång: demots val sparas i demoStore. Markupen ligger i skärmen. */
export default function FondaDemoStartPage() {
  const setEntry = useDemoStore((state) => state.setEntry);
  return <OnboardingEntry basePath={FONDA_DEMO_PATHS.start} onChoose={setEntry} />;
}
