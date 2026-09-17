import type { RegistryProvider } from "@/ports/RegistryProvider";

// Ingen skärm använder den här porten än — /demo/app steg 03–04 byggs i Session 3.
export const demoRegistryProvider: RegistryProvider = {
  async searchCompanies() {
    return [];
  },
};
