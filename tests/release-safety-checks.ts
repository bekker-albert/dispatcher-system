import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  engines?: { node?: string };
};
const nodeVersion = readFileSync(resolve(root, ".node-version"), "utf8").trim();
const deployWorkflow = readFileSync(resolve(root, ".github/workflows/deploy.yml"), "utf8");
const productionSmoke = readFileSync(resolve(root, "scripts/production-smoke.mjs"), "utf8");
const readme = readFileSync(resolve(root, "README.md"), "utf8");
const runbook = readFileSync(resolve(root, "docs/release-and-data-runbook.md"), "utf8");

assert.equal(nodeVersion, "24");
assert.equal(packageJson.engines?.node, ">=24 <25");
assert.match(deployWorkflow, /node-version: 24/);
assert.match(deployWorkflow, /name: Release check/);
assert.match(deployWorkflow, /npm run release:check/);
assert.match(deployWorkflow, /major !== 24/);
assert.match(productionSmoke, /checkAnonymousDatabaseWriteBlocked/);
assert.match(productionSmoke, /anonymous database POST returned HTTP/);
assert.match(productionSmoke, /response\.status !== 401 && response\.status !== 403/);
assert.match(productionSmoke, /PRODUCTION_SMOKE_AUTH_LOGIN/);
assert.match(readme, /Use Node\.js 24 locally, in CI, and on production/);
assert.match(readme, /anonymous database POST requests are\s+blocked/);
assert.match(runbook, /Local, CI, and production should run Node\.js 24/);
assert.match(runbook, /anonymous `POST \/api\/database` is blocked/);

console.log("Release safety checks passed");
