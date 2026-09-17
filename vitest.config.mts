import { defineConfig } from "vitest/config";
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
  },
});
