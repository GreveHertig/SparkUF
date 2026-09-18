import { expect } from "vitest";
import type { ProfileRepository } from "./ProfileRepository";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { describeContract, contractIt } from "./testContract";

describeContract<ProfileRepository>(
  "ProfileRepository",
  { demo: demoProfileRepository, live: liveProfileRepository },
  (profile) => {
    contractIt("getProfile returnerar namn och initialer", async () => {
      const result = await profile.getProfile();
      expect(result.name).toBeTruthy();
      expect(result.initials).toBeTruthy();
    });
  },
);
