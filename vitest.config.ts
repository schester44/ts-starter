import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["apps/*", "packages/*", "apps/web/vitest.components.config.ts"],
    fileParallelism: false,
    reporters: process.env.GITHUB_ACTIONS
      ? ["default", "github-actions"]
      : ["default"],
  },
});
