import { defineProject } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";
import { loadEnv } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineProject({
  // @ts-expect-error fixme
  plugins: [tsConfigPaths({})],
  test: {
    env: loadEnv("test", path.resolve(__dirname, "../web"), ""),
    environment: "node",
    globals: true,
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**"],
  },
});
