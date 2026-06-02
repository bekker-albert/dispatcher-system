import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const appApiRoot = resolve(root, "app", "api");
const databaseRoutePath = resolve(appApiRoot, "database", "route.ts");
const workspacesDoc = readFileSync(resolve(root, "docs", "WORKSPACES_ARCHITECTURE.md"), "utf8");

const allowedTopLevelApiFolders = new Set(["auth", "database", "wialon"]);
const forbiddenWorkspaceApiSegments = new Set([
  "ai-assistant",
  "admin",
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

function walkRouteFiles(startPath: string): string[] {
  const stats = statSync(startPath);
  if (stats.isFile()) return basename(startPath) === "route.ts" ? [startPath] : [];
  if (!stats.isDirectory()) return [];

  return readdirSync(startPath).flatMap((entryName) => walkRouteFiles(join(startPath, entryName)));
}

const topLevelApiFolders = readdirSync(appApiRoot)
  .filter((entryName) => statSync(join(appApiRoot, entryName)).isDirectory())
  .sort();

const unexpectedTopLevelApiFolders = topLevelApiFolders.filter(
  (entryName) => !allowedTopLevelApiFolders.has(entryName),
);

assert.deepEqual(
  unexpectedTopLevelApiFolders,
  [],
  "Workspace modules must not add top-level app/api/<workspace> routes; keep workspace data behind the shared /api/database router.",
);

const routeFiles = walkRouteFiles(appApiRoot).map(toRepoPath).sort();

const workspaceRouteViolations = routeFiles.filter((routePath) => {
  const [, , firstSegment] = routePath.split("/");
  if (firstSegment === "auth") return false;
  if (firstSegment === "wialon") return false;
  if (routePath === "app/api/database/route.ts") return false;
  return true;
});

assert.deepEqual(
  workspaceRouteViolations,
  [],
  "Only auth routes and app/api/database/route.ts may exist; workspace module endpoints must be database router actions, not separate route handlers.",
);

const forbiddenSegmentRouteViolations = routeFiles.filter((routePath) => {
  const routeSegments = routePath.split("/").slice(2, -1);
  if (routeSegments[0] === "auth") return false;
  if (routeSegments[0] === "wialon") return false;
  return routeSegments.some((segment) => forbiddenWorkspaceApiSegments.has(segment));
});

assert.deepEqual(
  forbiddenSegmentRouteViolations,
  [],
  "Workspace names must not appear as API route segments outside auth; use /api/database resource/action contracts instead.",
);

const databaseRouteSource = readFileSync(databaseRoutePath, "utf8");

assert.match(databaseRouteSource, /@\/lib\/server\/database\/router/);
assert.match(databaseRouteSource, /export const runtime = "nodejs"/);
assert.match(databaseRouteSource, /export const dynamic = "force-dynamic"/);
assert.match(databaseRouteSource, /export const OPTIONS = handleDatabaseOptions/);
assert.match(databaseRouteSource, /export const GET = handleDatabaseGet/);
assert.match(databaseRouteSource, /export const POST = handleDatabasePost/);
assert.doesNotMatch(databaseRouteSource, /dbRows|dbExecute|mysql2|@supabase\/supabase-js/);

assert.match(workspacesDoc, /Single workspace API router/);
assert.match(workspacesDoc, /tests\/single-workspace-api-router-checks\.ts/);
assert.match(workspacesDoc, /Do not add `app\/api\/<workspace>`/);
assert.match(workspacesDoc, /Auth routes stay separate/);
assert.match(workspacesDoc, /shared\s+`\/api\/database`\s+router/);

console.log("Single workspace API router checks passed");
