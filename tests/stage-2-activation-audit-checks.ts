import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createStage2ActivationAuditPlan,
} from "../lib/domain/workspaces/stage2ActivationAuditPlan";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const jitiCliPath = resolve(root, "node_modules/jiti/lib/jiti-cli.mjs");
const scriptPath = resolve(root, "scripts/plan-stage-2-activation-audit.ts");
const auditPlanSource = readFileSync(resolve(root, "lib/domain/workspaces/stage2ActivationAuditPlan.ts"), "utf8");
const scriptSource = readFileSync(scriptPath, "utf8");
const runbook = readFileSync(resolve(root, "docs/LIVE_HANDLER_ACTIVATION_RUNBOOK.md"), "utf8");

assert.equal(
  packageJson.scripts["plan:stage2-activation-audit"],
  "jiti scripts/plan-stage-2-activation-audit.ts",
);
assert.match(packageJson.scripts["check:dispatch-architecture"], /stage-2-activation-audit-checks/);

assert.match(auditPlanSource, /createStage2ActivationAuditPlan/);
assert.match(auditPlanSource, /createStage2NextActivationPlan/);
assert.match(auditPlanSource, /auditRecordRequiredBeforeRegistryMutation: true/);
assert.match(auditPlanSource, /liveRegistrationAllowedFromAuditPlan: false/);
assert.match(auditPlanSource, /activationScopeSize: 1/);
assert.match(auditPlanSource, /noMysqlConnection: true/);
assert.match(auditPlanSource, /liveRegistryMutation: false/);
assert.match(auditPlanSource, /handlerRegistrationMutation: false/);
assert.match(auditPlanSource, /implementationPath/);
assert.match(auditPlanSource, /preflightResult/);
assert.match(auditPlanSource, /verifyResult/);
assert.match(auditPlanSource, /smokeResult/);
assert.match(auditPlanSource, /npm run smoke:local/);
assert.doesNotMatch(auditPlanSource, /process\.env\.DB|dbRows|dbExecute|createLiveModuleDatabaseHandlersFromRegistrations/);

assert.match(scriptSource, /createStage2ActivationAuditPlan/);
assert.match(scriptSource, /--requested-by <name>/);
assert.match(scriptSource, /--reason <text>/);
assert.match(scriptSource, /--live-handler <resource\/action>/);
assert.match(scriptSource, /does not query MySQL/);
assert.match(scriptSource, /does not register live handlers/);
assert.match(scriptSource, /does not mutate the live registry/);
assert.doesNotMatch(scriptSource, /process\.env\.DB|dbRows|dbExecute|createLiveModuleDatabaseHandlersFromRegistrations/);

assert.match(runbook, /npm run plan:stage2-activation-audit/);
assert.match(runbook, /createStage2ActivationAuditPlan/);
assert.match(runbook, /auditRecordRequiredBeforeRegistryMutation = true/);
assert.match(runbook, /liveRegistrationAllowedFromAuditPlan = false/);
assert.match(runbook, /preflightResult/);
assert.match(runbook, /verifyResult/);
assert.match(runbook, /smokeResult/);

const plannedAudit = createStage2ActivationAuditPlan(
  "stage-2-audit-check",
  "Connect next read-model handler with audit evidence.",
);
assert.equal(plannedAudit.requestedBy, "stage-2-audit-check");
assert.equal(plannedAudit.changeReason, "Connect next read-model handler with audit evidence.");
assert.equal(plannedAudit.reasonRequired, true);
assert.equal(plannedAudit.auditRequired, true);
assert.equal(plannedAudit.auditRecordRequiredBeforeRegistryMutation, true);
assert.equal(plannedAudit.liveRegistrationAllowedFromAuditPlan, false);
assert.equal(plannedAudit.maxParallelLiveRegistrations, 1);
assert.equal(plannedAudit.activationScopeSize, 1);
assert.equal(plannedAudit.noMysqlConnection, true);
assert.equal(plannedAudit.liveRegistryMutation, false);
assert.equal(plannedAudit.handlerRegistrationMutation, false);
assert.equal(plannedAudit.target?.phase, "read-model");
assert.equal(plannedAudit.target?.databaseAction, "list-waybills");
assert.equal(plannedAudit.target?.implementationPath, "lib/server/database/module-live-handlers.ts");
assert.deepEqual(plannedAudit.requiredFields, [
  "phase",
  "moduleId",
  "workspaceId",
  "resource",
  "databaseAction",
  "requestedBy",
  "changeReason",
  "implementationPath",
  "verificationCommands",
  "rollbackPlan",
  "activationScopeSize",
  "preflightResult",
  "verifyResult",
  "smokeResult",
]);
assert.ok(plannedAudit.requiredCommands.includes("npm run verify"));
assert.ok(plannedAudit.requiredCommands.includes("npm run smoke:local"));
assert.ok(plannedAudit.requiredCommands.some((command) => command.includes("review:live-handler")));

const allReadModelsLiveAudit = createStage2ActivationAuditPlan(
  "stage-2-audit-check",
  "Connect first write handler with audit evidence.",
  [
    { resource: "taxation", databaseAction: "list-waybills" },
    { resource: "taxation", databaseAction: "get-waybill" },
    { resource: "dispatch", databaseAction: "list-shift-reports" },
    { resource: "dispatch", databaseAction: "get-shift-report" },
  ],
);
assert.equal(allReadModelsLiveAudit.target?.phase, "write-handler");
assert.equal(allReadModelsLiveAudit.target?.databaseAction, "create-waybill");
assert.equal(
  allReadModelsLiveAudit.target?.implementationPath,
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.ok(allReadModelsLiveAudit.requiredCommands.some((command) => (
  command.includes("plan:write-handler-activation")
)));
assert.ok(allReadModelsLiveAudit.requiredCommands.some((command) => (
  command.includes("review:write-handler")
)));
assert.ok(allReadModelsLiveAudit.requiredCommands.includes("npm run smoke:local"));
assert.equal(allReadModelsLiveAudit.liveRegistrationAllowedFromAuditPlan, false);

const helpRun = runActivationAuditPlanner(["--help"]);
assert.equal(helpRun.status, 0);
assert.match(helpRun.stdout, /Usage: npm run plan:stage2-activation-audit/);
assert.match(helpRun.stdout, /does not query MySQL/);
assert.match(helpRun.stdout, /--reason <text>/);

const plannedRun = runActivationAuditPlanner([
  "--requested-by",
  "stage-2-audit-cli",
  "--reason",
  "Connect next action with audit trail.",
]);
assert.equal(plannedRun.status, 0);
const cliPlan = JSON.parse(plannedRun.stdout) as ReturnType<typeof createStage2ActivationAuditPlan>;
assert.equal(cliPlan.requestedBy, "stage-2-audit-cli");
assert.equal(cliPlan.changeReason, "Connect next action with audit trail.");
assert.equal(cliPlan.target?.databaseAction, "list-waybills");
assert.equal(cliPlan.liveRegistrationAllowedFromAuditPlan, false);
assert.ok(cliPlan.requiredCommands.includes("npm run smoke:local"));

const invalidRun = runActivationAuditPlanner(["--live-handler", "not-valid"]);
assert.equal(invalidRun.status, 1);
assert.match(invalidRun.stderr, /Invalid --live-handler value/);

console.log("Stage 2 activation audit checks passed");

function runActivationAuditPlanner(args: string[]) {
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
