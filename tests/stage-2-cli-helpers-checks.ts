import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  isPlaceholderText,
  parseActivationScopeSize,
  parseActivationScopeSizeOrNaN,
  parseEvidenceResult,
  parseLiveHandlerKey,
  parseLiveHandlerKeys,
  valueAfter,
  valuesAfter,
} from "../scripts/stage-2-cli-helpers";

const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const helperSource = readFileSync(resolve("scripts/stage-2-cli-helpers.ts"), "utf8");
const readModelActivationSource = readFileSync(resolve("scripts/plan-stage-2-read-model-activation.ts"), "utf8");
const writeHandlerActivationSource = readFileSync(resolve("scripts/plan-stage-2-write-handler-activation.ts"), "utf8");
const overviewSource = readFileSync(resolve("scripts/plan-stage-2-activation-overview.ts"), "utf8");
const liveReadinessSource = readFileSync(resolve("scripts/plan-stage-2-live-readiness.ts"), "utf8");
const nextActionSource = readFileSync(resolve("scripts/plan-stage-2-next-action.ts"), "utf8");
const activationAuditSource = readFileSync(resolve("scripts/plan-stage-2-activation-audit.ts"), "utf8");
const evidenceSource = readFileSync(resolve("scripts/check-stage-2-activation-evidence.ts"), "utf8");
const liveHandlerActivationPacketSource = readFileSync(
  resolve("scripts/plan-live-handler-activation-packet.ts"),
  "utf8",
);
const writeHandlerActivationPacketSource = readFileSync(
  resolve("scripts/plan-write-handler-activation-packet.ts"),
  "utf8",
);
const liveHandlerActivationReviewSource = readFileSync(
  resolve("scripts/review-live-handler-activation.ts"),
  "utf8",
);
const writeHandlerRegistrationReviewSource = readFileSync(
  resolve("scripts/review-write-handler-registration.ts"),
  "utf8",
);

assert.match(packageJson.scripts["check:dispatch-architecture"], /stage-2-cli-helpers-checks/);

assert.match(helperSource, /parseLiveHandlerKey/);
assert.match(helperSource, /parseLiveHandlerKeys/);
assert.match(helperSource, /parseEvidenceResult/);
assert.match(helperSource, /parseActivationScopeSize/);
assert.match(helperSource, /parseActivationScopeSizeOrNaN/);
assert.match(helperSource, /isPlaceholderText/);
assert.match(helperSource, /valueAfter/);
assert.match(helperSource, /valuesAfter/);
assert.match(helperSource, /Invalid --live-handler value/);
assert.match(helperSource, /Invalid --activation-scope-size value/);
assert.doesNotMatch(helperSource, /process\.env\.DB|dbRows|dbExecute|createLiveModuleDatabaseHandlersFromRegistrations/);

for (const source of [
  readModelActivationSource,
  writeHandlerActivationSource,
  overviewSource,
  liveReadinessSource,
  nextActionSource,
  activationAuditSource,
  evidenceSource,
  liveHandlerActivationPacketSource,
  writeHandlerActivationPacketSource,
  liveHandlerActivationReviewSource,
  writeHandlerRegistrationReviewSource,
]) {
  assert.match(source, /stage-2-cli-helpers/);
  assert.doesNotMatch(source, /function valueAfter/);
  assert.doesNotMatch(source, /function valuesAfter/);
  assert.doesNotMatch(source, /function parseLiveHandlerKey/);
  assert.doesNotMatch(source, /function parseActivationScopeSizeOrNaN/);
  assert.doesNotMatch(source, /function isPlaceholderText/);
}

assert.equal(valueAfter(["--requested-by", "backend-engineer"], "--requested-by"), "backend-engineer");
assert.equal(valueAfter(["--requested-by"], "--requested-by"), undefined);
assert.deepEqual(valuesAfter([
  "--live-handler",
  "taxation/list-waybills",
  "--live-handler",
  "dispatch:get-shift-report",
], "--live-handler"), [
  "taxation/list-waybills",
  "dispatch:get-shift-report",
]);

assert.deepEqual(parseLiveHandlerKey("taxation/list-waybills"), {
  value: {
    resource: "taxation",
    databaseAction: "list-waybills",
  },
});
assert.deepEqual(parseLiveHandlerKey("dispatch:get-shift-report"), {
  value: {
    resource: "dispatch",
    databaseAction: "get-shift-report",
  },
});
assert.match(parseLiveHandlerKey("not-valid").error ?? "", /Invalid --live-handler value/);
assert.deepEqual(parseLiveHandlerKeys([
  "taxation/list-waybills",
  "bad",
]), {
  liveHandlerKeys: [{
    resource: "taxation",
    databaseAction: "list-waybills",
  }],
  parseErrors: [
    'Invalid --live-handler value "bad". Use resource/action, for example taxation/list-waybills.',
  ],
});

assert.deepEqual(parseEvidenceResult(undefined, "--verify-result"), {});
assert.deepEqual(parseEvidenceResult("passed", "--verify-result"), { value: "passed" });
assert.match(parseEvidenceResult("ok", "--verify-result").error ?? "", /Invalid --verify-result value/);
assert.deepEqual(parseActivationScopeSize(undefined), {});
assert.deepEqual(parseActivationScopeSize("1"), { value: 1 });
assert.match(parseActivationScopeSize("one").error ?? "", /Invalid --activation-scope-size value/);
assert.equal(parseActivationScopeSizeOrNaN(undefined), 1);
assert.equal(parseActivationScopeSizeOrNaN("1"), 1);
assert.equal(parseActivationScopeSizeOrNaN("2"), 2);
assert.equal(Number.isNaN(parseActivationScopeSizeOrNaN("one")), true);
assert.equal(isPlaceholderText("TODO"), true);
assert.equal(isPlaceholderText("n/a"), true);
assert.equal(isPlaceholderText("Review one bounded activation."), false);

console.log("Stage 2 CLI helper checks passed");
