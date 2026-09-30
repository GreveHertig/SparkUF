"use client";

// Flyttade till screens/blocks/ i PR 5; exporteras vidare åt demots sidor
// som inte är flyttade till screens/ än.
export { Locked, PageHead, Pill, type PillTone } from "@/screens/blocks/PageBlocks";
// Flyttade till screens/blocks/ i PR 7, av samma skäl.
export { ExampleLabel, Figures, SimulationBlock, VerdictBlock, type Figure } from "@/screens/blocks/DataBlocks";
// Flyttade till screens/blocks/ i PR 10, av samma skäl (onboardingen använder ChatLine).
export { ChatLine, TimeSkipLine, ToolRun } from "@/screens/blocks/ChatBlocks";
