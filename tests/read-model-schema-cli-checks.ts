import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const jitiCliPath = resolve(root, "node_modules/jiti/lib/jiti-cli.mjs");
const scriptPath = resolve(root, "scripts/check-read-model-schema-readiness.ts");
const scriptSource = readFileSync(scriptPath, "utf8");

assert.equal(
  packageJson.scripts["check:read-model-schema"],
  "jiti scripts/check-read-model-schema-readiness.ts",
);
assert.match(scriptSource, /reviewMysqlReadModelSchemaReadiness/);
assert.match(scriptSource, /loadDotEnvLocal/);
assert.match(scriptSource, /closeMysqlPool/);
assert.match(scriptSource, /--workspace <workspace-id>/);
assert.match(scriptSource, /--module <id>/);
assert.match(scriptSource, /--dry-run/);
assert.match(scriptSource, /getModuleReadModelSchemaRequirement/);
assert.match(scriptSource, /listModuleReadModelSchemaRequirements/);
assert.match(scriptSource, /getModuleReadModelTableMismatchIssues/);
assert.match(scriptSource, /reviewMysqlReadModelSchemaReadinessForModule/);
assert.match(scriptSource, /process\.exitCode = 1/);
assert.doesNotMatch(scriptSource, /--confirm/);
assert.doesNotMatch(scriptSource, /allowProduction/);

const helpRun = runSchemaCheck(["--help"]);
assert.equal(helpRun.status, 0);
assert.match(helpRun.stdout, /Usage: npm run check:read-model-schema -- \[--workspace <workspace-id>\]/);
assert.match(helpRun.stdout, /This command is read-only/);
assert.match(helpRun.stdout, /--module <id>/);
assert.match(helpRun.stdout, /--dry-run/);
assert.match(helpRun.stdout, /taxation/);

const invalidWorkspaceRun = runSchemaCheck(["--workspace", "unknown-workspace"]);
assert.equal(invalidWorkspaceRun.status, 1);
assert.match(invalidWorkspaceRun.stderr, /Unknown workspace id: unknown-workspace/);
assert.match(invalidWorkspaceRun.stdout, /Workspace ids:/);

const invalidModuleRun = runSchemaCheck(["--module", "unknown-module"]);
assert.equal(invalidModuleRun.status, 1);
assert.match(invalidModuleRun.stderr, /Unknown read-model module id: unknown-module/);
assert.match(invalidModuleRun.stdout, /Workspace ids:/);

const mismatchedWorkspaceModuleRun = runSchemaCheck(["--workspace", "reports", "--module", "taxation-waybills"]);
assert.equal(mismatchedWorkspaceModuleRun.status, 1);
assert.match(mismatchedWorkspaceModuleRun.stderr, /belongs to workspace taxation, not reports/);

const dryRun = runSchemaCheck(["--workspace", "taxation", "--dry-run"]);
assert.equal(dryRun.status, 0);
const dryRunPayload = JSON.parse(dryRun.stdout) as {
  moduleId: string;
  workspaceId: string;
  mode: string;
  schemaChecked: boolean;
  ready: boolean;
  requirements: Array<{
    moduleId: string;
    workspaceId: string;
    tableName: string;
    requiredColumns: string[];
    listAction?: string;
    detailAction?: string;
  }>;
  issues: unknown[];
  nextCommand: string;
};

assert.equal(dryRunPayload.workspaceId, "taxation");
assert.equal(dryRunPayload.moduleId, "all");
assert.equal(dryRunPayload.mode, "dry-run");
assert.equal(dryRunPayload.schemaChecked, false);
assert.equal(dryRunPayload.ready, false);
assert.deepEqual(dryRunPayload.issues, []);
assert.equal(dryRunPayload.nextCommand, "npm run check:read-model-schema -- --workspace taxation");
assert.ok(dryRunPayload.requirements.some((requirement) => (
  requirement.moduleId === "taxation-waybills"
  && requirement.workspaceId === "taxation"
  && requirement.listAction === "list-waybills"
  && requirement.detailAction === "get-waybill"
  && requirement.requiredColumns.includes("section_id")
  && requirement.requiredColumns.includes("status")
)));

const moduleDryRun = runSchemaCheck(["--module", "taxation-waybills", "--dry-run"]);
assert.equal(moduleDryRun.status, 0);
const moduleDryRunPayload = JSON.parse(moduleDryRun.stdout) as typeof dryRunPayload;

assert.equal(moduleDryRunPayload.workspaceId, "all");
assert.equal(moduleDryRunPayload.moduleId, "taxation-waybills");
assert.equal(moduleDryRunPayload.mode, "dry-run");
assert.equal(moduleDryRunPayload.schemaChecked, false);
assert.equal(moduleDryRunPayload.ready, false);
assert.equal(moduleDryRunPayload.requirements.length, 1);
assert.equal(moduleDryRunPayload.requirements[0]?.moduleId, "taxation-waybills");
assert.equal(moduleDryRunPayload.requirements[0]?.tableName, "taxation_waybills");
assert.equal(moduleDryRunPayload.requirements[0]?.listAction, "list-waybills");
assert.equal(moduleDryRunPayload.requirements[0]?.detailAction, "get-waybill");
assert.ok(moduleDryRunPayload.requirements[0]?.requiredColumns.includes("work_date"));
assert.ok(moduleDryRunPayload.requirements[0]?.requiredColumns.includes("version"));
assert.deepEqual(moduleDryRunPayload.issues, []);
assert.equal(moduleDryRunPayload.nextCommand, "npm run check:read-model-schema -- --module taxation-waybills");

console.log("Read-model schema CLI checks passed");

function runSchemaCheck(args: string[]) {
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
