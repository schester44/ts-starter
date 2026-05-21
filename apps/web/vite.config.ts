import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: true,
    allowedHosts: true,
  },
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nitro({ rollupConfig: { external: ["@opentelemetry/api", "@prisma/client"] } } as any),
    viteReact(),
    tailwindcss(),
  ],
  ssr: {
    external: ["@prisma/client", "@opentelemetry/api"],
  },
  build: {
    rollupOptions: {
      external: ["@opentelemetry/api"],
    },
  },
  optimizeDeps: {
    exclude: ["@prisma/client", "prisma"],
  },
});
