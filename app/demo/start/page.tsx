"use client";

import { OnboardingEntry } from "@/screens/OnboardingEntry";
import { useDemoStore } from "@/adapters/demo/demoStore";

export default function DemoStartPage() {
  const setEntry = useDemoStore((state) => state.setEntry);

  return <OnboardingEntry data={{ basePath: "/demo/start", onChoose: setEntry }} />;
}
