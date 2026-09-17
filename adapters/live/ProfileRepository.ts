import type { ProfileRepository } from "@/ports/ProfileRepository";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/profil.md";

export const liveProfileRepository: ProfileRepository = {
  async getProfile() {
    throw new NotImplementedError("Profil", DOC);
  },
};
