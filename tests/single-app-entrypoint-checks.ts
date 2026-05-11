import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const appRoot = resolve(root, "app");
const workspacesDoc = readFileSync(resolve(root, "docs", "WORKSPACES_ARCHITECTURE.md"), "utf8");

const allowedAppShellFiles = new Set([
  "favicon.ico",
  "globals.css",
  "layout.tsx",
  "manifest.ts",
  "page.tsx",
]);

const allowedTopLevelAppFolders = new Set(["api"]);
const forbiddenWorkspaceRouteSegments = new Set([
  "admin",
  "ai-assistant",
  "common",
  "common-processes",
  "dispatch",
  "fleet",
  "fuel",
  "gps",
  "mining-dispatch",
  "pto",
  "reports",
  "smts",
  "smts-gps",
  "taxation",
  "tb",
  "technique",
  "workspaces",
]);

function toRepoPath(path: string) {
  return relative(root, path).replace(/\\/g, "/");
}

function walkFiles(startPath: string): string[] {
  const stats = statSync(startPath);
  if (stats.isFile()) return [startPath];
  if (!stats.isDirectory()) return [];

  return readdirSync(startPath).flatMap((entryName) => walkFiles(join(startPath, entryName)));
}

const topLevelEntries = readdirSync(appRoot)
  .map((entryName) => ({
    name: entryName,
    path: join(appRoot, entryName),
  }));

const unexpectedTopLevelFiles = topLevelEntries
  .filter((entry) => statSync(entry.path).isFile())
  .map((entry) => entry.name)
  .filter((entryName) => !allowedAppShellFiles.has(entryName))
  .sort();

assert.deepEqual(
  unexpectedTopLevelFiles,
  [],
  "app/ must stay a small Next shell with only the known app-level files.",
);

const unexpectedTopLevelFolders = topLevelEntries
  .filter((entry) => statSync(entry.path).isDirectory())
  .map((entry) => entry.name)
  .filter((entryName) => !allowedTopLevelAppFolders.has(entryName))
  .sort();

assert.deepEqual(
  unexpectedTopLevelFolders,
  [],
  "Workspace pages must not be added as app/<workspace>/ routes; use the single shell and lazy primary content.",
);

const pageFiles = walkFiles(appRoot)
  .map(toRepoPath)
  .filter((path) => path.endsWith("/page.tsx") || path === "app/page.tsx")
  .sort();

assert.deepEqual(pageFiles, ["app/page.tsx"]);

const routeSegmentViolations = walkFiles(appRoot)
  .map(toRepoPath)
  .filter((path) => !path.startsWith("app/api/"))
  .filter((path) => path.split("/").some((segment) => forbiddenWorkspaceRouteSegments.has(segment)))
  .sort();

assert.deepEqual(
  routeSegmentViolations,
  [],
  "Workspace names must not appear as Next app route segments outside the shared API.",
);

const pageSource = readFileSync(resolve(appRoot, "page.tsx"), "utf8");
assert.match(pageSource, /import AppRoot from "@\/features\/app\/AppRoot"/);
assert.match(pageSource, /import \{ LoginScreen \} from "@\/features\/auth\/LoginScreen"/);
assert.match(pageSource, /cookies/);
assert.match(pageSource, /authRequired/);
assert.doesNotMatch(pageSource, /features\/(?:dispatch|fleet|fuel|pto|reports|safety-driving|workspaces)/);
assert.doesNotMatch(pageSource, /dynamic\(|useState|useEffect|fetch\(|\/api\/database|databaseRequest/);

assert.match(workspacesDoc, /Single app entrypoint/);
assert.match(workspacesDoc, /tests\/single-app-entrypoint-checks\.ts/);
assert.match(workspacesDoc, /Do not add `app\/<workspace>\/page\.tsx`/);
assert.match(workspacesDoc, /Subdomains may select a workspace, but they still enter through `app\/page\.tsx`/);

console.log("Single app entrypoint checks passed");
