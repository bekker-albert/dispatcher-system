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
const scriptPath = resolve(root, "scripts/plan-stage-2-read-model-activation.ts");
const scriptSource = readFileSync(scriptPath, "utf8");
const checklistSource = readFileSync(
  resolve(root, "lib/domain/workspaces/stage2ReadModelActivationChecklist.ts"),
  "utf8",
);
const summarySource = readFileSync(
  resolve(root, "lib/domain/workspaces/stage2ReadModelActivationSummary.ts"),
  "utf8",
);
const commandSource = readFileSync(
  resolve(root, "lib/domain/workspaces/stage2ReadModelActivationCommands.ts"),
  "utf8",
);

assert.equal(
  packageJson.scripts["plan:stage2-read-models"],
  "jiti scripts/plan-stage-2-read-model-activation.ts",
);
assert.match(scriptSource, /createStage2FirstReadModelActivationChecklist/);
assert.match(scriptSource, /validateStage2FirstReadModelActivationChecklist/);
assert.match(scriptSource, /createStage2FirstReadModelActivationSummary/);
assert.match(scriptSource, /--requested-by <name>/);
assert.match(scriptSource, /--summary-only/);
assert.match(scriptSource, /does not query MySQL/);
assert.match(scriptSource, /does not register live handlers/);
assert.doesNotMatch(scriptSource, /loadDotEnvLocal/);
assert.doesNotMatch(scriptSource, /closeMysqlPool/);
assert.doesNotMatch(scriptSource, /reviewMysqlLiveHandlerActivationPreflight/);
assert.match(commandSource, /stage2ReadModelImplementationPath/);
assert.match(commandSource, /--implementation-path \$\{stage2ReadModelImplementationPath\}/);
assert.match(checklistSource, /implementationPath: typeof stage2ReadModelImplementationPath/);
assert.match(checklistSource, /implementationPath: stage2ReadModelImplementationPath/);
assert.match(summarySource, /implementationPath: typeof stage2ReadModelImplementationPath/);

const helpRun = runPlanner(["--help"]);
assert.equal(helpRun.status, 0);
assert.match(helpRun.stdout, /Usage: npm run plan:stage2-read-models/);
assert.match(helpRun.stdout, /does not query MySQL/);
assert.match(helpRun.stdout, /does not register live handlers/);
assert.match(helpRun.stdout, /--summary-only/);

const planRun = runPlanner(["--requested-by", "stage-2-cli-check"]);
assert.equal(planRun.status, 0);
const plan = JSON.parse(planRun.stdout) as {
  requestedBy: string;
  ready: boolean;
  issues: unknown[];
  summary: {
    ready: boolean;
    totalActions: number;
    issueCount: number;
    nextActivationGate?: {
      ready: boolean;
      maxParallelActivations: number;
      requiredCommands: string[];
      requiresSchemaPreflightBeforeActivation: boolean;
      requiresGreenVerifyBeforeActivation: boolean;
      noLiveRegistrationFromSummary: boolean;
    };
    firstAction?: {
      databaseAction: string;
      plannedLiveHandlerStatus: string;
      implementationPath: string;
      schemaPreflightCommand: string;
      activationPreflightCommand: string;
    };
  };
  maxParallelActivations: number;
  requiresGreenVerifyBeforeEachAction: boolean;
  items: Array<{
    databaseAction: string;
    implementationPath: string;
    schemaPreflightCommand: string;
    activationPreflightCommand: string;
    verifyCommand: string;
    plannedSmokeRequest: {
      endpoint: string;
      body: { payload: { query?: { filters?: Record<string, unknown> } } };
    };
    smokeExpectation: {
      plannedStatus: number;
      plannedCode: string;
      plannedLiveHandlerStatus: string;
      liveStatus: number;
    };
  }>;
};

assert.equal(plan.requestedBy, "stage-2-cli-check");
assert.equal(plan.ready, true);
assert.deepEqual(plan.issues, []);
assert.equal(plan.summary.ready, true);
assert.equal(plan.summary.totalActions, 4);
assert.equal(plan.summary.issueCount, 0);
assert.equal(plan.summary.firstAction?.databaseAction, "list-waybills");
assert.equal(plan.summary.firstAction?.plannedLiveHandlerStatus, "planned-only");
assert.equal(plan.summary.firstAction?.implementationPath, "lib/server/database/module-live-handlers.ts");
assert.equal(plan.summary.nextActivationGate?.ready, true);
assert.equal(plan.summary.nextActivationGate?.maxParallelActivations, 1);
assert.equal(plan.summary.nextActivationGate?.requiresSchemaPreflightBeforeActivation, true);
assert.equal(plan.summary.nextActivationGate?.requiresGreenVerifyBeforeActivation, true);
assert.equal(plan.summary.nextActivationGate?.noLiveRegistrationFromSummary, true);
assert.deepEqual(plan.summary.nextActivationGate?.requiredCommands, [
  plan.summary.firstAction?.schemaPreflightCommand,
  plan.summary.firstAction?.activationPreflightCommand,
  "npm run verify",
]);
assert.equal(plan.maxParallelActivations, 1);
assert.equal(plan.requiresGreenVerifyBeforeEachAction, true);
assert.deepEqual(plan.items.map((item) => item.databaseAction), [
  "list-waybills",
  "get-waybill",
  "list-shift-reports",
  "get-shift-report",
]);
assert.ok(plan.items.every((item) => item.schemaPreflightCommand.startsWith("npm run check:read-model-schema -- --workspace ")));
assert.ok(plan.items.every((item) => item.activationPreflightCommand.includes("npm run review:live-handler --")));
assert.ok(plan.items.every((item) => item.activationPreflightCommand.includes("--requested-by stage-2-cli-check")));
assert.ok(plan.items.every((item) => item.implementationPath === "lib/server/database/module-live-handlers.ts"));
assert.ok(plan.items.every((item) => (
  item.activationPreflightCommand.includes(`--implementation-path ${item.implementationPath}`)
)));
assert.ok(plan.items.every((item) => item.verifyCommand === "npm run verify"));
assert.ok(plan.items.every((item) => item.plannedSmokeRequest.endpoint === "/api/database"));
assert.ok(plan.items.every((item) => item.smokeExpectation.plannedStatus === 501));
assert.ok(plan.items.every((item) => item.smokeExpectation.plannedCode === "planned_module_database_action"));
assert.ok(plan.items.every((item) => item.smokeExpectation.plannedLiveHandlerStatus === "planned-only"));
assert.ok(plan.items.every((item) => item.smokeExpectation.liveStatus === 200));
assert.equal(
  plan.items.find((item) => item.databaseAction === "list-shift-reports")
    ?.plannedSmokeRequest.body.payload.query?.filters?.shift,
  "<shift>",
);

const summaryRun = runPlanner(["--requested-by", "stage-2-cli-check", "--summary-only"]);
assert.equal(summaryRun.status, 0);
const summary = JSON.parse(summaryRun.stdout) as {
  requestedBy: string;
  ready: boolean;
  totalActions: number;
  issueCount: number;
  nextActivationGate?: {
    ready: boolean;
    requiredCommands: string[];
    noLiveRegistrationFromSummary: boolean;
  };
  firstAction?: {
    databaseAction: string;
    implementationPath: string;
    schemaPreflightCommand: string;
    activationPreflightCommand: string;
  };
  items?: unknown[];
};
assert.equal(summary.requestedBy, "stage-2-cli-check");
assert.equal(summary.ready, true);
assert.equal(summary.totalActions, 4);
assert.equal(summary.issueCount, 0);
assert.equal(summary.firstAction?.databaseAction, "list-waybills");
assert.equal(summary.firstAction?.implementationPath, "lib/server/database/module-live-handlers.ts");
assert.equal(summary.nextActivationGate?.ready, true);
assert.equal(summary.nextActivationGate?.noLiveRegistrationFromSummary, true);
assert.deepEqual(summary.nextActivationGate?.requiredCommands, [
  summary.firstAction?.schemaPreflightCommand,
  summary.firstAction?.activationPreflightCommand,
  "npm run verify",
]);
assert.equal(summary.items, undefined);

console.log("Stage 2 read-model activation CLI checks passed");

function runPlanner(args: string[]) {
  return spawnSync(process.execPath, [jitiCliPath, scriptPath, ...args], {
    cwd: root,
    encoding: "utf8",
  });
}
