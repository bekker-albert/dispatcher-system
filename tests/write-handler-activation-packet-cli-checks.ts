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
const scriptPath = resolve(root, "scripts/plan-write-handler-activation-packet.ts");
const scriptSource = readFileSync(scriptPath, "utf8");

assert.equal(
  packageJson.scripts["plan:write-handler-activation"],
  "jiti scripts/plan-write-handler-activation-packet.ts",
);
assert.match(packageJson.scripts["check:data-access"], /write-handler-activation-packet-cli-checks/);

assert.match(scriptSource, /reviewModuleHandlerActivation/);
assert.match(scriptSource, /getModuleLiveHandlerStatus/);
assert.match(scriptSource, /createWriteReadModelLivePrerequisites/);
assert.match(scriptSource, /createExpectedWriteImplementationPath/);
assert.match(scriptSource, /isSafeWriteImplementationTarget/);
assert.match(scriptSource, /reviewWriteLiveHandlerRegistrationCandidate/);
assert.match(scriptSource, /Defaults to lib\/server\/database\/handlers\/<resource>\/<action>\.ts/);
assert.match(scriptSource, /expectedImplementationPath/);
assert.match(scriptSource, /--implementation-path \$\{writeRegistrationCandidate\.expectedImplementationPath\}/);
assert.match(scriptSource, /readModelLivePrerequisites/);
assert.match(scriptSource, /read_model_live_prerequisite_missing/);
assert.match(scriptSource, /appliesChanges: false/);
assert.match(scriptSource, /databaseConnection: false/);
assert.match(scriptSource, /liveRegistryMutation: false/);
assert.match(scriptSource, /handlerRegistrationMutation: false/);
assert.match(scriptSource, /write_handler_not_registered/);
assert.match(scriptSource, /change_reason_placeholder/);
assert.match(scriptSource, /rollback_plan_placeholder/);
assert.match(scriptSource, /handler_key_invalid/);
assert.match(scriptSource, /Stop if handler_key_invalid is present for resource\/action/);
assert.match(scriptSource, /Resource\/action keys must be lowercase path segments/);
assert.match(scriptSource, /Traversal, slashes, backslashes, uppercase letters, and empty segments are blocked with handler_key_invalid/);
assert.match(scriptSource, /const handlerKeySafe = isSafeWriteImplementationTarget\(command\.resource, command\.databaseAction\)/);
assert.match(scriptSource, /\.\.\.\(handlerKeySafe \? \[reviewCommand\] : \[\]\)/);
assert.match(scriptSource, /activation_scope_not_one/);
assert.match(scriptSource, /hasPacketValidationIssue/);
assert.match(scriptSource, /parseActivationScopeSize/);
assert.match(scriptSource, /isPlaceholderText/);
assert.match(scriptSource, /Do not register a live write handler from this packet alone/);
assert.doesNotMatch(scriptSource, /loadDotEnvLocal|closeMysqlPool|process\.env\.DB|dbRows|dbExecute/);
assert.doesNotMatch(scriptSource, /createLiveModuleDatabaseHandlersFromRegistrations/);
assert.doesNotMatch(scriptSource, /configuredLiveModuleHandlers\s*=/);

const helpRun = runPacket(["--help"]);
assert.equal(helpRun.status, 0);
assert.match(helpRun.stdout, /Usage: npm run plan:write-handler-activation/);
assert.match(helpRun.stdout, /non-mutating activation packet/);
assert.match(helpRun.stdout, /does not connect to MySQL/);
assert.match(helpRun.stdout, /does not edit the live registry/);
assert.match(helpRun.stdout, /does not register a handler/);
assert.match(helpRun.stdout, /Resource\/action keys must be lowercase path segments/);
assert.match(helpRun.stdout, /handler_key_invalid/);

const missingFlagsRun = runPacket(["--resource", "taxation"]);
assert.equal(missingFlagsRun.status, 1);
assert.match(missingFlagsRun.stderr, /Missing or invalid required flags/);
assert.match(missingFlagsRun.stdout, /--factory-kind/);

const createPacketRun = runPacket([
  "--resource", "taxation",
  "--action", "create-waybill",
  "--factory-kind", "create",
]);
assert.equal(createPacketRun.status, 0);
const createPacket = JSON.parse(createPacketRun.stdout) as {
  mode: string;
  ready: boolean;
  appliesChanges: boolean;
  databaseConnection: boolean;
  liveRegistryMutation: boolean;
  handlerRegistrationMutation: boolean;
  activationScopeSize: number;
  currentLiveStatus: string;
  readModelLivePrerequisites: {
    ready: boolean;
    requiredActions: Array<{
      resource: string;
      databaseAction: string;
      contractKind: string;
      liveStatus: string;
      ready: boolean;
    }>;
    rule: string;
  };
  activationReview: {
    status: string;
    moduleId?: string;
    workspaceId?: string;
    nextRegistryEntry?: { resource: string; databaseAction: string };
  };
  writeRegistrationCandidate: {
    ready: boolean;
    moduleId?: string;
    workspaceId?: string;
    pipelineKind?: string;
    expectedFactoryKind?: string;
    requestedFactoryKind: string;
    expectedImplementationPath: string;
    missingRuntimeRequirements: string[];
    runtimeRequirements: string[];
    issues: string[];
    registrationSummary?: {
      resource: string;
      databaseAction: string;
      factoryKind: string;
      implementationPath: string;
    };
    doesNotRegisterHandler: boolean;
  };
  issues: Array<{ source: string; code: string }>;
  nextCommands: string[];
  stopConditions: string[];
};
assert.equal(createPacket.mode, "write-handler-activation-packet");
assert.equal(createPacket.ready, false);
assert.equal(createPacket.appliesChanges, false);
assert.equal(createPacket.databaseConnection, false);
assert.equal(createPacket.liveRegistryMutation, false);
assert.equal(createPacket.handlerRegistrationMutation, false);
assert.equal(createPacket.activationScopeSize, 1);
assert.equal(createPacket.currentLiveStatus, "planned-only");
assert.equal(createPacket.readModelLivePrerequisites.ready, false);
assert.deepEqual(createPacket.readModelLivePrerequisites.requiredActions.map((action) => (
  [action.databaseAction, action.contractKind, action.liveStatus, action.ready]
)), [
  ["list-waybills", "list", "planned-only", false],
  ["get-waybill", "detail", "planned-only", false],
]);
assert.match(createPacket.readModelLivePrerequisites.rule, /read models are live/);
assert.equal(createPacket.activationReview.status, "ready-to-register");
assert.equal(createPacket.activationReview.moduleId, "taxation-waybills");
assert.equal(createPacket.activationReview.workspaceId, "taxation");
assert.deepEqual(createPacket.activationReview.nextRegistryEntry, {
  resource: "taxation",
  databaseAction: "create-waybill",
});
assert.equal(createPacket.writeRegistrationCandidate.ready, true);
assert.equal(createPacket.writeRegistrationCandidate.moduleId, "taxation-waybills");
assert.equal(createPacket.writeRegistrationCandidate.workspaceId, "taxation");
assert.equal(createPacket.writeRegistrationCandidate.pipelineKind, "create");
assert.equal(createPacket.writeRegistrationCandidate.expectedFactoryKind, "create");
assert.equal(createPacket.writeRegistrationCandidate.requestedFactoryKind, "create");
assert.equal(
  createPacket.writeRegistrationCandidate.expectedImplementationPath,
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.deepEqual(createPacket.writeRegistrationCandidate.missingRuntimeRequirements, []);
assert.ok(createPacket.writeRegistrationCandidate.runtimeRequirements.includes("compact_write_response"));
assert.deepEqual(createPacket.writeRegistrationCandidate.issues, []);
assert.equal(createPacket.writeRegistrationCandidate.doesNotRegisterHandler, true);
assert.deepEqual(createPacket.writeRegistrationCandidate.registrationSummary, {
  resource: "taxation",
  databaseAction: "create-waybill",
  factoryKind: "create",
  implementationPath: "lib/server/database/handlers/taxation/create-waybill.ts",
});
assert.ok(createPacket.issues.some((issue) => (
  issue.source === "packet" && issue.code === "read_model_live_prerequisite_missing"
)));
assert.ok(createPacket.issues.some((issue) => (
  issue.source === "packet" && issue.code === "write_handler_not_registered"
)));
assert.ok(createPacket.nextCommands.some((command) => command.includes("review:write-handler")));
assert.ok(createPacket.nextCommands.some((command) => (
  command.includes("--implementation-path lib/server/database/handlers/taxation/create-waybill.ts")
)));
assert.ok(createPacket.nextCommands.some((command) => command.includes("--activation-scope-size 1")));
assert.ok(createPacket.nextCommands.includes("npm run verify"));
assert.ok(createPacket.nextCommands.includes("npm run smoke:local"));
assert.ok(createPacket.stopConditions.some((condition) => condition.includes("Do not register")));
assert.ok(createPacket.stopConditions.some((condition) => condition.includes("compact_write_response")));
assert.ok(createPacket.stopConditions.some((condition) => condition.includes("read-model live prerequisites")));

const placeholderReasonPacketRun = runPacket([
  "--resource", "taxation",
  "--action", "create-waybill",
  "--factory-kind", "create",
  "--reason", "TODO",
]);
assert.equal(placeholderReasonPacketRun.status, 1);
const placeholderReasonPacket = JSON.parse(placeholderReasonPacketRun.stdout) as typeof createPacket;
assert.ok(placeholderReasonPacket.issues.some((issue) => (
  issue.source === "packet" && issue.code === "change_reason_placeholder"
)));

const placeholderRollbackPacketRun = runPacket([
  "--resource", "taxation",
  "--action", "create-waybill",
  "--factory-kind", "create",
  "--rollback-plan", "n/a",
]);
assert.equal(placeholderRollbackPacketRun.status, 1);
const placeholderRollbackPacket = JSON.parse(placeholderRollbackPacketRun.stdout) as typeof createPacket;
assert.ok(placeholderRollbackPacket.issues.some((issue) => (
  issue.source === "packet" && issue.code === "rollback_plan_placeholder"
)));

const invalidScopePacketRun = runPacket([
  "--resource", "taxation",
  "--action", "create-waybill",
  "--factory-kind", "create",
  "--activation-scope-size", "abc",
]);
assert.equal(invalidScopePacketRun.status, 1);
const invalidScopePacket = JSON.parse(invalidScopePacketRun.stdout) as typeof createPacket;
assert.ok(invalidScopePacket.issues.some((issue) => (
  issue.source === "packet" && issue.code === "activation_scope_not_one"
)));

const wrongFactoryRun = runPacket([
  "--resource", "taxation",
  "--action", "create-waybill",
  "--factory-kind", "patch",
]);
assert.equal(wrongFactoryRun.status, 1);
const wrongFactoryPacket = JSON.parse(wrongFactoryRun.stdout) as typeof createPacket;
assert.equal(wrongFactoryPacket.writeRegistrationCandidate.ready, false);
assert.ok(wrongFactoryPacket.issues.some((issue) => (
  issue.source === "registration" && issue.code === "factory_kind_mismatch"
)));

const invalidImplementationPathRun = runPacket([
  "--resource", "taxation",
  "--action", "create-waybill",
  "--factory-kind", "create",
  "--implementation-path", "lib/server/database/module-live-handlers.ts",
]);
assert.equal(invalidImplementationPathRun.status, 1);
const invalidImplementationPathPacket = JSON.parse(invalidImplementationPathRun.stdout) as typeof createPacket;
assert.equal(invalidImplementationPathPacket.writeRegistrationCandidate.ready, false);
assert.equal(
  invalidImplementationPathPacket.writeRegistrationCandidate.expectedImplementationPath,
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.ok(invalidImplementationPathPacket.issues.some((issue) => (
  issue.source === "registration" && issue.code === "implementation_path_invalid"
)));
assert.equal(invalidImplementationPathPacket.writeRegistrationCandidate.registrationSummary, undefined);
assert.ok(invalidImplementationPathPacket.nextCommands.some((command) => (
  command.includes("--implementation-path lib/server/database/handlers/taxation/create-waybill.ts")
)));
assert.equal(
  invalidImplementationPathPacket.nextCommands.some((command) => (
    command.includes("--implementation-path lib/server/database/module-live-handlers.ts")
  )),
  false,
);

const mismatchedImplementationPathRun = runPacket([
  "--resource", "taxation",
  "--action", "create-waybill",
  "--factory-kind", "create",
  "--implementation-path", "lib/server/database/handlers/taxation/patch-waybill.ts",
]);
assert.equal(mismatchedImplementationPathRun.status, 1);
const mismatchedImplementationPathPacket = JSON.parse(mismatchedImplementationPathRun.stdout) as typeof createPacket;
assert.equal(mismatchedImplementationPathPacket.writeRegistrationCandidate.ready, false);
assert.equal(
  mismatchedImplementationPathPacket.writeRegistrationCandidate.expectedImplementationPath,
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.ok(mismatchedImplementationPathPacket.issues.some((issue) => (
  issue.source === "registration" && issue.code === "implementation_path_invalid"
)));
assert.equal(mismatchedImplementationPathPacket.writeRegistrationCandidate.registrationSummary, undefined);
assert.ok(mismatchedImplementationPathPacket.nextCommands.some((command) => (
  command.includes("--implementation-path lib/server/database/handlers/taxation/create-waybill.ts")
)));
assert.equal(
  mismatchedImplementationPathPacket.nextCommands.some((command) => (
    command.includes("--implementation-path lib/server/database/handlers/taxation/patch-waybill.ts")
  )),
  false,
);

const unsafeResourcePacketRun = runPacket([
  "--resource", "../taxation",
  "--action", "create-waybill",
  "--factory-kind", "create",
]);
assert.equal(unsafeResourcePacketRun.status, 1);
const unsafeResourcePacket = JSON.parse(unsafeResourcePacketRun.stdout) as typeof createPacket;
assert.equal(unsafeResourcePacket.writeRegistrationCandidate.ready, false);
assert.equal(
  unsafeResourcePacket.writeRegistrationCandidate.expectedImplementationPath,
  "lib/server/database/handlers/__invalid__/__invalid__.ts",
);
assert.ok(unsafeResourcePacket.issues.some((issue) => (
  issue.source === "packet" && issue.code === "handler_key_invalid"
)));
assert.ok(unsafeResourcePacket.stopConditions.some((condition) => (
  condition.includes("handler_key_invalid")
)));
assert.ok(unsafeResourcePacket.issues.some((issue) => (
  issue.source === "registration" && issue.code === "implementation_path_invalid"
)));
assert.equal(
  unsafeResourcePacket.nextCommands.some((command) => (
    command.includes("review:write-handler")
  )),
  false,
);
assert.equal(
  unsafeResourcePacket.nextCommands.some((command) => command.includes("--resource ../taxation")),
  false,
);

const unsafeActionPacketRun = runPacket([
  "--resource", "taxation",
  "--action", "../create-waybill",
  "--factory-kind", "create",
]);
assert.equal(unsafeActionPacketRun.status, 1);
const unsafeActionPacket = JSON.parse(unsafeActionPacketRun.stdout) as typeof createPacket;
assert.equal(unsafeActionPacket.writeRegistrationCandidate.ready, false);
assert.equal(
  unsafeActionPacket.writeRegistrationCandidate.expectedImplementationPath,
  "lib/server/database/handlers/__invalid__/__invalid__.ts",
);
assert.ok(unsafeActionPacket.issues.some((issue) => (
  issue.source === "packet" && issue.code === "handler_key_invalid"
)));
assert.equal(
  unsafeActionPacket.nextCommands.some((command) => command.includes("review:write-handler")),
  false,
);
assert.equal(
  unsafeActionPacket.nextCommands.some((command) => command.includes("--action ../create-waybill")),
  false,
);

const unknownPacketRun = runPacket([
  "--resource", "taxation",
  "--action", "not-a-real-action",
  "--factory-kind", "create",
]);
assert.equal(unknownPacketRun.status, 1);
const unknownPacket = JSON.parse(unknownPacketRun.stdout) as typeof createPacket;
assert.equal(unknownPacket.currentLiveStatus, "unknown");
assert.ok(unknownPacket.issues.some((issue) => issue.code === "unknown_handler"));
assert.ok(unknownPacket.issues.some((issue) => issue.code === "missing_implementation_plan"));

console.log("Write handler activation packet CLI checks passed");

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
