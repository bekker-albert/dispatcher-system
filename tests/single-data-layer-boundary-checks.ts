import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const workspacesDoc = readFileSync(resolve(root, "docs", "WORKSPACES_ARCHITECTURE.md"), "utf8");

const uiRoots = [
  "features",
  "components",
  "shared",
] as const;

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const ignoredDirectoryNames = new Set([".git", ".next", "node_modules"]);

const forbiddenUiDataLayerPatterns = [
  /["']@\/lib\/server\/database/,
  /["']@\/lib\/server\/mysql/,
  /["']@\/lib\/supabase/,
  /["']\.\.\/(?:\.\.\/)*lib\/server\/database/,
  /["']\.\.\/(?:\.\.\/)*lib\/server\/mysql/,
  /["']\.\.\/(?:\.\.\/)*lib\/supabase/,
  /["']mysql2(?:\/promise)?["']/,
  /["']@supabase\/supabase-js["']/,
  /fetch\(\s*["'`]\/api\/database/,
  /databaseRequest\(/,
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

const violations = uiRoots.flatMap((uiRoot) => walkSourceFiles(resolve(root, uiRoot)))
  .flatMap((path) => {
    const source = readFileSync(path, "utf8");
    return forbiddenUiDataLayerPatterns.flatMap((pattern) => (
      pattern.test(source)
        ? [{ path: toRepoPath(path), pattern: String(pattern) }]
        : []
    ));
  });

assert.deepEqual(
  violations,
  [],
  "UI/workspace files must use the shared data layer and must not import server database clients or call /api/database directly.",
);

assert.match(workspacesDoc, /Single data layer boundary/);
assert.match(workspacesDoc, /tests\/single-data-layer-boundary-checks\.ts/);
assert.match(workspacesDoc, /UI and workspace screens must not import server database clients/);
assert.match(workspacesDoc, /Do not call `\/api\/database` directly from features/);

console.log("Single data layer boundary checks passed");
