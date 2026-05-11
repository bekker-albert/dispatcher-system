import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const domainRoot = resolve(root, "lib", "domain");
const architectureDoc = readFileSync(resolve(root, "docs", "DISPATCH_SERVICE_ARCHITECTURE.md"), "utf8");
const workspacesDoc = readFileSync(resolve(root, "docs", "WORKSPACES_ARCHITECTURE.md"), "utf8");

const ignoredDirectoryNames = new Set([".git", ".next", "node_modules"]);
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

const forbiddenImportSpecPatterns = [
  /^react$/,
  /^react\//,
  /^next\//,
  /^lucide-react$/,
  /^@\/features\//,
  /^@\/components\//,
  /^@\/shared\//,
  /^@\/lib\/data(?:\/|$)/,
  /^@\/lib\/server(?:\/|$)/,
  /^@\/lib\/supabase(?:\/|$)/,
  /^@supabase\/supabase-js$/,
  /^mysql2(?:\/promise)?$/,
  /^node:fs$/,
  /^node:fs\/promises$/,
  /^node:child_process$/,
  /^node:worker_threads$/,
  /^node:cluster$/,
  /^xlsx$/,
] as const;

const forbiddenSourcePatterns = [
  /["']use client["']/,
  /\buseState\(/,
  /\buseEffect\(/,
  /\buseReducer\(/,
  /\bfetch\(/,
  /\bdatabaseRequest\(/,
  /\bwindow\./,
  /\bdocument\.(?:body|cookie|createElement|getElementById|querySelector|addEventListener|removeEventListener)/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bprocess\.env\b/,
  /\bdbRows\b/,
  /\bdbExecute\b/,
] as const;

type Violation = {
  path: string;
  reason: string;
};

function toRepoPath(path: string) {
  return relative(root, path).replace(/\\/g, "/");
}

function walkSourceFiles(startPath: string): string[] {
  const stats = statSync(startPath);
  if (stats.isFile()) return sourceExtensions.has(extname(startPath)) ? [startPath] : [];
  if (!stats.isDirectory()) return [];

  return readdirSync(startPath).flatMap((entryName) => {
    if (ignoredDirectoryNames.has(entryName)) return [];
    return walkSourceFiles(join(startPath, entryName));
  });
}

function importSpecifiers(source: string) {
  const staticImports = [...source.matchAll(/^\s*import(?:\s+type)?(?:[\s\S]*?)\s+from\s+["']([^"']+)["'];?/gm)]
    .map((match) => match[1] ?? "");
  const dynamicImports = [...source.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)]
    .map((match) => match[1] ?? "");
  return [...staticImports, ...dynamicImports].filter(Boolean);
}

const domainSourceFiles = walkSourceFiles(domainRoot);

const tsxViolations: Violation[] = domainSourceFiles
  .filter((path) => extname(path) === ".tsx" || extname(path) === ".jsx")
  .map((path) => ({
    path: toRepoPath(path),
    reason: `${basename(path)} is JSX/TSX inside lib/domain`,
  }));

const importViolations: Violation[] = domainSourceFiles.flatMap((path) => {
  const source = readFileSync(path, "utf8");
  return importSpecifiers(source).flatMap((specifier) => (
    forbiddenImportSpecPatterns.some((pattern) => pattern.test(specifier))
      ? [{ path: toRepoPath(path), reason: `forbidden import ${specifier}` }]
      : []
  ));
});

const sourceViolations: Violation[] = domainSourceFiles.flatMap((path) => {
  const source = readFileSync(path, "utf8");
  return forbiddenSourcePatterns.flatMap((pattern) => (
    pattern.test(source)
      ? [{ path: toRepoPath(path), reason: `forbidden source pattern ${String(pattern)}` }]
      : []
  ));
});

assert.deepEqual(
  [...tsxViolations, ...importViolations, ...sourceViolations],
  [],
  "lib/domain must stay pure TypeScript: no React/Next/UI imports, browser APIs, server database/data clients, runtime processes, or direct API calls.",
);

assert.match(architectureDoc, /Domain purity boundary/);
assert.match(architectureDoc, /tests\/domain-purity-guardrails-checks\.ts/);
assert.match(architectureDoc, /must not import\s+React, Next, feature UI, shared UI, server database code, `lib\/data`, MySQL,\s+Supabase, or browser APIs/);
assert.match(workspacesDoc, /Domain purity boundary/);
assert.match(workspacesDoc, /`lib\/domain` stays pure TypeScript/);

console.log("Domain purity guardrails checks passed");
