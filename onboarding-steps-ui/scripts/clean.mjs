// Removes build output, test output, dependencies and lock files so `bun run clean` can reinstall
// from scratch. Uses only Node built-ins because node_modules is one of the things it deletes.
import { existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const targets = [
  // Nuxt and Nitro build output, caches and the Netlify build directory.
  ".nuxt",
  ".output",
  ".nitro",
  ".cache",
  ".data",
  ".netlify",
  "dist",
  // Playwright and Vitest output.
  "test-results",
  "playwright-report",
  "coverage",
  // Dependencies and lock files for every package manager.
  "node_modules",
  "bun.lock",
  "bun.lockb",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
];

let removed = 0;
for (const target of targets) {
  const path = resolve(root, target);
  if (!existsSync(path)) continue;
  rmSync(path, { recursive: true, force: true });
  removed++;
  console.log(`removed ${target}`);
}
console.log(removed ? `Removed ${removed} item(s).` : "Nothing to remove.");
