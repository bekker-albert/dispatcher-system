import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getGuardedLiveModuleHandlerFactoryKind } from "../lib/server/database/module-handler-factories";
import {
  createMysqlReadModelLiveHandlerRegistrationCandidate,
  reviewMysqlReadModelLiveHandlerRegistrationCandidate,
} from "../lib/server/database/live-handler-registration-review";

const source = readFileSync(resolve("lib/server/database/live-handler-registration-review.ts"), "utf8");

assert.match(source, /getModuleHandlerImplementationPlanEntry/);
assert.match(source, /createMysqlLiveModuleListReadModelHandler/);
assert.match(source, /createMysqlLiveModuleDetailReadModelHandler/);
assert.match(source, /getLiveModuleDatabaseHandlerRegistrationIssues/);
assert.match(source, /createLiveModuleDatabaseHandlersFromRegistrations/);
assert.doesNotMatch(source, /listConfiguredLiveModuleHandlerKeys/);

const listCandidate = createMysqlReadModelLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "list-waybills",
});
assert.ok(listCandidate);
assert.equal(listCandidate.factoryKind, "list");
assert.equal(listCandidate.implementationPath, "lib/server/database/module-live-handlers.ts");
assert.equal(getGuardedLiveModuleHandlerFactoryKind(listCandidate.handler), "list");

const listReview = reviewMysqlReadModelLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "list-waybills",
});
assert.equal(listReview.ready, true);
assert.equal(listReview.moduleId, "taxation-waybills");
assert.equal(listReview.workspaceId, "taxation");
assert.equal(listReview.contractKind, "list");
assert.equal(listReview.phase, "read-model");
assert.equal(listReview.factoryKind, "list");
assert.deepEqual(listReview.issues, []);
assert.deepEqual(listReview.registrationSummary, {
  resource: "taxation",
  databaseAction: "list-waybills",
  factoryKind: "list",
  implementationPath: "lib/server/database/module-live-handlers.ts",
});

const detailCandidate = createMysqlReadModelLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "get-waybill",
});
assert.ok(detailCandidate);
assert.equal(detailCandidate.factoryKind, "detail");
assert.equal(getGuardedLiveModuleHandlerFactoryKind(detailCandidate.handler), "detail");

assert.equal(createMysqlReadModelLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "create-waybill",
}), undefined);
const writeReview = reviewMysqlReadModelLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "create-waybill",
});
assert.equal(writeReview.ready, false);
assert.equal(writeReview.contractKind, "write");
assert.deepEqual(writeReview.issues, ["unsupported_contract_kind"]);

const unknownReview = reviewMysqlReadModelLiveHandlerRegistrationCandidate({
  resource: "taxation",
  databaseAction: "not-a-real-action",
});
assert.equal(unknownReview.ready, false);
assert.deepEqual(unknownReview.issues, ["missing_implementation_plan"]);

console.log("Live handler registration review checks passed");
