import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const workspacesDoc = readFileSync(resolve(root, "docs", "WORKSPACES_ARCHITECTURE.md"), "utf8");

const moduleRoots = [
  "app",
  "components",
  "features",
  "lib/domain",
  "shared",
] as const;

const forbiddenModuleFiles = new Set([
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "pnpm-lock.yaml",
  "vite.config.js",
  "vite.config.mjs",
  "vite.config.ts",
  "webpack.config.js",
  "webpack.config.ts",
  "yarn.lock",
]);

const forbiddenRootFiles = new Set([
  "Dockerfile",
  "Procfile",
  "astro.config.js",
  "astro.config.mjs",
  "astro.config.ts",
  "docker-compose.yaml",
  "docker-compose.yml",
  "ecosystem.config.cjs",
  "ecosystem.config.js",
  "lerna.json",
  "nest-cli.json",
  "nx.json",
  "pm2.config.js",
  "pnpm-workspace.yaml",
  "remix.config.js",
  "turbo.json",
  "vite.config.js",
  "vite.config.mjs",
  "vite.config.ts",
  "workspace.json",
]);

const forbiddenRootDirectories = new Set([
  "apps",
  "microservices",
  "packages",
  "services",
]);

const ignoredDirectoryNames = new Set([
  ".git",
  ".next",
  "node_modules",
]);

function walkFiles(startPath: string): string[] {
  const stats = statSync(startPath);
  if (stats.isFile()) return [startPath];
  if (!stats.isDirectory()) return [];

  return readdirSync(startPath).flatMap((entryName) => {
    if (ignoredDirectoryNames.has(entryName)) return [];
    return walkFiles(join(startPath, entryName));
  });
}

function toRepoPath(path: string) {
  return relative(root, path).replace(/\\/g, "/");
}

const moduleRootFiles = moduleRoots.flatMap((moduleRoot) => walkFiles(resolve(root, moduleRoot)));
const forbiddenFiles = moduleRootFiles
  .filter((path) => forbiddenModuleFiles.has(basename(path)))
  .map(toRepoPath);
const rootEntries = readdirSync(root, { withFileTypes: true });
const forbiddenRootEntryPaths = rootEntries
  .filter((entry) => (
    (entry.isFile() && forbiddenRootFiles.has(entry.name))
    || (entry.isDirectory() && forbiddenRootDirectories.has(entry.name))
  ))
  .map((entry) => entry.name)
  .sort();

assert.deepEqual(
  forbiddenFiles,
  [],
  "Workspace/module folders must not contain their own app configs, package manifests, lockfiles or Docker files.",
);

assert.deepEqual(
  forbiddenRootEntryPaths,
  [],
  "The repository root must not add multi-app, workspace, Docker Compose, PM2, or alternate framework entrypoints.",
);

assert.equal(packageJson.scripts.dev, "next dev --turbopack");
assert.equal(packageJson.scripts.build, "next build");
assert.equal(packageJson.scripts.start, "next start");
assert.doesNotMatch(Object.keys(packageJson.scripts).join("\n"), /^dev:(dispatch|taxation|smts|fleet|reports|admin|ai)/m);
assert.doesNotMatch(Object.keys(packageJson.scripts).join("\n"), /^start:(dispatch|taxation|smts|fleet|reports|admin|ai)/m);
assert.doesNotMatch(Object.keys(packageJson.scripts).join("\n"), /^build:(dispatch|taxation|smts|fleet|reports|admin|ai)/m);

assert.match(packageJson.scripts["check:workspaces"], /modular-monolith-guardrails-checks\.ts/);
assert.match(workspacesDoc, /Modular monolith filesystem guardrail/);
assert.match(workspacesDoc, /tests\/modular-monolith-guardrails-checks\.ts/);
assert.match(workspacesDoc, /Do not add package\.json, next\.config, lockfiles, Dockerfiles, or separate dev\/start\/build scripts inside workspace folders/);
assert.match(workspacesDoc, /Do not add root `apps`, `packages`, `services`, Docker Compose, PM2, Nx, Turborepo, Vite, Remix, Astro, or NestJS entrypoints/);

console.log("Modular monolith guardrails checks passed");
