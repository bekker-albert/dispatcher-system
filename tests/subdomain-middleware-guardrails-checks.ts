import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const workspacesDoc = readFileSync(resolve(root, "docs", "WORKSPACES_ARCHITECTURE.md"), "utf8");

const possibleMiddlewarePaths = [
  "middleware.ts",
  "middleware.js",
  "middleware.mjs",
  "src/middleware.ts",
  "src/middleware.js",
  "src/middleware.mjs",
] as const;

const middlewareSources = possibleMiddlewarePaths
  .filter((path) => existsSync(resolve(root, path)))
  .map((path) => ({
    path,
    source: readFileSync(resolve(root, path), "utf8"),
  }));

for (const { path, source } of middlewareSources) {
  assert.match(
    source,
    /resolveWorkspaceNavigationIntent|resolveWorkspaceByHost|workspaceSubdomainRoutes|normalizeWorkspaceHost/,
    `${path} must use the shared workspace subdomain routing helper.`,
  );
  assert.doesNotMatch(source, /\bfetch\s*\(/, `${path} must not fetch data in middleware.`);
  assert.doesNotMatch(source, /\/api\/database|databaseRequest|mysql|supabase/i, `${path} must not call the data layer.`);
  assert.doesNotMatch(source, /node:https?|https?\.request|http-proxy|proxy\.web|createProxy/i, `${path} must not proxy to another backend.`);
  assert.doesNotMatch(source, /NextResponse\.(?:rewrite|redirect)\s*\([\s\S]*?https?:\/\//, `${path} must not rewrite or redirect to an external app.`);
  assert.doesNotMatch(source, /new\s+URL\s*\(\s*["'`]https?:\/\//, `${path} must not construct external app URLs.`);
  assert.doesNotMatch(
    source,
    /process\.env\.[A-Z0-9_]*(?:WORKSPACE|DISPATCH|TAXATION|SMTS|GPS|PTO|REPORTS|ADMIN|AI|BACKEND|SERVICE|API)[A-Z0-9_]*(?:URL|HOST|ORIGIN)/,
    `${path} must not route workspaces through per-module backend env vars.`,
  );
}

assert.match(packageJson.scripts["check:workspaces"], /subdomain-middleware-guardrails-checks\.ts/);

assert.match(workspacesDoc, /Subdomain middleware guardrail/);
assert.match(workspacesDoc, /tests\/subdomain-middleware-guardrails-checks\.ts/);
assert.match(workspacesDoc, /Middleware may read `host` and select a workspace intent/);
assert.match(workspacesDoc, /must not rewrite, redirect, proxy, fetch, or call\s+`\/api\/database`/);
assert.match(workspacesDoc, /must not use per-module backend URLs or hosts/);

console.log("Subdomain middleware guardrails checks passed");
