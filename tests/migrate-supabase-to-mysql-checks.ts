import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const jitiCliPath = resolve(root, "node_modules/jiti/lib/jiti-cli.mjs");
const scriptPath = resolve(root, "scripts/migrate-supabase-to-mysql.ts");

const helpRun = runMigrationCheck(["--help"]);
assert.equal(helpRun.status, 0);
assert.match(helpRun.stdout, /Usage: npm run migrate:supabase-to-mysql -- --confirm \[--allow-production\]/);

const missingConfirmRun = runMigrationCheck([], {
  DB_HOST: "localhost",
  DB_PORT: "3306",
  DB_NAME: "aam_dispatch",
  DB_USER: "dispatcher_ad",
  DB_PASSWORD: "secret",
  NODE_ENV: "development",
});
assert.equal(missingConfirmRun.status, 1);
assert.match(missingConfirmRun.stderr, /Refusing to run without --confirm/);

const productionTargetRun = runMigrationCheck(["--confirm"], {
  DB_HOST: "db.aam-dispatch.kz",
  DB_PORT: "3306",
  DB_NAME: "aam_dispatch",
  DB_USER: "dispatcher_ad",
  DB_PASSWORD: "secret",
  NODE_ENV: "development",
});
assert.equal(productionTargetRun.status, 1);
assert.match(productionTargetRun.stderr, /without --allow-production/);
assert.match(productionTargetRun.stderr, /db\.aam-dispatch\.kz:3306\/aam_dispatch/);

console.log("Migration CLI checks passed");

function runMigrationCheck(args: string[], envOverrides: Record<string, string | undefined> = {}) {
  return spawnSync(process.execPath, [jitiCliPath, scriptPath, ...args], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      ...envOverrides,
    },
  });
}
