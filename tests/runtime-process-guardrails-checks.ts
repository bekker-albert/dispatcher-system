import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const performanceDoc = readFileSync(resolve(root, "docs", "PERFORMANCE_2GB_RAM.md"), "utf8");

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const ignoredDirectoryNames = new Set([".git", ".next", "node_modules"]);

const runtimeScanRoots = [
  "app",
  "components",
  "features",
  "lib/domain",
  "lib/server",
  "shared",
] as const;

const residentTimerScanRoots = [
  "features/ai-assistant",
  "features/workspaces",
  "app/api",
  "lib/server/database",
] as const;

const forbiddenProcessPatterns = [
  /\bfrom\s+["']node:child_process["']/,
  /\bfrom\s+["']child_process["']/,
  /\brequire\(["'](?:node:)?child_process["']\)/,
  /\bfrom\s+["']node:worker_threads["']/,
  /\bfrom\s+["']worker_threads["']/,
  /\brequire\(["'](?:node:)?worker_threads["']\)/,
  /\bfrom\s+["']node:cluster["']/,
  /\bfrom\s+["']cluster["']/,
  /\brequire\(["'](?:node:)?cluster["']\)/,
  /\bnew\s+Worker\s*\(/,
  /\bnew\s+SharedWorker\s*\(/,
  /\bwhile\s*\(\s*true\s*\)/,
] as const;

const forbiddenResidentTimerPatterns = [
  /\bsetInterval\s*\(/,
  /\bwindow\.setInterval\s*\(/,
  /\bglobalThis\.setInterval\s*\(/,
] as const;

function extension(path: string) {
  const name = basename(path);
  const dotIndex = name.lastIndexOf(".");
  return dotIndex >= 0 ? name.slice(dotIndex) : "";
}

function walkSourceFiles(startPath: string): string[] {
  const stats = statSync(startPath);
  if (stats.isFile()) return sourceExtensions.has(extension(startPath)) ? [startPath] : [];
  if (!stats.isDirectory()) return [];

  return readdirSync(startPath).flatMap((entryName) => {
    if (ignoredDirectoryNames.has(entryName)) return [];
    return walkSourceFiles(join(startPath, entryName));
  });
}

function toRepoPath(path: string) {
  return relative(root, path).replace(/\\/g, "/");
}

function collectPatternViolations(
  roots: readonly string[],
  patterns: readonly RegExp[],
) {
  return roots.flatMap((scanRoot) => walkSourceFiles(resolve(root, scanRoot)))
    .flatMap((path) => {
      const source = readFileSync(path, "utf8");
      return patterns.flatMap((pattern) => (
        pattern.test(source)
          ? [{ path: toRepoPath(path), pattern: String(pattern) }]
          : []
      ));
    });
}

assert.deepEqual(
  collectPatternViolations(runtimeScanRoots, forbiddenProcessPatterns),
  [],
  "Runtime app/module code must not start child processes, worker threads, web workers, cluster workers, or infinite loops.",
);

assert.deepEqual(
  collectPatternViolations(residentTimerScanRoots, forbiddenResidentTimerPatterns),
  [],
  "AI/workspace/server database code must not add resident polling loops; use manual, event-driven, or scheduled queued work.",
);

assert.match(performanceDoc, /Runtime process guardrail/);
assert.match(performanceDoc, /tests\/runtime-process-guardrails-checks\.ts/);
assert.match(performanceDoc, /Do not add child_process, worker_threads, cluster, Web Workers, or resident polling loops/);
assert.match(performanceDoc, /AI and workspace work must stay manual, event-driven, or scheduled queued work/);

console.log("Runtime process guardrails checks passed");
