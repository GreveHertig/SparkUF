import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": import.meta.dirname,
      "server-only": new URL("./test/stubs/server-only.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    // e2e/ körs av Playwright (`pnpm test:e2e`), inte av vitest.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
