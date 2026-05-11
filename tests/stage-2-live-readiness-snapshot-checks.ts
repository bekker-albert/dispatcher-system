import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createStage2LiveReadinessSnapshot,
} from "../lib/domain/workspaces/stage2LiveReadinessSnapshot";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const jitiCliPath = resolve(root, "node_modules/jiti/lib/jiti-cli.mjs");
const scriptPath = resolve(root, "scripts/plan-stage-2-live-readiness.ts");
const scriptSource = readFileSync(scriptPath, "utf8");
const snapshotSource = readFileSync(
  resolve(root, "lib/domain/workspaces/stage2LiveReadinessSnapshot.ts"),
  "utf8",
);
const readModelRolloutDoc = readFileSync(resolve(root, "docs/STAGE_2_READ_MODEL_ROLLOUT.md"), "utf8");
const writeHandlerRolloutDoc = readFileSync(resolve(root, "docs/STAGE_2_WRITE_HANDLER_ROLLOUT.md"), "utf8");

assert.equal(
  packageJson.scripts["plan:stage2-live-readiness"],
  "jiti scripts/plan-stage-2-live-readiness.ts",
);
assert.match(packageJson.scripts["check:dispatch-architecture"], /stage-2-live-readiness-snapshot-checks/);

assert.match(snapshotSource, /createStage2LiveReadinessSnapshot/);
assert.match(snapshotSource, /stage2FirstReadModelModuleIds/);
assert.match(snapshotSource, /getModuleLiveHandlerStatus/);
assert.match(snapshotSource, /firstBatchReadModelsReady/);
assert.match(snapshotSource, /writeHandlersBlockedUntilReadModelsLive/);
assert.match(snapshotSource, /noMysqlConnection: true/);
assert.match(snapshotSource, /liveRegistryMutation: false/);
assert.match(snapshotSource, /handlerRegistrationMutation: false/);
assert.match(snapshotSource, /maxParallelLiveRegistrations: 1/);
assert.doesNotMatch(snapshotSource, /process\.env\.DB|dbRows|dbExecute|createLiveModuleDatabaseHandlersFromRegistrations/);

assert.match(scriptSource, /createStage2LiveReadinessSnapshot/);
assert.match(scriptSource, /--live-handler <resource\/action>/);
assert.match(scriptSource, /does not query MySQL/);
assert.match(scriptSource, /does not register live handlers/);
assert.match(scriptSource, /does not mutate the live registry/);
assert.doesNotMatch(scriptSource, /process\.env\.DB|dbRows|dbExecute|createLiveModuleDatabaseHandlersFromRegistrations/);

assert.match(readModelRolloutDoc, /createStage2LiveReadinessSnapshot/);
assert.match(readModelRolloutDoc, /firstBatchReadModelsReady/);
assert.match(readModelRolloutDoc, /writeHandlersBlockedUntilReadModelsLive/);
assert.match(readModelRolloutDoc, /npm run plan:stage2-live-readiness/);
assert.match(readModelRolloutDoc, /--live-handler taxation\/list-waybills/);
assert.match(writeHandlerRolloutDoc, /createStage2LiveReadinessSnapshot/);
assert.match(writeHandlerRolloutDoc, /firstBatchReadModelsReady/);
assert.match(writeHandlerRolloutDoc, /liveActivationAllowedNow = false/);
assert.match(writeHandlerRolloutDoc, /npm run plan:stage2-live-readiness/);

const plannedSnapshot = createStage2LiveReadinessSnapshot();
assert.equal(plannedSnapshot.noMysqlConnection, true);
assert.equal(plannedSnapshot.liveRegistryMutation, false);
assert.equal(plannedSnapshot.handlerRegistrationMutation, false);
assert.equal(plannedSnapshot.maxParallelLiveRegistrations, 1);
assert.equal(plannedSnapshot.totalReadModelActions, 4);
assert.equal(plannedSnapshot.liveReadModelActions, 0);
assert.deepEqual(plannedSnapshot.pendingReadModelActions, [
  "list-waybills",
  "get-waybill",
  "list-shift-reports",
  "get-shift-report",
]);
assert.equal(plannedSnapshot.firstBatchReadModelsReady, false);
assert.equal(plannedSnapshot.writeHandlersBlockedUntilReadModelsLive, true);
assert.equal(plannedSnapshot.liveActivationAllowedNow, false);
assert.deepEqual(plannedSnapshot.modules.map((module) => [
  module.moduleId,
  module.readModelsReady,
  module.liveReadModelActions,
  module.pendingReadModelActions.length,
]), [
  ["taxation-waybills", false, 0, 2],
  ["mining-shift-reports", false, 0, 2],
]);
assert.ok(plannedSnapshot.writeActions.length > 0);
assert.ok(plannedSnapshot.writeActions.every((action) => action.blockedUntilReadModelsLive));
assert.ok(plannedSnapshot.writeActions.every((action) => !action.liveActivationAllowedNow));

const taxationReadModelsLive = createStage2LiveReadinessSnapshot([
  { resource: "taxation", databaseAction: "list-waybills" },
  { resource: "taxation", databaseAction: "get-waybill" },
]);
const taxationModule = taxationReadModelsLive.modules.find((module) => module.moduleId === "taxation-waybills");
const miningModule = taxationReadModelsLive.modules.find((module) => module.moduleId === "mining-shift-reports");
assert.equal(taxationModule?.readModelsReady, true);
assert.equal(miningModule?.readModelsReady, false);
assert.equal(taxationReadModelsLive.firstBatchReadModelsReady, false);
assert.equal(taxationReadModelsLive.writeHandlersBlockedUntilReadModelsLive, true);
assert.equal(taxationReadModelsLive.liveActivationAllowedNow, false);
assert.equal(
  taxationReadModelsLive.writeActions.find((action) => action.moduleId === "taxation-waybills")
    ?.sameModuleReadModelsReady,
  true,
);
assert.equal(
  taxationReadModelsLive.writeActions.find((action) => action.moduleId === "taxation-waybills")
    ?.firstBatchReadModelsReady,
  false,
);

const allReadModelsLive = createStage2LiveReadinessSnapshot([
  { resource: "taxation", databaseAction: "list-waybills" },
  { resource: "taxation", databaseAction: "get-waybill" },
  { resource: "dispatch", databaseAction: "list-shift-reports" },
  { resource: "dispatch", databaseAction: "get-shift-report" },
]);
assert.equal(allReadModelsLive.liveReadModelActions, 4);
assert.deepEqual(allReadModelsLive.pendingReadModelActions, []);
assert.equal(allReadModelsLive.firstBatchReadModelsReady, true);
assert.equal(allReadModelsLive.writeHandlersBlockedUntilReadModelsLive, false);
assert.equal(allReadModelsLive.liveActivationAllowedNow, true);
assert.ok(allReadModelsLive.writeActions.every((action) => action.liveActivationAllowedNow));
assert.match(allReadModelsLive.rule, /write handlers stay blocked/);

const helpRun = runLiveReadinessPlanner(["--help"]);
assert.equal(helpRun.status, 0);
assert.match(helpRun.stdout, /Usage: npm run plan:stage2-live-readiness/);
assert.match(helpRun.stdout, /does not query MySQL/);
assert.match(helpRun.stdout, /--live-handler <resource\/action>/);

const plannedRun = runLiveReadinessPlanner([]);
assert.equal(plannedRun.status, 0);
const cliPlannedSnapshot = JSON.parse(plannedRun.stdout) as ReturnType<typeof createStage2LiveReadinessSnapshot>;
assert.equal(cliPlannedSnapshot.firstBatchReadModelsReady, false);
assert.equal(cliPlannedSnapshot.writeHandlersBlockedUntilReadModelsLive, true);
assert.equal(cliPlannedSnapshot.liveActivationAllowedNow, false);

const simulatedRun = runLiveReadinessPlanner([
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
const cliSimulatedSnapshot = JSON.parse(simulatedRun.stdout) as ReturnType<typeof createStage2LiveReadinessSnapshot>;
assert.equal(cliSimulatedSnapshot.firstBatchReadModelsReady, true);
assert.equal(cliSimulatedSnapshot.writeHandlersBlockedUntilReadModelsLive, false);
assert.equal(cliSimulatedSnapshot.liveActivationAllowedNow, true);

const invalidRun = runLiveReadinessPlanner(["--live-handler", "not-valid"]);
assert.equal(invalidRun.status, 1);
assert.match(invalidRun.stderr, /Invalid --live-handler value/);

console.log("Stage 2 live readiness snapshot checks passed");

function runLiveReadinessPlanner(args: string[]) {
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
