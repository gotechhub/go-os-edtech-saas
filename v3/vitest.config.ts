import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["v3/platform/**/tests/**/*.test.ts", "v3/products/**/tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
