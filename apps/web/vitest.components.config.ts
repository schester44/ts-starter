import { defineProject } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineProject({
  // @ts-expect-error vite version mismatch between vitest and project
  plugins: [tsConfigPaths(), react()],
  test: {
    name: "web-components",
    env: loadEnv("test", __dirname, ""),
    environment: "happy-dom",
    globals: true,
    include: ["**/*.ui.test.tsx"],
    exclude: ["node_modules/**", "dist/**"],
    setupFiles: [path.resolve(__dirname, "src/__testing__/setup-ui.ts")],
  },
});
