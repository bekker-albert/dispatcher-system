import assert from "node:assert/strict";
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
const scriptPath = resolve(root, "scripts/check-stage-2-activation-evidence.ts");
const validatorSource = readFileSync(resolve(root, "lib/domain/workspaces/stage2ActivationEvidenceValidation.ts"), "utf8");
const implementationPathsSource = readFileSync(resolve(root, "lib/domain/workspaces/stage2ImplementationPaths.ts"), "utf8");
const scriptSource = readFileSync(scriptPath, "utf8");
const runbook = readFileSync(resolve(root, "docs/LIVE_HANDLER_ACTIVATION_RUNBOOK.md"), "utf8");

assert.equal(
  packageJson.scripts["check:stage2-activation-evidence"],
  "jiti scripts/check-stage-2-activation-evidence.ts",
);
assert.match(packageJson.scripts["check:dispatch-architecture"], /stage-2-activation-evidence-checks/);

assert.match(validatorSource, /validateStage2ActivationEvidence/);
assert.match(validatorSource, /manualRegistryChangeReviewAllowed/);
assert.match(validatorSource, /liveRegistrationAllowedFromEvidence: false/);
assert.match(validatorSource, /noMysqlConnection: true/);
assert.match(validatorSource, /liveRegistryMutation: false/);
assert.match(validatorSource, /handlerRegistrationMutation: false/);
assert.match(validatorSource, /expectedImplementationPath/);
assert.match(validatorSource, /resolveExpectedImplementationPath/);
assert.match(validatorSource, /target\.implementationPath/);
assert.match(validatorSource, /preflight_not_passed/);
assert.match(validatorSource, /verify_not_passed/);
assert.match(validatorSource, /smoke_not_passed/);
assert.match(validatorSource, /verification_command_forbidden/);
assert.match(validatorSource, /forbiddenVerificationCommandPatterns/);
assert.match(validatorSource, /required_command_missing/);
assert.match(validatorSource, /auditPlan\.requiredCommands/);
assert.match(validatorSource, /normalizeVerificationCommand/);
assert.match(validatorSource, /change_reason_placeholder/);
assert.match(validatorSource, /rollback_plan_placeholder/);
assert.match(validatorSource, /implementation_path_invalid/);
assert.match(validatorSource, /implementation_path_phase_mismatch/);
assert.match(validatorSource, /stage2ReadModelImplementationPath/);
assert.match(validatorSource, /stage2AllowedImplementationPathDescription/);
assert.match(validatorSource, /isAllowedStage2ImplementationPath/);
assert.match(implementationPathsSource, /lib\/server\/database\/module-live-handlers\.ts/);
assert.match(implementationPathsSource, /lib\/server\/database\/handlers\//);
assert.match(validatorSource, /createExpectedWriteHandlerImplementationPath/);
assert.match(implementationPathsSource, /lib\/server\/database\/handlers\/\$\{resource\.trim\(\)\}\/\$\{databaseAction\.trim\(\)\}\.ts/);
assert.match(implementationPathsSource, /endsWith\("\.ts"\)/);
assert.match(implementationPathsSource, /hasStage2PathTraversal/);
assert.match(validatorSource, /target_mismatch/);
assert.match(validatorSource, /if \(field === "rollbackPlan"\) return evidence\.rollbackPlan/);
assert.match(validatorSource, /npm run verify/);
assert.match(validatorSource, /npm run smoke:local/);
assert.doesNotMatch(validatorSource, /process\.env\.DB|dbRows|dbExecute|createLiveModuleDatabaseHandlersFromRegistrations/);

assert.match(scriptSource, /validateStage2ActivationEvidence/);
assert.match(scriptSource, /--implementation-path <path>/);
assert.match(scriptSource, /--preflight-result <missing\|failed\|passed>/);
assert.match(scriptSource, /--verification-command <command>/);
assert.match(scriptSource, /--rollback-plan <text>/);
assert.match(scriptSource, /does not query MySQL/);
assert.match(scriptSource, /does not register live handlers/);
assert.match(scriptSource, /does not mutate the live registry/);
assert.doesNotMatch(scriptSource, /process\.env\.DB|dbRows|dbExecute|createLiveModuleDatabaseHandlersFromRegistrations/);

assert.match(runbook, /npm run check:stage2-activation-evidence/);
assert.match(runbook, /validateStage2ActivationEvidence/);
assert.match(runbook, /evidenceComplete/);
assert.match(runbook, /manualRegistryChangeReviewAllowed/);
assert.match(runbook, /liveRegistrationAllowedFromEvidence = false/);
assert.match(packageJson.scripts["check:dispatch-architecture"], /stage-2-activation-evidence-cli-checks/);

const auditPlan = createStage2ActivationAuditPlan(
  "stage-2-evidence-check",
  "Connect next read-model handler with evidence.",
);
const missingEvidence = validateStage2ActivationEvidence(auditPlan, {});
assert.equal(missingEvidence.evidenceComplete, false);
assert.equal(missingEvidence.manualRegistryChangeReviewAllowed, false);
assert.equal(missingEvidence.liveRegistrationAllowedFromEvidence, false);
assert.equal(missingEvidence.noMysqlConnection, true);
assert.equal(missingEvidence.liveRegistryMutation, false);
assert.equal(missingEvidence.handlerRegistrationMutation, false);
assert.equal(missingEvidence.expectedImplementationPath, "lib/server/database/module-live-handlers.ts");
assert.ok(missingEvidence.missingFields.includes("implementationPath"));
assert.ok(missingEvidence.missingFields.includes("verificationCommands"));
assert.ok(missingEvidence.missingFields.includes("rollbackPlan"));
assert.ok(missingEvidence.missingFields.includes("preflightResult"));
assert.ok(missingEvidence.missingFields.includes("verifyResult"));
assert.ok(missingEvidence.missingFields.includes("smokeResult"));
assert.ok(missingEvidence.blockers.some((blocker) => blocker.code === "preflight_not_passed"));
assert.ok(missingEvidence.blockers.some((blocker) => blocker.code === "verify_not_passed"));
assert.ok(missingEvidence.blockers.some((blocker) => blocker.code === "smoke_not_passed"));
assert.ok(missingEvidence.blockers.some((blocker) => blocker.code === "required_command_missing"));

const failedEvidence = validateStage2ActivationEvidence(auditPlan, {
  implementationPath: "lib/server/database/module-live-handlers.ts",
  verificationCommands: ["npm run verify", "npm run smoke:local"],
  rollbackPlan: "Remove the single live registry key and guarded server registration",
  activationScopeSize: 2,
  preflightResult: "passed",
  verifyResult: "failed",
  smokeResult: "passed",
});
assert.equal(failedEvidence.evidenceComplete, false);
assert.ok(failedEvidence.blockers.some((blocker) => blocker.code === "activation_scope_not_one"));
assert.ok(failedEvidence.blockers.some((blocker) => blocker.code === "verify_not_passed"));

const targetMismatchEvidence = validateStage2ActivationEvidence(auditPlan, {
  databaseAction: "get-waybill",
  implementationPath: "lib/server/database/module-live-handlers.ts",
  verificationCommands: ["npm run verify", "npm run smoke:local"],
  rollbackPlan: "Remove the single live registry key and guarded server registration",
  activationScopeSize: 1,
  preflightResult: "passed",
  verifyResult: "passed",
  smokeResult: "passed",
});
assert.equal(targetMismatchEvidence.evidenceComplete, false);
assert.ok(targetMismatchEvidence.blockers.some((blocker) => blocker.code === "target_mismatch"));

const completeEvidence = validateStage2ActivationEvidence(auditPlan, {
  implementationPath: "lib/server/database/module-live-handlers.ts",
  verificationCommands: auditPlan.requiredCommands,
  rollbackPlan: "Remove the single live registry key and guarded server registration",
  activationScopeSize: 1,
  preflightResult: "passed",
  verifyResult: "passed",
  smokeResult: "passed",
});
assert.equal(completeEvidence.evidenceComplete, true);
assert.equal(completeEvidence.manualRegistryChangeReviewAllowed, true);
assert.equal(completeEvidence.liveRegistrationAllowedFromEvidence, false);
assert.equal(completeEvidence.expectedImplementationPath, "lib/server/database/module-live-handlers.ts");
assert.deepEqual(completeEvidence.missingFields, []);
assert.deepEqual(completeEvidence.blockers, []);
assert.match(completeEvidence.rule, /never mutates/);

const normalizedCommandEvidence = validateStage2ActivationEvidence(auditPlan, {
  implementationPath: "lib/server/database/module-live-handlers.ts",
  verificationCommands: auditPlan.requiredCommands.map((command) => (
    `  ${command.replaceAll(" ", "   ")}  `
  )),
  rollbackPlan: "Remove the single live registry key and guarded server registration",
  activationScopeSize: 1,
  preflightResult: "passed",
  verifyResult: "passed",
  smokeResult: "passed",
});
assert.equal(normalizedCommandEvidence.evidenceComplete, true);
assert.deepEqual(normalizedCommandEvidence.blockers, []);

const forbiddenVerificationCommandEvidence = validateStage2ActivationEvidence(auditPlan, {
  implementationPath: "lib/server/database/module-live-handlers.ts",
  verificationCommands: [
    ...auditPlan.requiredCommands,
    "npm run migrate:supabase-to-mysql",
  ],
  rollbackPlan: "Remove the single live registry key and guarded server registration",
  activationScopeSize: 1,
  preflightResult: "passed",
  verifyResult: "passed",
  smokeResult: "passed",
});
assert.equal(forbiddenVerificationCommandEvidence.evidenceComplete, false);
assert.ok(forbiddenVerificationCommandEvidence.blockers.some((blocker) => (
  blocker.code === "verification_command_forbidden"
)));

const placeholderRollbackEvidence = validateStage2ActivationEvidence(auditPlan, {
  implementationPath: "lib/server/database/module-live-handlers.ts",
  verificationCommands: auditPlan.requiredCommands,
  rollbackPlan: "TODO",
  activationScopeSize: 1,
  preflightResult: "passed",
  verifyResult: "passed",
  smokeResult: "passed",
});
assert.equal(placeholderRollbackEvidence.evidenceComplete, false);
assert.ok(placeholderRollbackEvidence.blockers.some((blocker) => (
  blocker.code === "rollback_plan_placeholder"
)));

const placeholderChangeReasonAuditPlan = createStage2ActivationAuditPlan(
  "stage-2-evidence-check",
  "TODO",
);
const placeholderChangeReasonEvidence = validateStage2ActivationEvidence(placeholderChangeReasonAuditPlan, {
  implementationPath: "lib/server/database/module-live-handlers.ts",
  verificationCommands: placeholderChangeReasonAuditPlan.requiredCommands,
  rollbackPlan: "Remove the single live registry key and guarded server registration",
  activationScopeSize: 1,
  preflightResult: "passed",
  verifyResult: "passed",
  smokeResult: "passed",
});
assert.equal(placeholderChangeReasonEvidence.evidenceComplete, false);
assert.ok(placeholderChangeReasonEvidence.blockers.some((blocker) => (
  blocker.code === "change_reason_placeholder"
)));

const invalidImplementationPathEvidence = validateStage2ActivationEvidence(auditPlan, {
  implementationPath: "features/app/AppRoot.tsx",
  verificationCommands: auditPlan.requiredCommands,
  rollbackPlan: "Remove the single live registry key and guarded server registration",
  activationScopeSize: 1,
  preflightResult: "passed",
  verifyResult: "passed",
  smokeResult: "passed",
});
assert.equal(invalidImplementationPathEvidence.evidenceComplete, false);
assert.ok(invalidImplementationPathEvidence.blockers.some((blocker) => (
  blocker.code === "implementation_path_invalid"
)));

const readModelWithWriteHandlerPathEvidence = validateStage2ActivationEvidence(auditPlan, {
  implementationPath: "lib\\server\\database\\handlers\\taxation\\create-waybill.ts",
  verificationCommands: auditPlan.requiredCommands,
  rollbackPlan: "Remove the single live registry key and guarded server registration",
  activationScopeSize: 1,
  preflightResult: "passed",
  verifyResult: "passed",
  smokeResult: "passed",
});
assert.equal(readModelWithWriteHandlerPathEvidence.evidenceComplete, false);
assert.ok(readModelWithWriteHandlerPathEvidence.blockers.some((blocker) => (
  blocker.code === "implementation_path_phase_mismatch"
)));

const writeHandlerAuditPlan = createStage2ActivationAuditPlan(
  "stage-2-evidence-check",
  "Connect first write handler with evidence.",
  [
    { resource: "taxation", databaseAction: "list-waybills" },
    { resource: "taxation", databaseAction: "get-waybill" },
    { resource: "dispatch", databaseAction: "list-shift-reports" },
    { resource: "dispatch", databaseAction: "get-shift-report" },
  ],
);
assert.equal(writeHandlerAuditPlan.target?.phase, "write-handler");

const writeHandlerImplementationPathEvidence = validateStage2ActivationEvidence(writeHandlerAuditPlan, {
  implementationPath: "lib\\server\\database\\handlers\\taxation\\create-waybill.ts",
  verificationCommands: writeHandlerAuditPlan.requiredCommands,
  rollbackPlan: "Remove the single live registry key and guarded server registration",
  activationScopeSize: 1,
  preflightResult: "passed",
  verifyResult: "passed",
  smokeResult: "passed",
});
assert.equal(writeHandlerImplementationPathEvidence.evidenceComplete, true);
assert.equal(
  writeHandlerImplementationPathEvidence.expectedImplementationPath,
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.deepEqual(writeHandlerImplementationPathEvidence.blockers, []);

const writeHandlerMismatchedPathEvidence = validateStage2ActivationEvidence(writeHandlerAuditPlan, {
  implementationPath: "lib/server/database/handlers/taxation/patch-waybill.ts",
  verificationCommands: writeHandlerAuditPlan.requiredCommands,
  rollbackPlan: "Remove the single live registry key and guarded server registration",
  activationScopeSize: 1,
  preflightResult: "passed",
  verifyResult: "passed",
  smokeResult: "passed",
});
assert.equal(writeHandlerMismatchedPathEvidence.evidenceComplete, false);
assert.ok(writeHandlerMismatchedPathEvidence.blockers.some((blocker) => (
  blocker.code === "implementation_path_phase_mismatch"
  && blocker.expected === "lib/server/database/handlers/taxation/create-waybill.ts"
  && blocker.actual === "lib/server/database/handlers/taxation/patch-waybill.ts"
)));

const writeHandlerWithReadModelPathEvidence = validateStage2ActivationEvidence(writeHandlerAuditPlan, {
  implementationPath: "lib/server/database/module-live-handlers.ts",
  verificationCommands: writeHandlerAuditPlan.requiredCommands,
  rollbackPlan: "Remove the single live registry key and guarded server registration",
  activationScopeSize: 1,
  preflightResult: "passed",
  verifyResult: "passed",
  smokeResult: "passed",
});
assert.equal(writeHandlerWithReadModelPathEvidence.evidenceComplete, false);
assert.ok(writeHandlerWithReadModelPathEvidence.blockers.some((blocker) => (
  blocker.code === "implementation_path_phase_mismatch"
)));

const handlerDirectoryImplementationPathEvidence = validateStage2ActivationEvidence(auditPlan, {
  implementationPath: "lib/server/database/handlers/taxation",
  verificationCommands: auditPlan.requiredCommands,
  rollbackPlan: "Remove the single live registry key and guarded server registration",
  activationScopeSize: 1,
  preflightResult: "passed",
  verifyResult: "passed",
  smokeResult: "passed",
});
assert.equal(handlerDirectoryImplementationPathEvidence.evidenceComplete, false);
assert.ok(handlerDirectoryImplementationPathEvidence.blockers.some((blocker) => (
  blocker.code === "implementation_path_invalid"
)));

const traversalImplementationPathEvidence = validateStage2ActivationEvidence(auditPlan, {
  implementationPath: "lib/server/database/handlers/../module-live-handlers.ts",
  verificationCommands: auditPlan.requiredCommands,
  rollbackPlan: "Remove the single live registry key and guarded server registration",
  activationScopeSize: 1,
  preflightResult: "passed",
  verifyResult: "passed",
  smokeResult: "passed",
});
assert.equal(traversalImplementationPathEvidence.evidenceComplete, false);
assert.ok(traversalImplementationPathEvidence.blockers.some((blocker) => (
  blocker.code === "implementation_path_invalid"
)));

console.log("Stage 2 activation evidence checks passed");
