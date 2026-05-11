import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createStage2ActivationOverview } from "../lib/domain/workspaces/stage2ActivationOverview";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const overviewSource = readFileSync(
  resolve(root, "lib/domain/workspaces/stage2ActivationOverview.ts"),
  "utf8",
);
const scriptPath = resolve(root, "scripts/plan-stage-2-activation-overview.ts");
const scriptSource = readFileSync(scriptPath, "utf8");
const readModelRolloutDoc = readFileSync(
  resolve(root, "docs/STAGE_2_READ_MODEL_ROLLOUT.md"),
  "utf8",
);
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const jitiCliPath = resolve(root, "node_modules/jiti/lib/jiti-cli.mjs");

assert.match(packageJson.scripts["check:dispatch-architecture"], /stage-2-activation-overview-checks/);
assert.equal(
  packageJson.scripts["plan:stage2-overview"],
  "jiti scripts/plan-stage-2-activation-overview.ts",
);
assert.match(overviewSource, /createStage2FirstReadModelActivationSummary/);
assert.match(overviewSource, /createStage2WriteHandlerActivationSummary/);
assert.match(overviewSource, /currentActivationStep: "read-model"/);
assert.match(overviewSource, /blockedUntilReadModelsLive/);
assert.match(overviewSource, /liveActivationAllowedNow/);
assert.match(overviewSource, /writeHandlerSummary\.nextActivationGate\?\.blockedUntilReadModelsLive/);
assert.match(overviewSource, /writeHandlerSummary\.nextActivationGate\?\.liveActivationAllowedNow/);
assert.match(overviewSource, /noMysqlConnection: true/);
assert.match(overviewSource, /noLiveRegistryMutation: true/);
assert.match(overviewSource, /noHandlerRegistrationMutation: true/);
assert.doesNotMatch(overviewSource, /loadDotEnvLocal|closeMysqlPool|process\.env\.DB|dbRows|dbExecute/);
assert.doesNotMatch(overviewSource, /configuredLiveModuleHandlers\s*=/);
assert.match(scriptSource, /createStage2ActivationOverview/);
assert.match(scriptSource, /--requested-by <name>/);
assert.match(scriptSource, /does not query MySQL/);
assert.match(scriptSource, /does not register live handlers/);
assert.match(scriptSource, /does not mutate the live registry/);
assert.doesNotMatch(scriptSource, /loadDotEnvLocal|closeMysqlPool|process\.env\.DB|dbRows|dbExecute/);
assert.doesNotMatch(scriptSource, /configuredLiveModuleHandlers\s*=/);

const overview = createStage2ActivationOverview("stage-2-overview-check");

assert.equal(overview.requestedBy, "stage-2-overview-check");
assert.equal(overview.readyToPlan, true);
assert.equal(overview.currentActivationStep, "read-model");
assert.deepEqual(overview.activationOrder, ["read-models", "write-handlers"]);
assert.equal(overview.maxParallelLiveRegistrations, 1);
assert.equal(overview.noMysqlConnection, true);
assert.equal(overview.noLiveRegistryMutation, true);
assert.equal(overview.noHandlerRegistrationMutation, true);

assert.equal(overview.readModels.ready, true);
assert.equal(overview.readModels.totalActions, 4);
assert.equal(overview.readModels.firstAction, "list-waybills");
assert.equal(overview.readModels.nextActivationGateReady, true);
assert.ok(overview.readModels.requiredCommands.some((command) => (
  command.includes("check:read-model-schema")
)));
assert.ok(overview.readModels.requiredCommands.some((command) => (
  command.includes("review:live-handler")
)));
assert.ok(overview.readModels.requiredCommands.includes("npm run verify"));

assert.equal(overview.writeHandlers.readyAfterReadModels, true);
assert.equal(overview.writeHandlers.totalActions, 6);
assert.equal(overview.writeHandlers.firstAction, "create-waybill");
assert.equal(overview.writeHandlers.nextActivationGateReady, true);
assert.equal(overview.writeHandlers.blockedUntilReadModelsLive, true);
assert.equal(overview.writeHandlers.liveActivationAllowedNow, false);
assert.ok(overview.writeHandlers.requiredCommands.some((command) => (
  command.includes("plan:write-handler-activation")
)));
assert.ok(overview.writeHandlers.requiredCommands.some((command) => (
  command.includes("review:write-handler")
)));
assert.ok(overview.writeHandlers.requiredCommands.includes("npm run verify"));
assert.match(overview.rule, /read models first/);
assert.match(overview.rule, /write handlers stay blocked/);

assert.match(readModelRolloutDoc, /Stage 2 Activation Overview/);
assert.match(readModelRolloutDoc, /`createStage2ActivationOverview`/);
assert.match(readModelRolloutDoc, /currentActivationStep = `read-model`/);
assert.match(readModelRolloutDoc, /writeHandlers\.liveActivationAllowedNow = false/);
assert.match(readModelRolloutDoc, /does not query MySQL/);
assert.match(readModelRolloutDoc, /does not mutate the live registry/);
assert.match(readModelRolloutDoc, /npm run plan:stage2-overview -- --requested-by backend-engineer/);

const helpRun = runOverviewPlanner(["--help"]);
assert.equal(helpRun.status, 0);
assert.match(helpRun.stdout, /Usage: npm run plan:stage2-overview/);
assert.match(helpRun.stdout, /does not query MySQL/);
assert.match(helpRun.stdout, /does not register live handlers/);
assert.match(helpRun.stdout, /does not mutate the live registry/);

const planRun = runOverviewPlanner(["--requested-by", "stage-2-overview-cli"]);
assert.equal(planRun.status, 0);
const cliOverview = JSON.parse(planRun.stdout) as ReturnType<typeof createStage2ActivationOverview>;
assert.equal(cliOverview.requestedBy, "stage-2-overview-cli");
assert.equal(cliOverview.currentActivationStep, "read-model");
assert.equal(cliOverview.readModels.firstAction, "list-waybills");
assert.equal(cliOverview.writeHandlers.firstAction, "create-waybill");
assert.equal(cliOverview.writeHandlers.blockedUntilReadModelsLive, true);
assert.equal(cliOverview.writeHandlers.liveActivationAllowedNow, false);
assert.ok(cliOverview.readModels.requiredCommands.some((command) => (
  command.includes("--requested-by stage-2-overview-cli")
)));
assert.ok(cliOverview.writeHandlers.requiredCommands.some((command) => (
  command.includes("--requested-by stage-2-overview-cli")
)));

console.log("Stage 2 activation overview checks passed");

function runOverviewPlanner(args: string[]) {
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
