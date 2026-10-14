import { fileURLToPath } from "node:url";

import { defineVitestProject } from "@nuxt/test-utils/config";
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: { "#shared": fileURLToPath(new URL("./shared", import.meta.url)) } },
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts", "tests/api/**/*.test.ts"],
          testTimeout: 30000,
          hookTimeout: 180000,
        },
      },
      await defineVitestProject({
        test: {
          name: "nuxt",
          environment: "nuxt",
          include: ["tests/runtime/**/*.test.ts"],
          environmentOptions: {
            nuxt: { domEnvironment: "happy-dom", overrides: { devtools: { enabled: false } } },
          },
        },
      }),
    ],
  },
});
