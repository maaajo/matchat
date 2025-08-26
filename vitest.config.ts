import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*test.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
  plugins: [tsconfigPaths()],
});
