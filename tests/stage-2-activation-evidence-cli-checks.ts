import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createStage2ActivationAuditPlan } from "../lib/domain/workspaces/stage2ActivationAuditPlan";
import {
  validateStage2ActivationEvidence,
} from "../lib/domain/workspaces/stage2ActivationEvidenceValidation";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const jitiCliPath = resolve(root, "node_modules/jiti/lib/jiti-cli.mjs");
const scriptPath = resolve(root, "scripts/check-stage-2-activation-evidence.ts");
const scriptSource = readFileSync(scriptPath, "utf8");

assert.equal(
  packageJson.scripts["check:stage2-activation-evidence"],
  "jiti scripts/check-stage-2-activation-evidence.ts",
);
assert.match(packageJson.scripts["check:dispatch-architecture"], /stage-2-activation-evidence-cli-checks/);

assert.match(scriptSource, /validateStage2ActivationEvidence/);
assert.match(scriptSource, /--implementation-path <path>/);
assert.match(scriptSource, /--preflight-result <missing\|failed\|passed>/);
assert.match(scriptSource, /--verification-command <command>/);
assert.match(scriptSource, /--rollback-plan <text>/);
assert.match(scriptSource, /does not query MySQL/);
assert.match(scriptSource, /does not register live handlers/);
assert.match(scriptSource, /does not mutate the live registry/);
assert.match(scriptSource, /expectedImplementationPath/);
assert.doesNotMatch(scriptSource, /process\.env\.DB|dbRows|dbExecute|createLiveModuleDatabaseHandlersFromRegistrations/);

const helpRun = runEvidenceCheck(["--help"]);
assert.equal(helpRun.status, 0);
assert.match(helpRun.stdout, /Usage: npm run check:stage2-activation-evidence/);
assert.match(helpRun.stdout, /does not query MySQL/);
assert.match(helpRun.stdout, /expectedImplementationPath/);

const incompleteRun = runEvidenceCheck([
  "--requested-by",
  "stage-2-evidence-cli",
  "--reason",
  "Connect next action with evidence.",
]);
assert.equal(incompleteRun.status, 1);
const incompletePayload = JSON.parse(incompleteRun.stdout) as {
  validation: ReturnType<typeof validateStage2ActivationEvidence>;
};
assert.equal(incompletePayload.validation.evidenceComplete, false);
assert.equal(
  incompletePayload.validation.expectedImplementationPath,
  "lib/server/database/module-live-handlers.ts",
);
assert.ok(incompletePayload.validation.blockers.some((blocker) => (
  blocker.code === "missing_required_field"
)));

const completeCliAuditPlan = createStage2ActivationAuditPlan(
  "stage-2-evidence-cli",
  "Connect next action with evidence.",
);
const missingRollbackRun = runEvidenceCheck([
  "--requested-by",
  "stage-2-evidence-cli",
  "--reason",
  "Connect next action with evidence.",
  "--implementation-path",
  "lib/server/database/module-live-handlers.ts",
  ...verificationCommandArgs(completeCliAuditPlan.requiredCommands),
  "--activation-scope-size",
  "1",
  "--preflight-result",
  "passed",
  "--verify-result",
  "passed",
  "--smoke-result",
  "passed",
]);
assert.equal(missingRollbackRun.status, 1);
const missingRollbackPayload = JSON.parse(missingRollbackRun.stdout) as {
  validation: ReturnType<typeof validateStage2ActivationEvidence>;
};
assert.equal(missingRollbackPayload.validation.evidenceComplete, false);
assert.ok(missingRollbackPayload.validation.missingFields.includes("rollbackPlan"));

const placeholderRollbackRun = runEvidenceCheck([
  "--requested-by",
  "stage-2-evidence-cli",
  "--reason",
  "Connect next action with evidence.",
  "--implementation-path",
  "lib/server/database/module-live-handlers.ts",
  ...verificationCommandArgs(completeCliAuditPlan.requiredCommands),
  "--rollback-plan",
  "n/a",
  "--activation-scope-size",
  "1",
  "--preflight-result",
  "passed",
  "--verify-result",
  "passed",
  "--smoke-result",
  "passed",
]);
assert.equal(placeholderRollbackRun.status, 1);
const placeholderRollbackPayload = JSON.parse(placeholderRollbackRun.stdout) as {
  validation: ReturnType<typeof validateStage2ActivationEvidence>;
};
assert.ok(placeholderRollbackPayload.validation.blockers.some((blocker) => (
  blocker.code === "rollback_plan_placeholder"
)));

const invalidImplementationPathRun = runEvidenceCheck([
  "--requested-by",
  "stage-2-evidence-cli",
  "--reason",
  "Connect next action with evidence.",
  "--implementation-path",
  "README.md",
  ...verificationCommandArgs(completeCliAuditPlan.requiredCommands),
  "--rollback-plan",
  "Remove the single live registry key and guarded server registration",
  "--activation-scope-size",
  "1",
  "--preflight-result",
  "passed",
  "--verify-result",
  "passed",
  "--smoke-result",
  "passed",
]);
assert.equal(invalidImplementationPathRun.status, 1);
const invalidImplementationPathPayload = JSON.parse(invalidImplementationPathRun.stdout) as {
  validation: ReturnType<typeof validateStage2ActivationEvidence>;
};
assert.ok(invalidImplementationPathPayload.validation.blockers.some((blocker) => (
  blocker.code === "implementation_path_invalid"
)));

const writeHandlerCliAuditPlan = createStage2ActivationAuditPlan(
  "stage-2-evidence-cli",
  "Connect first write handler with evidence.",
  [
    { resource: "taxation", databaseAction: "list-waybills" },
    { resource: "taxation", databaseAction: "get-waybill" },
    { resource: "dispatch", databaseAction: "list-shift-reports" },
    { resource: "dispatch", databaseAction: "get-shift-report" },
  ],
);
const mismatchedWriteHandlerPathRun = runEvidenceCheck([
  "--requested-by",
  "stage-2-evidence-cli",
  "--reason",
  "Connect first write handler with evidence.",
  "--live-handler",
  "taxation/list-waybills",
  "--live-handler",
  "taxation/get-waybill",
  "--live-handler",
  "dispatch/list-shift-reports",
  "--live-handler",
  "dispatch/get-shift-report",
  "--implementation-path",
  "lib/server/database/handlers/taxation/patch-waybill.ts",
  ...verificationCommandArgs(writeHandlerCliAuditPlan.requiredCommands),
  "--rollback-plan",
  "Remove the single live registry key and guarded server registration",
  "--activation-scope-size",
  "1",
  "--preflight-result",
  "passed",
  "--verify-result",
  "passed",
  "--smoke-result",
  "passed",
]);
assert.equal(mismatchedWriteHandlerPathRun.status, 1);
const mismatchedWriteHandlerPathPayload = JSON.parse(mismatchedWriteHandlerPathRun.stdout) as {
  validation: ReturnType<typeof validateStage2ActivationEvidence>;
};
assert.equal(
  mismatchedWriteHandlerPathPayload.validation.expectedImplementationPath,
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.ok(mismatchedWriteHandlerPathPayload.validation.blockers.some((blocker) => (
  blocker.code === "implementation_path_phase_mismatch"
  && blocker.expected === "lib/server/database/handlers/taxation/create-waybill.ts"
  && blocker.actual === "lib/server/database/handlers/taxation/patch-waybill.ts"
)));

const completeWriteHandlerRun = runEvidenceCheck([
  "--requested-by",
  "stage-2-evidence-cli",
  "--reason",
  "Connect first write handler with evidence.",
  "--live-handler",
  "taxation/list-waybills",
  "--live-handler",
  "taxation/get-waybill",
  "--live-handler",
  "dispatch/list-shift-reports",
  "--live-handler",
  "dispatch/get-shift-report",
  "--implementation-path",
  "lib/server/database/handlers/taxation/create-waybill.ts",
  ...verificationCommandArgs(writeHandlerCliAuditPlan.requiredCommands),
  "--rollback-plan",
  "Remove the single live registry key and guarded server registration",
  "--activation-scope-size",
  "1",
  "--preflight-result",
  "passed",
  "--verify-result",
  "passed",
  "--smoke-result",
  "passed",
]);
assert.equal(completeWriteHandlerRun.status, 0);
const completeWriteHandlerPayload = JSON.parse(completeWriteHandlerRun.stdout) as {
  validation: ReturnType<typeof validateStage2ActivationEvidence>;
};
assert.equal(completeWriteHandlerPayload.validation.evidenceComplete, true);
assert.equal(
  completeWriteHandlerPayload.validation.expectedImplementationPath,
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.equal(completeWriteHandlerPayload.validation.liveRegistrationAllowedFromEvidence, false);

const forbiddenVerificationCommandRun = runEvidenceCheck([
  "--requested-by",
  "stage-2-evidence-cli",
  "--reason",
  "Connect next action with evidence.",
  "--implementation-path",
  "lib/server/database/module-live-handlers.ts",
  ...verificationCommandArgs(completeCliAuditPlan.requiredCommands),
  "--verification-command",
  "next dev",
  "--rollback-plan",
  "Remove the single live registry key and guarded server registration",
  "--activation-scope-size",
  "1",
  "--preflight-result",
  "passed",
  "--verify-result",
  "passed",
  "--smoke-result",
  "passed",
]);
assert.equal(forbiddenVerificationCommandRun.status, 1);
const forbiddenVerificationCommandPayload = JSON.parse(forbiddenVerificationCommandRun.stdout) as {
  validation: ReturnType<typeof validateStage2ActivationEvidence>;
};
assert.ok(forbiddenVerificationCommandPayload.validation.blockers.some((blocker) => (
  blocker.code === "verification_command_forbidden"
)));

const placeholderReasonAuditPlan = createStage2ActivationAuditPlan(
  "stage-2-evidence-cli",
  "TODO",
);
const placeholderReasonRun = runEvidenceCheck([
  "--requested-by",
  "stage-2-evidence-cli",
  "--reason",
  "TODO",
  "--implementation-path",
  "lib/server/database/module-live-handlers.ts",
  ...verificationCommandArgs(placeholderReasonAuditPlan.requiredCommands),
  "--rollback-plan",
  "Remove the single live registry key and guarded server registration",
  "--activation-scope-size",
  "1",
  "--preflight-result",
  "passed",
  "--verify-result",
  "passed",
  "--smoke-result",
  "passed",
]);
assert.equal(placeholderReasonRun.status, 1);
const placeholderReasonPayload = JSON.parse(placeholderReasonRun.stdout) as {
  validation: ReturnType<typeof validateStage2ActivationEvidence>;
};
assert.ok(placeholderReasonPayload.validation.blockers.some((blocker) => (
  blocker.code === "change_reason_placeholder"
)));

const completeRun = runEvidenceCheck([
  "--requested-by",
  "stage-2-evidence-cli",
  "--reason",
  "Connect next action with evidence.",
  "--implementation-path",
  "lib/server/database/module-live-handlers.ts",
  ...verificationCommandArgs(completeCliAuditPlan.requiredCommands),
  "--rollback-plan",
  "Remove the single live registry key and guarded server registration",
  "--activation-scope-size",
  "1",
  "--preflight-result",
  "passed",
  "--verify-result",
  "passed",
  "--smoke-result",
  "passed",
]);
assert.equal(completeRun.status, 0);
const completePayload = JSON.parse(completeRun.stdout) as {
  validation: ReturnType<typeof validateStage2ActivationEvidence>;
};
assert.equal(completePayload.validation.evidenceComplete, true);
assert.equal(completePayload.validation.manualRegistryChangeReviewAllowed, true);
assert.equal(completePayload.validation.expectedImplementationPath, "lib/server/database/module-live-handlers.ts");
assert.equal(completePayload.validation.liveRegistrationAllowedFromEvidence, false);

const invalidRun = runEvidenceCheck(["--preflight-result", "ok"]);
assert.equal(invalidRun.status, 1);
assert.match(invalidRun.stderr, /Invalid --preflight-result value/);

console.log("Stage 2 activation evidence CLI checks passed");

function runEvidenceCheck(args: string[]) {
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

function verificationCommandArgs(commands: readonly string[]) {
  return commands.flatMap((command) => ["--verification-command", command]);
}
