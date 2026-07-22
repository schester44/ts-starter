import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/generator.ts"],
  format: ["cjs"],
  outExtension: () => ({ js: ".cjs" }),
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node20",
  banner: {
    js: "#!/usr/bin/env node",
  },
});
