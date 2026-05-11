import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createStage2NextActivationPlan,
} from "../lib/domain/workspaces/stage2NextActivationAction";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const jitiCliPath = resolve(root, "node_modules/jiti/lib/jiti-cli.mjs");
const scriptPath = resolve(root, "scripts/plan-stage-2-next-action.ts");
const plannerSource = readFileSync(resolve(root, "lib/domain/workspaces/stage2NextActivationAction.ts"), "utf8");
const scriptSource = readFileSync(scriptPath, "utf8");
const readModelRolloutDoc = readFileSync(resolve(root, "docs/STAGE_2_READ_MODEL_ROLLOUT.md"), "utf8");
const writeHandlerRolloutDoc = readFileSync(resolve(root, "docs/STAGE_2_WRITE_HANDLER_ROLLOUT.md"), "utf8");

assert.equal(
  packageJson.scripts["plan:stage2-next-action"],
  "jiti scripts/plan-stage-2-next-action.ts",
);
assert.match(packageJson.scripts["check:dispatch-architecture"], /stage-2-next-action-checks/);

assert.match(plannerSource, /createStage2NextActivationPlan/);
assert.match(plannerSource, /createStage2LiveReadinessSnapshot/);
assert.match(plannerSource, /createStage2FirstReadModelActivationChecklist/);
assert.match(plannerSource, /createStage2WriteHandlerActivationChecklist/);
assert.match(plannerSource, /firstBatchReadModelsReady/);
assert.match(plannerSource, /liveRegistrationAllowedFromPlan: false/);
assert.match(plannerSource, /maxParallelLiveRegistrations: 1/);
assert.match(plannerSource, /noMysqlConnection: true/);
assert.match(plannerSource, /liveRegistryMutation: false/);
assert.match(plannerSource, /handlerRegistrationMutation: false/);
assert.match(plannerSource, /implementationPath: string/);
assert.match(plannerSource, /implementationPath: item\.implementationPath/);
assert.doesNotMatch(plannerSource, /process\.env\.DB|dbRows|dbExecute|createLiveModuleDatabaseHandlersFromRegistrations/);

assert.match(scriptSource, /createStage2NextActivationPlan/);
assert.match(scriptSource, /--requested-by <name>/);
assert.match(scriptSource, /--live-handler <resource\/action>/);
assert.match(scriptSource, /does not query MySQL/);
assert.match(scriptSource, /does not register live handlers/);
assert.match(scriptSource, /does not mutate the live registry/);
assert.doesNotMatch(scriptSource, /process\.env\.DB|dbRows|dbExecute|createLiveModuleDatabaseHandlersFromRegistrations/);

assert.match(readModelRolloutDoc, /npm run plan:stage2-next-action/);
assert.match(readModelRolloutDoc, /nextAction/);
assert.match(readModelRolloutDoc, /liveRegistrationAllowedFromPlan = false/);
assert.match(writeHandlerRolloutDoc, /npm run plan:stage2-next-action/);
assert.match(writeHandlerRolloutDoc, /write-handler candidate/);

const plannedPlan = createStage2NextActivationPlan("stage-2-next-check");
assert.equal(plannedPlan.currentStep, "read-model");
assert.equal(plannedPlan.firstBatchReadModelsReady, false);
assert.equal(plannedPlan.writeHandlersBlockedUntilReadModelsLive, true);
assert.equal(plannedPlan.liveActivationAllowedNow, false);
assert.equal(plannedPlan.noMysqlConnection, true);
assert.equal(plannedPlan.liveRegistryMutation, false);
assert.equal(plannedPlan.handlerRegistrationMutation, false);
assert.equal(plannedPlan.maxParallelLiveRegistrations, 1);
assert.equal(plannedPlan.nextAction?.phase, "read-model");
assert.equal(plannedPlan.nextAction?.databaseAction, "list-waybills");
assert.equal(plannedPlan.nextAction?.implementationPath, "lib/server/database/module-live-handlers.ts");
assert.equal(plannedPlan.nextAction?.liveRegistrationAllowedFromPlan, false);
assert.deepEqual(plannedPlan.nextAction?.requiredCommands, [
  plannedPlan.nextAction?.schemaPreflightCommand,
  plannedPlan.nextAction?.activationPreflightCommand,
  "npm run verify",
]);
assert.ok(plannedPlan.nextAction?.requiredCommands.some((command) => (
  command.includes("check:read-model-schema")
)));
assert.ok(plannedPlan.nextAction?.requiredCommands.some((command) => (
  command.includes("review:live-handler")
)));

const taxationLivePlan = createStage2NextActivationPlan("stage-2-next-check", [
  { resource: "taxation", databaseAction: "list-waybills" },
  { resource: "taxation", databaseAction: "get-waybill" },
]);
assert.equal(taxationLivePlan.currentStep, "read-model");
assert.equal(taxationLivePlan.firstBatchReadModelsReady, false);
assert.equal(taxationLivePlan.nextAction?.phase, "read-model");
assert.equal(taxationLivePlan.nextAction?.databaseAction, "list-shift-reports");
assert.equal(taxationLivePlan.writeHandlersBlockedUntilReadModelsLive, true);
assert.equal(taxationLivePlan.liveActivationAllowedNow, false);

const allReadModelsLivePlan = createStage2NextActivationPlan("stage-2-next-check", [
  { resource: "taxation", databaseAction: "list-waybills" },
  { resource: "taxation", databaseAction: "get-waybill" },
  { resource: "dispatch", databaseAction: "list-shift-reports" },
  { resource: "dispatch", databaseAction: "get-shift-report" },
]);
assert.equal(allReadModelsLivePlan.currentStep, "write-handler");
assert.equal(allReadModelsLivePlan.firstBatchReadModelsReady, true);
assert.equal(allReadModelsLivePlan.writeHandlersBlockedUntilReadModelsLive, false);
assert.equal(allReadModelsLivePlan.liveActivationAllowedNow, true);
assert.equal(allReadModelsLivePlan.nextAction?.phase, "write-handler");
assert.equal(allReadModelsLivePlan.nextAction?.databaseAction, "create-waybill");
assert.equal(
  allReadModelsLivePlan.nextAction?.implementationPath,
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.equal(allReadModelsLivePlan.nextAction?.factoryKind, "create");
assert.equal(allReadModelsLivePlan.nextAction?.liveRegistrationAllowedFromPlan, false);
assert.deepEqual(allReadModelsLivePlan.nextAction?.requiredCommands, [
  allReadModelsLivePlan.nextAction?.planningCommand,
  allReadModelsLivePlan.nextAction?.registrationReviewCommand,
  "npm run verify",
]);
assert.ok(allReadModelsLivePlan.nextAction?.requiredCommands.some((command) => (
  command.includes("plan:write-handler-activation")
)));
assert.ok(allReadModelsLivePlan.nextAction?.requiredCommands.some((command) => (
  command.includes("review:write-handler")
)));

const helpRun = runNextActionPlanner(["--help"]);
assert.equal(helpRun.status, 0);
assert.match(helpRun.stdout, /Usage: npm run plan:stage2-next-action/);
assert.match(helpRun.stdout, /does not query MySQL/);
assert.match(helpRun.stdout, /--requested-by <name>/);
assert.match(helpRun.stdout, /--live-handler <resource\/action>/);

const plannedRun = runNextActionPlanner(["--requested-by", "stage-2-next-cli"]);
assert.equal(plannedRun.status, 0);
const cliPlannedPlan = JSON.parse(plannedRun.stdout) as ReturnType<typeof createStage2NextActivationPlan>;
assert.equal(cliPlannedPlan.requestedBy, "stage-2-next-cli");
assert.equal(cliPlannedPlan.currentStep, "read-model");
assert.equal(cliPlannedPlan.nextAction?.databaseAction, "list-waybills");
assert.ok(cliPlannedPlan.nextAction?.requiredCommands.some((command) => (
  command.includes("--requested-by stage-2-next-cli")
)));

const simulatedRun = runNextActionPlanner([
  "--requested-by",
  "stage-2-next-cli",
  "--live-handler",
  "taxation/list-waybills",
  "--live-handler",
  "taxation/get-waybill",
  "--live-handler",
  "dispatch/list-shift-reports",
  "--live-handler",
  "dispatch/get-shift-report",
]);
assert.equal(simulatedRun.status, 0);
const cliSimulatedPlan = JSON.parse(simulatedRun.stdout) as ReturnType<typeof createStage2NextActivationPlan>;
assert.equal(cliSimulatedPlan.currentStep, "write-handler");
assert.equal(cliSimulatedPlan.nextAction?.databaseAction, "create-waybill");
assert.ok(cliSimulatedPlan.nextAction?.requiredCommands.some((command) => (
  command.includes("--requested-by stage-2-next-cli")
)));

const invalidRun = runNextActionPlanner(["--live-handler", "not-valid"]);
assert.equal(invalidRun.status, 1);
assert.match(invalidRun.stderr, /Invalid --live-handler value/);

console.log("Stage 2 next action checks passed");

function runNextActionPlanner(args: string[]) {
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
