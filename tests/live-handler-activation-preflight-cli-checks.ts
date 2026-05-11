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
const scriptPath = resolve(root, "scripts/review-live-handler-activation.ts");
const scriptSource = readFileSync(scriptPath, "utf8");
const preflightSource = readFileSync(resolve(root, "lib/server/mysql/live-handler-activation-preflight.ts"), "utf8");

assert.equal(
  packageJson.scripts["review:live-handler"],
  "jiti scripts/review-live-handler-activation.ts",
);
assert.match(scriptSource, /reviewMysqlLiveHandlerActivationPreflight/);
assert.match(scriptSource, /reviewLiveHandlerActivationContractOnlyPreflight/);
assert.match(scriptSource, /verificationCommands: \["npm run verify"\]/);
assert.match(scriptSource, /--activation-scope-size/);
assert.match(scriptSource, /--contract-only/);
assert.match(scriptSource, /loadDotEnvLocal/);
assert.match(scriptSource, /closeMysqlPool/);
assert.match(scriptSource, /change_reason_placeholder/);
assert.match(scriptSource, /rollback_plan_placeholder/);
assert.match(scriptSource, /activation_scope_not_one/);
assert.match(scriptSource, /createCliTextIssues/);
assert.match(scriptSource, /parseActivationScopeSize/);
assert.match(scriptSource, /isPlaceholderText/);
assert.doesNotMatch(scriptSource, /--confirm/);

assert.match(preflightSource, /reviewModuleHandlerActivation/);
assert.match(preflightSource, /reviewLiveHandlerActivationContractOnlyPreflight/);
assert.match(preflightSource, /reviewMysqlReadModelSchemaReadinessForModule/);
assert.match(preflightSource, /reviewMysqlReadModelLiveHandlerRegistrationCandidate/);
assert.match(preflightSource, /registrationCandidate/);
assert.match(preflightSource, /registration_/);
assert.match(preflightSource, /mysql_schema_not_checked/);
assert.match(preflightSource, /liveActivationReady/);
assert.match(preflightSource, /appliesChanges: false/);
assert.match(preflightSource, /liveRegistryMutation: false/);
assert.match(preflightSource, /handlerRegistrationMutation: false/);
assert.match(preflightSource, /noLiveRegistrationFromPreflight: true/);
assert.match(preflightSource, /liveActivationGate/);
assert.match(preflightSource, /Register nothing from contract-only output/);
assert.match(preflightSource, /Add exactly one live registry key/);
assert.match(preflightSource, /Smoke the activated action and one planned-only action/);

const helpRun = runActivationReview(["--help"]);
assert.equal(helpRun.status, 0);
assert.match(helpRun.stdout, /Usage: npm run review:live-handler/);
assert.match(helpRun.stdout, /Runs the read-only activation preflight/);
assert.match(helpRun.stdout, /--contract-only/);

const missingFlagsRun = runActivationReview(["--resource", "taxation"]);
assert.equal(missingFlagsRun.status, 1);
assert.match(missingFlagsRun.stderr, /Missing required flags/);
assert.match(missingFlagsRun.stdout, /--implementation-path/);

const contractOnlyRun = runActivationReview([
  "--resource", "taxation",
  "--action", "list-waybills",
  "--requested-by", "cli-check",
  "--reason", "Review bounded taxation waybill list before MySQL schema is configured.",
  "--implementation-path", "lib/server/database/module-live-handlers.ts",
  "--rollback-plan", "Remove the live registry key and guarded registration.",
  "--contract-only",
]);
assert.equal(contractOnlyRun.status, 1);
const contractOnly = JSON.parse(contractOnlyRun.stdout) as {
  mode: string;
  ready: boolean;
  liveActivationReady: boolean;
  appliesChanges: boolean;
  schemaChecked: boolean;
  liveRegistryMutation: boolean;
  handlerRegistrationMutation: boolean;
  noLiveRegistrationFromPreflight: boolean;
  liveActivationGate: {
    ready: boolean;
    activationReady: boolean;
    schemaChecked: boolean;
    schemaReady: boolean;
    registrationCandidateReady: boolean;
    noLiveRegistrationFromPreflight: boolean;
  };
  activation: { status: string; moduleId?: string };
  registrationCandidate?: { ready: boolean; factoryKind: string };
  issues: Array<{ source: string; code: string }>;
  nextActions: string[];
};

assert.equal(contractOnly.mode, "contract-only");
assert.equal(contractOnly.ready, false);
assert.equal(contractOnly.liveActivationReady, false);
assert.equal(contractOnly.appliesChanges, false);
assert.equal(contractOnly.schemaChecked, false);
assert.equal(contractOnly.liveRegistryMutation, false);
assert.equal(contractOnly.handlerRegistrationMutation, false);
assert.equal(contractOnly.noLiveRegistrationFromPreflight, true);
assert.deepEqual(contractOnly.liveActivationGate, {
  ready: false,
  activationReady: true,
  schemaChecked: false,
  schemaReady: false,
  registrationCandidateReady: true,
  noLiveRegistrationFromPreflight: true,
});
assert.equal(contractOnly.activation.status, "ready-to-register");
assert.equal(contractOnly.activation.moduleId, "taxation-waybills");
assert.equal(contractOnly.registrationCandidate?.ready, true);
assert.equal(contractOnly.registrationCandidate?.factoryKind, "list");
assert.ok(contractOnly.issues.some((issue) => (
  issue.source === "schema" && issue.code === "mysql_schema_not_checked"
)));
assert.ok(contractOnly.nextActions.some((action) => action.includes("Register nothing from contract-only output")));

const placeholderReasonRun = runActivationReview([
  "--resource", "taxation",
  "--action", "list-waybills",
  "--requested-by", "cli-check",
  "--reason", "TODO",
  "--implementation-path", "lib/server/database/module-live-handlers.ts",
  "--rollback-plan", "Remove the live registry key and guarded registration.",
  "--contract-only",
]);
assert.equal(placeholderReasonRun.status, 1);
const placeholderReason = JSON.parse(placeholderReasonRun.stdout) as {
  mode: string;
  ready: boolean;
  noLiveRegistrationFromPreflight: boolean;
  issues: Array<{ source: string; code: string }>;
};
assert.equal(placeholderReason.mode, "cli-validation");
assert.equal(placeholderReason.ready, false);
assert.equal(placeholderReason.noLiveRegistrationFromPreflight, true);
assert.ok(placeholderReason.issues.some((issue) => (
  issue.source === "cli" && issue.code === "change_reason_placeholder"
)));

const placeholderRollbackRun = runActivationReview([
  "--resource", "taxation",
  "--action", "list-waybills",
  "--requested-by", "cli-check",
  "--reason", "Review bounded taxation waybill list before MySQL schema is configured.",
  "--implementation-path", "lib/server/database/module-live-handlers.ts",
  "--rollback-plan", "n/a",
  "--contract-only",
]);
assert.equal(placeholderRollbackRun.status, 1);
const placeholderRollback = JSON.parse(placeholderRollbackRun.stdout) as typeof placeholderReason;
assert.equal(placeholderRollback.mode, "cli-validation");
assert.ok(placeholderRollback.issues.some((issue) => (
  issue.source === "cli" && issue.code === "rollback_plan_placeholder"
)));

const invalidScopeRun = runActivationReview([
  "--resource", "taxation",
  "--action", "list-waybills",
  "--requested-by", "cli-check",
  "--reason", "Review bounded taxation waybill list before MySQL schema is configured.",
  "--implementation-path", "lib/server/database/module-live-handlers.ts",
  "--rollback-plan", "Remove the live registry key and guarded registration.",
  "--activation-scope-size", "abc",
  "--contract-only",
]);
assert.equal(invalidScopeRun.status, 1);
const invalidScope = JSON.parse(invalidScopeRun.stdout) as typeof placeholderReason;
assert.equal(invalidScope.mode, "cli-validation");
assert.ok(invalidScope.issues.some((issue) => (
  issue.source === "cli" && issue.code === "activation_scope_not_one"
)));

console.log("Live handler activation preflight CLI checks passed");

function runActivationReview(args: string[]) {
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
