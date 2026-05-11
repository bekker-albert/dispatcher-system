import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const preloaderSource = readFileSync(resolve(root, "features/app/useAppSectionPreloader.ts"), "utf8");
const performanceDoc = readFileSync(resolve(root, "docs/PERFORMANCE_2GB_RAM.md"), "utf8");

const preloadImports = preloaderSource.match(/load:\s*\(\)\s*=>\s*import\([^)]+\)/g) ?? [];
assert.deepEqual(
  preloadImports,
  [],
  "Idle preloading must stay disabled until a measured workspace warm-up is approved for the 2 GB RAM target.",
);

const forbiddenPreloadTargets = [
  "AdminPrimaryContent",
  "AiAssistantPrimaryContent",
  "CommonProcessesPrimaryContent",
  "FleetPrimaryContent",
  "FuelPrimaryContent",
  "PtoPrimaryContent",
  "ReportsPrimaryContent",
  "SafetyPrimaryContent",
  "WorkspaceOverviewPrimaryContent",
  "PtoDataPrimaryContent",
  "PtoDateDataPrimaryContent",
  "PtoBucketsDataPrimaryContent",
] as const;

for (const target of forbiddenPreloadTargets) {
  assert.doesNotMatch(
    preloaderSource,
    new RegExp(`import\\(["']@/features/app/${target}["']\\)`),
    `${target} must load on demand, not through idle preloading.`,
  );
}

assert.match(preloaderSource, /requestIdleCallback/);
assert.match(preloaderSource, /cancelIdleCallback/);
assert.match(preloaderSource, /setTimeout\(callback, 1200\)/);
assert.match(preloaderSource, /if \(!enabled\) return undefined/);
assert.match(preloaderSource, /\.filter\(\(preloader\) => preloader\.key !== activeTab\)/);
assert.match(preloaderSource, /const completedPreloaders = new Set<string>\(\)/);
assert.match(preloaderSource, /completedPreloaders\.add\(preloadSection\.key\)/);
assert.match(preloaderSource, /const ptoSectionPreloaders: SectionPreloader\[\] = \[\s*\/\/ PTO is intentionally not preloaded/);

assert.match(performanceDoc, /Idle preloading is currently disabled for primary workspaces/);
assert.match(performanceDoc, /must not preload PTO date grids, reports, admin tools, fuel, fleet, SMTS, AI, Горная/);
assert.match(performanceDoc, /tests\/section-preloader-guardrails-checks\.ts/);

console.log("Section preloader guardrails checks passed");
