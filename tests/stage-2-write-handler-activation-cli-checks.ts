import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createStage2WriteHandlerActivationChecklist,
  validateStage2WriteHandlerActivationChecklist,
} from "../lib/domain/workspaces/stage2WriteHandlerActivationChecklist";
import {
  createStage2WriteHandlerActivationSummary,
} from "../lib/domain/workspaces/stage2WriteHandlerActivationSummary";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const jitiCliPath = resolve(root, "node_modules/jiti/lib/jiti-cli.mjs");
const scriptPath = resolve(root, "scripts/plan-stage-2-write-handler-activation.ts");
const scriptSource = readFileSync(scriptPath, "utf8");
const checklistSource = readFileSync(
  resolve(root, "lib/domain/workspaces/stage2WriteHandlerActivationChecklist.ts"),
  "utf8",
);
const summarySource = readFileSync(
  resolve(root, "lib/domain/workspaces/stage2WriteHandlerActivationSummary.ts"),
  "utf8",
);

assert.equal(
  packageJson.scripts["plan:stage2-write-handlers"],
  "jiti scripts/plan-stage-2-write-handler-activation.ts",
);
assert.match(packageJson.scripts["check:dispatch-architecture"], /stage-2-write-handler-activation-cli-checks/);

assert.match(scriptSource, /createStage2WriteHandlerActivationChecklist/);
assert.match(scriptSource, /validateStage2WriteHandlerActivationChecklist/);
assert.match(scriptSource, /createStage2WriteHandlerActivationSummary/);
assert.match(scriptSource, /--requested-by <name>/);
assert.match(scriptSource, /--summary-only/);
assert.match(scriptSource, /does not query MySQL/);
assert.match(scriptSource, /does not register live handlers/);
assert.doesNotMatch(scriptSource, /loadDotEnvLocal|closeMysqlPool|process\.env\.DB|dbRows|dbExecute/);
assert.doesNotMatch(scriptSource, /configuredLiveModuleHandlers\s*=/);

assert.match(checklistSource, /stage2FirstReadModelModuleIds/);
assert.match(checklistSource, /readModelPrerequisites/);
assert.match(checklistSource, /createStage2WriteHandlerReadModelPrerequisites/);
assert.match(checklistSource, /missing_read_model_prerequisite/);
assert.match(checklistSource, /plan:write-handler-activation/);
assert.match(checklistSource, /review:write-handler/);
assert.match(checklistSource, /implementationPath: string/);
assert.match(checklistSource, /createStage2WriteHandlerImplementationPath/);
assert.match(checklistSource, /--implementation-path \$\{implementationPath\}/);
assert.match(checklistSource, /appliesChanges: false/);
assert.match(checklistSource, /databaseConnection: false/);
assert.match(checklistSource, /liveRegistryMutation: false/);
assert.match(checklistSource, /handlerRegistrationMutation: false/);
assert.match(checklistSource, /doesNotRegisterHandlers: true/);
assert.match(checklistSource, /stage2WriteHandlerStopConditions/);
assert.match(checklistSource, /Do not register a live write handler from this planner output/);
assert.match(checklistSource, /Stop if readModelPrerequisites\.ready is false/);
assert.match(checklistSource, /doesNotApplyChanges: true/);
assert.match(checklistSource, /noRegistrationFromPlan: true/);
assert.match(checklistSource, /noWriteSmokeAfterLiveWithoutTestDatabase: true/);
assert.match(checklistSource, /plannedLiveHandlerStatus: liveStatus\?\.status \?\? "unknown"/);
assert.doesNotMatch(checklistSource, /plannedSmokeRequest/);
assert.match(summarySource, /createStage2WriteHandlerActivationSummary/);
assert.match(summarySource, /nextActivationGate/);
assert.match(summarySource, /requiredCommands/);
assert.match(summarySource, /implementationPath/);
assert.match(summarySource, /createWriteReadModelLivePrerequisites/);
assert.match(summarySource, /readModelLivePrerequisitesReady/);
assert.match(summarySource, /requiresReadModelsLiveBeforeActivation/);
assert.match(summarySource, /blockedUntilReadModelsLive/);
assert.match(summarySource, /liveActivationAllowedNow/);
assert.match(summarySource, /requiresTestDatabaseForWriteSmoke/);
assert.match(summarySource, /noLiveRegistrationFromSummary/);

const checklist = createStage2WriteHandlerActivationChecklist("stage-2-write-check");
assert.equal(checklist.appliesChanges, false);
assert.equal(checklist.databaseConnection, false);
assert.equal(checklist.liveRegistryMutation, false);
assert.equal(checklist.handlerRegistrationMutation, false);
assert.equal(checklist.doesNotRegisterHandlers, true);
assert.ok(checklist.stopConditions.some((condition) => condition.includes("Do not register")));
assert.ok(checklist.stopConditions.some((condition) => condition.includes("readModelPrerequisites.ready")));
assert.ok(checklist.stopConditions.some((condition) => condition.includes("compact_write_response")));
assert.ok(checklist.stopConditions.some((condition) => condition.includes("more than one entity row")));
assert.equal(checklist.maxParallelActivations, 1);
assert.equal(checklist.requiresGreenVerifyBeforeEachAction, true);
assert.equal(checklist.requiresReadModelPathBeforeLive, true);
assert.deepEqual(checklist.items.map((item) => item.databaseAction), [
  "create-waybill",
  "patch-waybill",
  "transition-waybill",
  "create-shift-report",
  "patch-shift-report",
  "transition-shift-report",
]);
assert.ok(checklist.items.every((item) => item.contractKind === "write"));
assert.ok(checklist.items.every((item) => item.phase === "write-workflow"));
assert.ok(checklist.items.every((item) => item.verifyCommand === "npm run verify"));
assert.ok(checklist.items.every((item) => item.rollbackPlan === "Remove the live registry key and guarded write registration"));
assert.ok(checklist.items.every((item) => item.readyToConnectHandler));
assert.ok(checklist.items.every((item) => item.readModelPrerequisites.ready));
assert.ok(checklist.items.every((item) => item.readModelPrerequisites.listReady));
assert.ok(checklist.items.every((item) => item.readModelPrerequisites.detailReady));
assert.ok(checklist.items.every((item) => item.plannedLiveHandlerStatus === "planned-only"));
assert.ok(checklist.items.every((item) => item.doesNotApplyChanges));
assert.ok(checklist.items.every((item) => item.noRegistrationFromPlan));
assert.ok(checklist.items.every((item) => item.requiresReadModelPathBeforeLive));
assert.ok(checklist.items.every((item) => item.noWriteSmokeAfterLiveWithoutTestDatabase));
assert.ok(checklist.items.every((item) => (
  item.implementationPath === `lib/server/database/handlers/${item.resource}/${item.databaseAction}.ts`
)));
assert.ok(checklist.items.every((item) => item.planningCommand.includes("plan:write-handler-activation")));
assert.ok(checklist.items.every((item) => item.registrationReviewCommand.includes("review:write-handler")));
assert.ok(checklist.items.every((item) => (
  item.registrationReviewCommand.includes(`--implementation-path ${item.implementationPath}`)
)));
assert.equal(checklist.items.find((item) => item.databaseAction === "create-waybill")?.factoryKind, "create");
assert.deepEqual(checklist.items.find((item) => item.databaseAction === "create-waybill")?.readModelPrerequisites, {
  listAction: "list-waybills",
  detailAction: "get-waybill",
  listReady: true,
  detailReady: true,
  ready: true,
});
assert.deepEqual(checklist.items.find((item) => item.databaseAction === "create-shift-report")?.readModelPrerequisites, {
  listAction: "list-shift-reports",
  detailAction: "get-shift-report",
  listReady: true,
  detailReady: true,
  ready: true,
});
assert.equal(checklist.items.find((item) => item.databaseAction === "patch-waybill")?.factoryKind, "patch");
assert.equal(checklist.items.find((item) => item.databaseAction === "transition-waybill")?.factoryKind, "patch");
assert.equal(checklist.items.find((item) => item.databaseAction === "create-waybill")?.requiresDuplicateCheck, true);
assert.equal(checklist.items.find((item) => item.databaseAction === "patch-waybill")?.requiresExpectedVersion, true);
assert.deepEqual(validateStage2WriteHandlerActivationChecklist(checklist), []);

const summary = createStage2WriteHandlerActivationSummary("stage-2-write-check");
assert.equal(summary.ready, true);
assert.equal(summary.appliesChanges, false);
assert.equal(summary.databaseConnection, false);
assert.equal(summary.liveRegistryMutation, false);
assert.equal(summary.handlerRegistrationMutation, false);
assert.equal(summary.doesNotRegisterHandlers, true);
assert.deepEqual(summary.stopConditions, checklist.stopConditions);
assert.equal(summary.totalActions, 6);
assert.equal(summary.createActions, 2);
assert.equal(summary.patchActions, 2);
assert.equal(summary.workflowTransitionActions, 2);
assert.equal(summary.issueCount, 0);
assert.deepEqual(summary.moduleIds, ["taxation-waybills", "mining-shift-reports"]);
assert.equal(summary.firstAction?.databaseAction, "create-waybill");
assert.equal(summary.firstAction?.factoryKind, "create");
assert.equal(
  summary.firstAction?.implementationPath,
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.equal(summary.firstAction?.plannedLiveHandlerStatus, "planned-only");
assert.equal(summary.nextActivationGate?.ready, true);
assert.equal(summary.nextActivationGate?.maxParallelActivations, 1);
assert.equal(summary.nextActivationGate?.readModelLivePrerequisitesReady, false);
assert.equal(summary.nextActivationGate?.requiresReadModelsLiveBeforeActivation, true);
assert.equal(summary.nextActivationGate?.blockedUntilReadModelsLive, true);
assert.equal(summary.nextActivationGate?.liveActivationAllowedNow, false);
assert.equal(summary.nextActivationGate?.requiresGreenVerifyBeforeActivation, true);
assert.equal(summary.nextActivationGate?.requiresTestDatabaseForWriteSmoke, true);
assert.equal(summary.nextActivationGate?.noLiveRegistrationFromSummary, true);
assert.deepEqual(summary.nextActivationGate?.requiredCommands, [
  summary.firstAction?.planningCommand,
  summary.firstAction?.registrationReviewCommand,
  "npm run verify",
]);

const helpRun = runPlanner(["--help"]);
assert.equal(helpRun.status, 0);
assert.match(helpRun.stdout, /Usage: npm run plan:stage2-write-handlers/);
assert.match(helpRun.stdout, /does not query MySQL/);
assert.match(helpRun.stdout, /does not register live handlers/);
assert.match(helpRun.stdout, /--summary-only/);

const planRun = runPlanner(["--requested-by", "stage-2-write-cli-check"]);
assert.equal(planRun.status, 0);
const plan = JSON.parse(planRun.stdout) as {
  requestedBy: string;
  ready: boolean;
  issues: unknown[];
  summary: typeof summary;
  maxParallelActivations: number;
  appliesChanges: boolean;
  databaseConnection: boolean;
  liveRegistryMutation: boolean;
  handlerRegistrationMutation: boolean;
  doesNotRegisterHandlers: boolean;
  stopConditions: string[];
  requiresGreenVerifyBeforeEachAction: boolean;
  requiresReadModelPathBeforeLive: boolean;
  items: typeof checklist.items;
};
assert.equal(plan.requestedBy, "stage-2-write-cli-check");
assert.equal(plan.ready, true);
assert.equal(plan.appliesChanges, false);
assert.equal(plan.databaseConnection, false);
assert.equal(plan.liveRegistryMutation, false);
assert.equal(plan.handlerRegistrationMutation, false);
assert.equal(plan.doesNotRegisterHandlers, true);
assert.deepEqual(plan.stopConditions, checklist.stopConditions);
assert.deepEqual(plan.issues, []);
assert.equal(plan.summary.totalActions, 6);
assert.equal(plan.summary.nextActivationGate?.ready, true);
assert.equal(plan.summary.nextActivationGate?.blockedUntilReadModelsLive, true);
assert.equal(plan.summary.nextActivationGate?.liveActivationAllowedNow, false);
assert.ok(plan.summary.nextActivationGate?.requiredCommands.includes("npm run verify"));
assert.ok(plan.summary.nextActivationGate?.requiredCommands.some((command) => (
  command.includes("plan:write-handler-activation")
)));
assert.ok(plan.summary.nextActivationGate?.requiredCommands.some((command) => (
  command.includes("review:write-handler")
)));
assert.equal(plan.maxParallelActivations, 1);
assert.equal(plan.requiresGreenVerifyBeforeEachAction, true);
assert.equal(plan.requiresReadModelPathBeforeLive, true);
assert.deepEqual(plan.items.map((item) => item.databaseAction), checklist.items.map((item) => item.databaseAction));
assert.ok(plan.items.every((item) => item.registrationReviewCommand.includes("--requested-by stage-2-write-cli-check")));
assert.ok(plan.items.every((item) => (
  item.registrationReviewCommand.includes(`--implementation-path ${item.implementationPath}`)
)));
assert.ok(plan.items.every((item) => item.planningCommand.includes("plan:write-handler-activation")));
assert.ok(plan.items.every((item) => item.readModelPrerequisites.ready));

const summaryRun = runPlanner(["--requested-by", "stage-2-write-cli-check", "--summary-only"]);
assert.equal(summaryRun.status, 0);
const cliSummary = JSON.parse(summaryRun.stdout) as typeof summary & { items?: unknown[] };
assert.equal(cliSummary.requestedBy, "stage-2-write-cli-check");
assert.equal(cliSummary.ready, true);
assert.equal(cliSummary.appliesChanges, false);
assert.equal(cliSummary.databaseConnection, false);
assert.equal(cliSummary.liveRegistryMutation, false);
assert.equal(cliSummary.handlerRegistrationMutation, false);
assert.equal(cliSummary.doesNotRegisterHandlers, true);
assert.deepEqual(cliSummary.stopConditions, checklist.stopConditions);
assert.equal(cliSummary.totalActions, 6);
assert.equal(cliSummary.firstAction?.databaseAction, "create-waybill");
assert.equal(
  cliSummary.firstAction?.implementationPath,
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.equal(cliSummary.nextActivationGate?.noLiveRegistrationFromSummary, true);
assert.equal(cliSummary.nextActivationGate?.blockedUntilReadModelsLive, true);
assert.equal(cliSummary.nextActivationGate?.liveActivationAllowedNow, false);
assert.deepEqual(cliSummary.nextActivationGate?.requiredCommands, [
  cliSummary.firstAction?.planningCommand,
  cliSummary.firstAction?.registrationReviewCommand,
  "npm run verify",
]);
assert.equal(cliSummary.items, undefined);

console.log("Stage 2 write-handler activation CLI checks passed");

function runPlanner(args: string[]) {
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
