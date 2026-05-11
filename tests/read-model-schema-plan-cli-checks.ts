import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createReadModelSchemaReviewPlan } from "../lib/domain/data-access/readModelSchemaPlan";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const jitiCliPath = resolve(root, "node_modules/jiti/lib/jiti-cli.mjs");
const scriptPath = resolve(root, "scripts/plan-read-model-schema.ts");
const scriptSource = readFileSync(scriptPath, "utf8");
const planSource = readFileSync(resolve(root, "lib/domain/data-access/readModelSchemaPlan.ts"), "utf8");

assert.equal(
  packageJson.scripts["plan:read-model-schema"],
  "jiti scripts/plan-read-model-schema.ts",
);
assert.match(packageJson.scripts["check:data-access"], /read-model-schema-plan-cli-checks/);

assert.match(scriptSource, /createReadModelSchemaReviewPlan/);
assert.match(scriptSource, /Non-mutating/);
assert.match(scriptSource, /does not connect to MySQL/);
assert.match(scriptSource, /--module <module-id>/);
assert.match(scriptSource, /--sql/);
assert.doesNotMatch(scriptSource, /reviewMysql|dbRows|closeMysqlPool|process\.env\.DB|CREATE DATABASE|DROP TABLE|ALTER TABLE.*DROP/);

assert.match(planSource, /appliesChanges: false/);
assert.match(planSource, /schemaChecked: false/);
assert.match(planSource, /liveHandlerActivation: false/);
assert.match(planSource, /CREATE TABLE/);
assert.match(planSource, /ENGINE=InnoDB DEFAULT CHARSET=utf8mb4/);
assert.match(planSource, /DEFAULT 1/);

const domainPlan = createReadModelSchemaReviewPlan({ moduleId: "taxation-waybills" });
assert.equal(domainPlan.mode, "plan-only");
assert.equal(domainPlan.appliesChanges, false);
assert.equal(domainPlan.schemaChecked, false);
assert.equal(domainPlan.liveHandlerActivation, false);
assert.equal(domainPlan.plans.length, 1);
assert.equal(domainPlan.plans[0]?.moduleId, "taxation-waybills");
assert.equal(domainPlan.plans[0]?.tableName, "taxation_waybills");
assert.match(domainPlan.plans[0]?.createTableStatement ?? "", /CREATE TABLE `taxation_waybills`/);
assert.match(domainPlan.plans[0]?.createTableStatement ?? "", /`version` int unsigned NOT NULL DEFAULT 1/);
assert.match(domainPlan.plans[0]?.createTableStatement ?? "", /PRIMARY KEY \(`id`\)/);
assert.equal(domainPlan.plans[0]?.indexStatements.length, 3);

const helpRun = runPlan(["--help"]);
assert.equal(helpRun.status, 0);
assert.match(helpRun.stdout, /Usage: npm run plan:read-model-schema/);
assert.match(helpRun.stdout, /review-only MySQL schema plan/);
assert.match(helpRun.stdout, /non-mutating/);
assert.match(helpRun.stdout, /Workspace ids:/);

const invalidModuleRun = runPlan(["--module", "unknown-module"]);
assert.equal(invalidModuleRun.status, 1);
assert.match(invalidModuleRun.stderr, /Unknown read-model module id: unknown-module/);

const invalidWorkspaceRun = runPlan(["--workspace", "unknown-workspace"]);
assert.equal(invalidWorkspaceRun.status, 1);
assert.match(invalidWorkspaceRun.stderr, /Unknown workspace id: unknown-workspace/);

const mismatchedWorkspaceModuleRun = runPlan(["--workspace", "reports", "--module", "taxation-waybills"]);
assert.equal(mismatchedWorkspaceModuleRun.status, 1);
assert.match(mismatchedWorkspaceModuleRun.stderr, /belongs to workspace taxation, not reports/);

const moduleJsonRun = runPlan(["--module", "taxation-waybills"]);
assert.equal(moduleJsonRun.status, 0);
const modulePayload = JSON.parse(moduleJsonRun.stdout) as ReturnType<typeof createReadModelSchemaReviewPlan>;
assert.equal(modulePayload.moduleId, "taxation-waybills");
assert.equal(modulePayload.mode, "plan-only");
assert.equal(modulePayload.appliesChanges, false);
assert.equal(modulePayload.schemaChecked, false);
assert.equal(modulePayload.liveHandlerActivation, false);
assert.equal(modulePayload.plans.length, 1);
assert.equal(modulePayload.plans[0]?.listAction, "list-waybills");
assert.equal(modulePayload.plans[0]?.detailAction, "get-waybill");
assert.ok(modulePayload.plans[0]?.requiredColumns.includes("work_date"));
assert.ok(modulePayload.plans[0]?.requiredColumns.includes("updated_by"));
assert.equal(modulePayload.plans[0]?.indexStatements.length, 3);
assert.deepEqual(modulePayload.issues, []);

const moduleSqlRun = runPlan(["--module", "taxation-waybills", "--sql"]);
assert.equal(moduleSqlRun.status, 0);
assert.match(moduleSqlRun.stdout, /Review-only read-model schema plan/);
assert.match(moduleSqlRun.stdout, /CREATE TABLE `taxation_waybills`/);
assert.match(moduleSqlRun.stdout, /ALTER TABLE `taxation_waybills` ADD INDEX/);
assert.match(moduleSqlRun.stdout, /Keep live handlers planned-only/);
assert.doesNotMatch(moduleSqlRun.stdout, /CREATE DATABASE|DROP TABLE|DROP DATABASE/);

console.log("Read-model schema plan CLI checks passed");

function runPlan(args: string[]) {
  return spawnSync(process.execPath, [jitiCliPath, scriptPath, ...args], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      DB_NAME: undefined,
      DB_USER: undefined,
      DB_PASSWORD: undefined,
    },
  });
}
