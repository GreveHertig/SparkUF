import { expect } from "vitest";
import type { BuildProvider, BuildStatus } from "./BuildProvider";
import { demoBuildProvider } from "@/adapters/demo/BuildProvider";
import { liveBuildProvider } from "@/adapters/live/BuildProvider";
import { describeContract, contractIt } from "./testContract";

const VALID_STATUSES: BuildStatus[] = ["not_started", "building", "published"];

const sampleBrief = {
  sammanfattning: "Test",
  målgrupp: "Testgrupp",
  sidor: ["Startsida"],
  ton: "Sakligt",
  underlag: [],
};

describeContract<BuildProvider>(
  "BuildProvider",
  { demo: demoBuildProvider, live: liveBuildProvider },
  (build) => {
    contractIt("startBuild ger en giltig status", async () => {
      const result = await build.startBuild(sampleBrief);
      expect(VALID_STATUSES).toContain(result.status);
    });

    contractIt("getStatus ger en giltig status, url bara när publicerad", async () => {
      const result = await build.getStatus();
      expect(VALID_STATUSES).toContain(result.status);
      if (result.status !== "published") {
        expect(result.url).toBeUndefined();
      }
    });

    contractIt("getSpec ger null eller en brief där varje underlag har en källa", async () => {
      const spec = await build.getSpec("sv");
      if (spec === null) return;
      expect(spec.sammanfattning).toBeTruthy();
      expect(Array.isArray(spec.sidor)).toBe(true);
      for (const claim of spec.underlag) {
        expect(claim.påstående).toBeTruthy();
        expect(claim.källa.namn).toBeTruthy();
        expect(claim.källa.hämtad).toBeTruthy();
      }
    });
  },
);
