import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.react.ts"],
    include: ["src/**/*.test.tsx", "src/**/*.test.jsx"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
  plugins: [tsconfigPaths(), react()],
});
