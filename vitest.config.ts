import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["platform/**/tests/**/*.test.ts", "products/**/tests/**/*.test.ts", "standards/**/tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
