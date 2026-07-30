import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  noExternal: ["@__APP_NAME__/queues", "@__APP_NAME__/observe", "@__APP_NAME__/workflows"],
  format: ["esm"],
  target: "node22",
  splitting: false,
  sourcemap: true,
  clean: true,
});
