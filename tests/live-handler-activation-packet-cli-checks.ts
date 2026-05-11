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
const scriptPath = resolve(root, "scripts/plan-live-handler-activation-packet.ts");
const scriptSource = readFileSync(scriptPath, "utf8");

assert.equal(
  packageJson.scripts["plan:live-handler-activation"],
  "jiti scripts/plan-live-handler-activation-packet.ts",
);
assert.match(packageJson.scripts["check:data-access"], /live-handler-activation-packet-cli-checks/);

assert.match(scriptSource, /reviewModuleHandlerActivation/);
assert.match(scriptSource, /getModuleLiveHandlerStatus/);
assert.match(scriptSource, /reviewMysqlReadModelLiveHandlerRegistrationCandidate/);
assert.match(scriptSource, /createReadModelSchemaReviewPlan/);
assert.match(scriptSource, /liveActivationReady: false/);
assert.match(scriptSource, /appliesChanges: false/);
assert.match(scriptSource, /databaseConnection: false/);
assert.match(scriptSource, /schemaChecked: false/);
assert.match(scriptSource, /liveRegistryMutation: false/);
assert.match(scriptSource, /handlerRegistrationMutation: false/);
assert.match(scriptSource, /schemaPreflightGate/);
assert.match(scriptSource, /noLiveRegistrationFromPacket: true/);
assert.match(scriptSource, /mysql_schema_not_checked/);
assert.match(scriptSource, /change_reason_placeholder/);
assert.match(scriptSource, /rollback_plan_placeholder/);
assert.match(scriptSource, /activation_scope_not_one/);
assert.match(scriptSource, /parseActivationScopeSize/);
assert.match(scriptSource, /isPlaceholderText/);
assert.match(scriptSource, /Do not register a live handler from this packet alone/);
assert.doesNotMatch(scriptSource, /reviewMysqlLiveHandlerActivationPreflight/);
assert.doesNotMatch(scriptSource, /loadDotEnvLocal|closeMysqlPool|process\.env\.DB|dbRows|dbExecute/);
assert.doesNotMatch(scriptSource, /configuredLiveModuleHandlers\s*=/);

const helpRun = runPacket(["--help"]);
assert.equal(helpRun.status, 0);
assert.match(helpRun.stdout, /Usage: npm run plan:live-handler-activation/);
assert.match(helpRun.stdout, /non-mutating activation packet/);
assert.match(helpRun.stdout, /does not connect to MySQL/);
assert.match(helpRun.stdout, /does not edit the live registry/);

const missingFlagsRun = runPacket(["--resource", "taxation"]);
assert.equal(missingFlagsRun.status, 1);
assert.match(missingFlagsRun.stderr, /Missing required flags: --action/);
assert.match(missingFlagsRun.stdout, /Required flags:/);

const listPacketRun = runPacket([
  "--resource", "taxation",
  "--action", "list-waybills",
]);
assert.equal(listPacketRun.status, 0);
const listPacket = JSON.parse(listPacketRun.stdout) as {
  mode: string;
  ready: boolean;
  liveActivationReady: boolean;
  appliesChanges: boolean;
  databaseConnection: boolean;
  schemaChecked: boolean;
  liveRegistryMutation: boolean;
  handlerRegistrationMutation: boolean;
  activationScopeSize: number;
  currentLiveStatus: string;
  activationReview: {
    status: string;
    moduleId?: string;
    workspaceId?: string;
    nextRegistryEntry?: { resource: string; databaseAction: string };
  };
  registrationCandidate: {
    ready: boolean;
    moduleId?: string;
    workspaceId?: string;
    factoryKind?: string;
    registrationSummary?: {
      resource: string;
      databaseAction: string;
      factoryKind: string;
      implementationPath: string;
    };
  };
  schemaPlan?: {
    mode: string;
    appliesChanges: boolean;
    schemaChecked: boolean;
    liveHandlerActivation: boolean;
    plans: Array<{
      moduleId: string;
      tableName: string;
      createTableStatement: string;
      indexStatements: string[];
    }>;
  };
  schemaPreflightGate: {
    ready: boolean;
    schemaChecked: boolean;
    requiredCommand: string;
    planningCommand: string;
    noLiveRegistrationFromPacket: boolean;
  };
  issues: Array<{ source: string; code: string }>;
  nextCommands: string[];
  stopConditions: string[];
};

assert.equal(listPacket.mode, "activation-packet");
assert.equal(listPacket.ready, false);
assert.equal(listPacket.liveActivationReady, false);
assert.equal(listPacket.appliesChanges, false);
assert.equal(listPacket.databaseConnection, false);
assert.equal(listPacket.schemaChecked, false);
assert.equal(listPacket.liveRegistryMutation, false);
assert.equal(listPacket.handlerRegistrationMutation, false);
assert.equal(listPacket.activationScopeSize, 1);
assert.equal(listPacket.currentLiveStatus, "planned-only");
assert.equal(listPacket.activationReview.status, "ready-to-register");
assert.equal(listPacket.activationReview.moduleId, "taxation-waybills");
assert.equal(listPacket.activationReview.workspaceId, "taxation");
assert.deepEqual(listPacket.activationReview.nextRegistryEntry, {
  resource: "taxation",
  databaseAction: "list-waybills",
});
assert.equal(listPacket.registrationCandidate.ready, true);
assert.equal(listPacket.registrationCandidate.moduleId, "taxation-waybills");
assert.equal(listPacket.registrationCandidate.workspaceId, "taxation");
assert.equal(listPacket.registrationCandidate.factoryKind, "list");
assert.deepEqual(listPacket.registrationCandidate.registrationSummary, {
  resource: "taxation",
  databaseAction: "list-waybills",
  factoryKind: "list",
  implementationPath: "lib/server/database/module-live-handlers.ts",
});
assert.equal(listPacket.schemaPlan?.mode, "plan-only");
assert.equal(listPacket.schemaPlan?.appliesChanges, false);
assert.equal(listPacket.schemaPlan?.schemaChecked, false);
assert.equal(listPacket.schemaPlan?.liveHandlerActivation, false);
assert.equal(listPacket.schemaPlan?.plans.length, 1);
assert.equal(listPacket.schemaPlan?.plans[0]?.moduleId, "taxation-waybills");
assert.equal(listPacket.schemaPlan?.plans[0]?.tableName, "taxation_waybills");
assert.match(listPacket.schemaPlan?.plans[0]?.createTableStatement ?? "", /CREATE TABLE `taxation_waybills`/);
assert.equal(listPacket.schemaPlan?.plans[0]?.indexStatements.length, 3);
assert.equal(listPacket.schemaPreflightGate.ready, false);
assert.equal(listPacket.schemaPreflightGate.schemaChecked, false);
assert.equal(
  listPacket.schemaPreflightGate.requiredCommand,
  "npm run check:read-model-schema -- --module taxation-waybills",
);
assert.equal(
  listPacket.schemaPreflightGate.planningCommand,
  "npm run plan:read-model-schema -- --module taxation-waybills --sql",
);
assert.equal(listPacket.schemaPreflightGate.noLiveRegistrationFromPacket, true);
assert.ok(listPacket.issues.some((issue) => issue.source === "schema" && issue.code === "mysql_schema_not_checked"));
assert.ok(listPacket.nextCommands.some((command) => command.includes("plan:read-model-schema -- --module taxation-waybills --sql")));
assert.ok(listPacket.nextCommands.some((command) => command.includes("check:read-model-schema -- --module taxation-waybills")));
assert.ok(listPacket.nextCommands.some((command) => command.includes("review:live-handler")));
assert.ok(listPacket.nextCommands.some((command) => command.includes("--activation-scope-size 1")));
assert.ok(listPacket.stopConditions.some((condition) => condition.includes("Do not register a live handler")));

const placeholderReasonPacketRun = runPacket([
  "--resource", "taxation",
  "--action", "list-waybills",
  "--reason", "TODO",
]);
assert.equal(placeholderReasonPacketRun.status, 1);
const placeholderReasonPacket = JSON.parse(placeholderReasonPacketRun.stdout) as typeof listPacket;
assert.ok(placeholderReasonPacket.issues.some((issue) => (
  issue.source === "packet" && issue.code === "change_reason_placeholder"
)));

const placeholderRollbackPacketRun = runPacket([
  "--resource", "taxation",
  "--action", "list-waybills",
  "--rollback-plan", "n/a",
]);
assert.equal(placeholderRollbackPacketRun.status, 1);
const placeholderRollbackPacket = JSON.parse(placeholderRollbackPacketRun.stdout) as typeof listPacket;
assert.ok(placeholderRollbackPacket.issues.some((issue) => (
  issue.source === "packet" && issue.code === "rollback_plan_placeholder"
)));

const invalidScopePacketRun = runPacket([
  "--resource", "taxation",
  "--action", "list-waybills",
  "--activation-scope-size", "abc",
]);
assert.equal(invalidScopePacketRun.status, 1);
const invalidScopePacket = JSON.parse(invalidScopePacketRun.stdout) as typeof listPacket;
assert.ok(invalidScopePacket.issues.some((issue) => (
  issue.source === "packet" && issue.code === "activation_scope_not_one"
)));

const unknownPacketRun = runPacket([
  "--resource", "taxation",
  "--action", "not-a-real-action",
]);
assert.equal(unknownPacketRun.status, 1);
const unknownPacket = JSON.parse(unknownPacketRun.stdout) as typeof listPacket;
assert.equal(unknownPacket.currentLiveStatus, "unknown");
assert.ok(unknownPacket.issues.some((issue) => issue.code === "unknown_handler"));

console.log("Live handler activation packet CLI checks passed");

function runPacket(args: string[]) {
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
