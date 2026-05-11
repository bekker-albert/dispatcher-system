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
const scriptPath = resolve(root, "scripts/review-write-handler-registration.ts");
const scriptSource = readFileSync(scriptPath, "utf8");

assert.equal(
  packageJson.scripts["review:write-handler"],
  "jiti scripts/review-write-handler-registration.ts",
);
assert.match(packageJson.scripts["check:data-access"], /write-handler-registration-review-cli-checks/);

assert.match(scriptSource, /reviewWriteLiveHandlerRegistrationCandidate/);
assert.match(scriptSource, /isSafeWriteImplementationTarget/);
assert.match(scriptSource, /Extract<LiveModuleDatabaseHandlerFactoryKind, "create" \| "patch">/);
assert.match(scriptSource, /verificationCommands: \["npm run verify"\]/);
assert.match(scriptSource, /liveActivationReady/);
assert.match(scriptSource, /doesNotRegisterHandler/);
assert.match(scriptSource, /databaseConnection: false/);
assert.match(scriptSource, /change_reason_placeholder/);
assert.match(scriptSource, /rollback_plan_placeholder/);
assert.match(scriptSource, /handler_key_invalid/);
assert.match(scriptSource, /Stop if handler_key_invalid is present for resource\/action/);
assert.match(scriptSource, /Resource\/action keys must be lowercase path segments/);
assert.match(scriptSource, /Traversal, slashes, backslashes, uppercase letters, and empty segments are blocked with handler_key_invalid/);
assert.match(scriptSource, /activation_scope_not_one/);
assert.match(scriptSource, /createCliTextIssues/);
assert.match(scriptSource, /parseActivationScopeSize/);
assert.match(scriptSource, /isPlaceholderText/);
assert.doesNotMatch(scriptSource, /loadDotEnvLocal|closeMysqlPool|process\.env\.DB|dbRows|dbExecute/);
assert.doesNotMatch(scriptSource, /createLiveModuleDatabaseHandlersFromRegistrations/);
assert.doesNotMatch(scriptSource, /configuredLiveModuleHandlers\s*=/);

const helpRun = runWriteReview(["--help"]);
assert.equal(helpRun.status, 0);
assert.match(helpRun.stdout, /Usage: npm run review:write-handler/);
assert.match(helpRun.stdout, /passive registration review/);
assert.match(helpRun.stdout, /does not connect to MySQL/);
assert.match(helpRun.stdout, /does not edit the live registry/);
assert.match(helpRun.stdout, /does not register a handler/);
assert.match(helpRun.stdout, /Resource\/action keys must be lowercase path segments/);
assert.match(helpRun.stdout, /handler_key_invalid/);

const missingFlagsRun = runWriteReview(["--resource", "taxation"]);
assert.equal(missingFlagsRun.status, 1);
assert.match(missingFlagsRun.stderr, /Missing or invalid required flags/);
assert.match(missingFlagsRun.stdout, /--factory-kind/);
assert.match(missingFlagsRun.stdout, /--rollback-plan/);

const invalidFactoryKindRun = runWriteReview([
  "--resource", "taxation",
  "--action", "list-waybills",
  "--factory-kind", "list",
  "--requested-by", "cli-check",
  "--reason", "Read model factory kind must be blocked at CLI parsing.",
  "--implementation-path", "lib/server/database/handlers/taxation/list-waybills.ts",
  "--rollback-plan", "Remove the live registry key.",
]);
assert.equal(invalidFactoryKindRun.status, 1);
assert.match(invalidFactoryKindRun.stderr, /Missing or invalid required flags: --factory-kind/);
assert.match(invalidFactoryKindRun.stdout, /--factory-kind <create\|patch>/);

const createReviewRun = runWriteReview([
  "--resource", "taxation",
  "--action", "create-waybill",
  "--factory-kind", "create",
  "--requested-by", "cli-check",
  "--reason", "Review one bounded create handler candidate.",
  "--implementation-path", "lib/server/database/handlers/taxation/create-waybill.ts",
  "--rollback-plan", "Remove the live registry key and return create-waybill to planned-only 501.",
]);
assert.equal(createReviewRun.status, 0);
const createPacket = JSON.parse(createReviewRun.stdout) as {
  mode: string;
  ready: boolean;
  liveActivationReady: boolean;
  appliesChanges: boolean;
  liveRegistryMutation: boolean;
  databaseConnection: boolean;
  doesNotRegisterHandler: boolean;
  issues: Array<{ source: string; code: string }>;
  review: {
    ready: boolean;
    moduleId?: string;
    workspaceId?: string;
    pipelineKind?: string;
    expectedFactoryKind?: string;
    requestedFactoryKind: string;
    expectedImplementationPath: string;
    missingRuntimeRequirements: string[];
    runtimeRequirements: string[];
    readModelLivePrerequisites: {
      ready: boolean;
      requiredActions: Array<{
        databaseAction: string;
        contractKind: string;
        liveStatus: string;
        ready: boolean;
      }>;
    };
    liveActivationReady: boolean;
    liveActivationIssues: string[];
    issues: string[];
    registrationSummary?: {
      resource: string;
      databaseAction: string;
      factoryKind: string;
      implementationPath: string;
    };
  };
  nextCommands: string[];
  stopConditions: string[];
};
assert.equal(createPacket.mode, "write-handler-registration-review");
assert.equal(createPacket.ready, true);
assert.equal(createPacket.liveActivationReady, false);
assert.equal(createPacket.appliesChanges, false);
assert.equal(createPacket.liveRegistryMutation, false);
assert.equal(createPacket.databaseConnection, false);
assert.equal(createPacket.doesNotRegisterHandler, true);
assert.deepEqual(createPacket.issues, []);
assert.equal(createPacket.review.ready, true);
assert.equal(createPacket.review.moduleId, "taxation-waybills");
assert.equal(createPacket.review.workspaceId, "taxation");
assert.equal(createPacket.review.pipelineKind, "create");
assert.equal(createPacket.review.expectedFactoryKind, "create");
assert.equal(createPacket.review.requestedFactoryKind, "create");
assert.equal(createPacket.review.expectedImplementationPath, "lib/server/database/handlers/taxation/create-waybill.ts");
assert.equal(createPacket.review.liveActivationReady, false);
assert.deepEqual(createPacket.review.liveActivationIssues, ["read_model_live_prerequisite_missing"]);
assert.equal(createPacket.review.readModelLivePrerequisites.ready, false);
assert.deepEqual(createPacket.review.readModelLivePrerequisites.requiredActions.map((action) => (
  [action.databaseAction, action.contractKind, action.liveStatus, action.ready]
)), [
  ["list-waybills", "list", "planned-only", false],
  ["get-waybill", "detail", "planned-only", false],
]);
assert.deepEqual(createPacket.review.missingRuntimeRequirements, []);
assert.ok(createPacket.review.runtimeRequirements.includes("compact_write_response"));
assert.deepEqual(createPacket.review.issues, []);
assert.deepEqual(createPacket.review.registrationSummary, {
  resource: "taxation",
  databaseAction: "create-waybill",
  factoryKind: "create",
  implementationPath: "lib/server/database/handlers/taxation/create-waybill.ts",
});
assert.ok(createPacket.nextCommands.includes("npm run verify"));
assert.ok(createPacket.stopConditions.some((condition) => condition.includes("Do not register")));
assert.ok(createPacket.stopConditions.some((condition) => condition.includes("read-model live prerequisites")));

const placeholderReasonRun = runWriteReview([
  "--resource", "taxation",
  "--action", "create-waybill",
  "--factory-kind", "create",
  "--requested-by", "cli-check",
  "--reason", "TODO",
  "--implementation-path", "lib/server/database/handlers/taxation/create-waybill.ts",
  "--rollback-plan", "Remove the live registry key and return create-waybill to planned-only 501.",
]);
assert.equal(placeholderReasonRun.status, 1);
const placeholderReasonPacket = JSON.parse(placeholderReasonRun.stdout) as typeof createPacket;
assert.equal(placeholderReasonPacket.ready, false);
assert.equal(placeholderReasonPacket.review.ready, true);
assert.ok(placeholderReasonPacket.issues.some((issue) => (
  issue.source === "cli" && issue.code === "change_reason_placeholder"
)));

const placeholderRollbackRun = runWriteReview([
  "--resource", "taxation",
  "--action", "create-waybill",
  "--factory-kind", "create",
  "--requested-by", "cli-check",
  "--reason", "Review one bounded create handler candidate.",
  "--implementation-path", "lib/server/database/handlers/taxation/create-waybill.ts",
  "--rollback-plan", "n/a",
]);
assert.equal(placeholderRollbackRun.status, 1);
const placeholderRollbackPacket = JSON.parse(placeholderRollbackRun.stdout) as typeof createPacket;
assert.equal(placeholderRollbackPacket.ready, false);
assert.ok(placeholderRollbackPacket.issues.some((issue) => (
  issue.source === "cli" && issue.code === "rollback_plan_placeholder"
)));

const invalidScopeRun = runWriteReview([
  "--resource", "taxation",
  "--action", "create-waybill",
  "--factory-kind", "create",
  "--requested-by", "cli-check",
  "--reason", "Review one bounded create handler candidate.",
  "--implementation-path", "lib/server/database/handlers/taxation/create-waybill.ts",
  "--rollback-plan", "Remove the live registry key and return create-waybill to planned-only 501.",
  "--activation-scope-size", "abc",
]);
assert.equal(invalidScopeRun.status, 1);
const invalidScopePacket = JSON.parse(invalidScopeRun.stdout) as typeof createPacket;
assert.equal(invalidScopePacket.ready, false);
assert.ok(invalidScopePacket.issues.some((issue) => (
  issue.source === "cli" && issue.code === "activation_scope_not_one"
)));

const wrongFactoryRun = runWriteReview([
  "--resource", "taxation",
  "--action", "create-waybill",
  "--factory-kind", "patch",
  "--requested-by", "cli-check",
  "--reason", "Wrong factory must fail.",
  "--implementation-path", "lib/server/database/handlers/taxation/create-waybill.ts",
  "--rollback-plan", "Remove the live registry key.",
]);
assert.equal(wrongFactoryRun.status, 1);
const wrongFactoryPacket = JSON.parse(wrongFactoryRun.stdout) as typeof createPacket;
assert.equal(wrongFactoryPacket.ready, false);
assert.ok(wrongFactoryPacket.review.issues.includes("factory_kind_mismatch"));
assert.equal(wrongFactoryPacket.review.registrationSummary, undefined);

const invalidImplementationPathRun = runWriteReview([
  "--resource", "taxation",
  "--action", "create-waybill",
  "--factory-kind", "create",
  "--requested-by", "cli-check",
  "--reason", "Wrong implementation path must fail.",
  "--implementation-path", "lib/server/database/module-live-handlers.ts",
  "--rollback-plan", "Remove the live registry key.",
]);
assert.equal(invalidImplementationPathRun.status, 1);
const invalidImplementationPathPacket = JSON.parse(invalidImplementationPathRun.stdout) as typeof createPacket;
assert.equal(invalidImplementationPathPacket.ready, false);
assert.equal(invalidImplementationPathPacket.review.ready, false);
assert.equal(
  invalidImplementationPathPacket.review.expectedImplementationPath,
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.ok(invalidImplementationPathPacket.review.issues.includes("implementation_path_invalid"));
assert.equal(invalidImplementationPathPacket.review.registrationSummary, undefined);

const mismatchedImplementationPathRun = runWriteReview([
  "--resource", "taxation",
  "--action", "create-waybill",
  "--factory-kind", "create",
  "--requested-by", "cli-check",
  "--reason", "Mismatched implementation path must fail.",
  "--implementation-path", "lib/server/database/handlers/taxation/patch-waybill.ts",
  "--rollback-plan", "Remove the live registry key.",
]);
assert.equal(mismatchedImplementationPathRun.status, 1);
const mismatchedImplementationPathPacket = JSON.parse(mismatchedImplementationPathRun.stdout) as typeof createPacket;
assert.equal(mismatchedImplementationPathPacket.ready, false);
assert.equal(mismatchedImplementationPathPacket.review.ready, false);
assert.equal(
  mismatchedImplementationPathPacket.review.expectedImplementationPath,
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.ok(mismatchedImplementationPathPacket.review.issues.includes("implementation_path_invalid"));
assert.equal(mismatchedImplementationPathPacket.review.registrationSummary, undefined);

const readModelRun = runWriteReview([
  "--resource", "taxation",
  "--action", "list-waybills",
  "--factory-kind", "patch",
  "--requested-by", "cli-check",
  "--reason", "Read model must not pass write review.",
  "--implementation-path", "lib/server/database/handlers/taxation/list-waybills.ts",
  "--rollback-plan", "Remove the live registry key.",
]);
assert.equal(readModelRun.status, 1);
const readModelPacket = JSON.parse(readModelRun.stdout) as typeof createPacket;
assert.equal(readModelPacket.ready, false);
assert.ok(readModelPacket.review.issues.includes("unsupported_contract_kind"));
assert.ok(readModelPacket.review.issues.includes("missing_write_pipeline"));

const unsafeResourceRun = runWriteReview([
  "--resource", "../taxation",
  "--action", "create-waybill",
  "--factory-kind", "create",
  "--requested-by", "cli-check",
  "--reason", "Unsafe resource segment must fail.",
  "--implementation-path", "lib/server/database/handlers/__invalid__/__invalid__.ts",
  "--rollback-plan", "Remove the live registry key.",
]);
assert.equal(unsafeResourceRun.status, 1);
const unsafeResourcePacket = JSON.parse(unsafeResourceRun.stdout) as typeof createPacket;
assert.equal(unsafeResourcePacket.ready, false);
assert.ok(unsafeResourcePacket.issues.some((issue) => (
  issue.source === "cli" && issue.code === "handler_key_invalid"
)));
assert.ok(unsafeResourcePacket.stopConditions.some((condition) => (
  condition.includes("handler_key_invalid")
)));
assert.equal(
  unsafeResourcePacket.review.expectedImplementationPath,
  "lib/server/database/handlers/__invalid__/__invalid__.ts",
);
assert.ok(unsafeResourcePacket.review.issues.includes("implementation_path_invalid"));

const unsafeActionRun = runWriteReview([
  "--resource", "taxation",
  "--action", "../create-waybill",
  "--factory-kind", "create",
  "--requested-by", "cli-check",
  "--reason", "Unsafe action segment must fail.",
  "--implementation-path", "lib/server/database/handlers/__invalid__/__invalid__.ts",
  "--rollback-plan", "Remove the live registry key.",
]);
assert.equal(unsafeActionRun.status, 1);
const unsafeActionPacket = JSON.parse(unsafeActionRun.stdout) as typeof createPacket;
assert.equal(unsafeActionPacket.ready, false);
assert.ok(unsafeActionPacket.issues.some((issue) => (
  issue.source === "cli" && issue.code === "handler_key_invalid"
)));
assert.equal(
  unsafeActionPacket.review.expectedImplementationPath,
  "lib/server/database/handlers/__invalid__/__invalid__.ts",
);
assert.ok(unsafeActionPacket.review.issues.includes("implementation_path_invalid"));

console.log("Write handler registration review CLI checks passed");

function runWriteReview(args: string[]) {
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
