import type { ProfileRepository } from "@/ports/ProfileRepository";
import { saraProfile } from "./sara";

export const demoProfileRepository: ProfileRepository = {
  async getProfile() {
    return saraProfile;
  },
};
