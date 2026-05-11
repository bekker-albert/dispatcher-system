import assert from "node:assert/strict";
import {
  listModuleCreateMutationPlans,
} from "../lib/domain/data-access/moduleCreateMutationPlans";
import {
  listModulePatchMutationPlans,
} from "../lib/domain/data-access/modulePatchMutationPlans";
import {
  getModuleWritePipelinePlan,
  getReportInvalidationPlansWithoutWritePipeline,
  getWritePipelinePlansWithoutRequiredGuards,
  listModuleWritePipelinePlans,
} from "../lib/domain/data-access/moduleWritePipelinePlans";

const allPipelines = listModuleWritePipelinePlans();
assert.equal(
  allPipelines.length,
  listModuleCreateMutationPlans().length + listModulePatchMutationPlans().length,
);
assert.equal(getWritePipelinePlansWithoutRequiredGuards().length, 0);
assert.equal(getReportInvalidationPlansWithoutWritePipeline().length, 0);

const fuelCreatePipeline = getModuleWritePipelinePlan("taxation-fuel-periods", "create-fuel-period");
assert.ok(fuelCreatePipeline);
assert.equal(fuelCreatePipeline.pipelineKind, "create");
assert.equal(fuelCreatePipeline.writeAction, "create");
assert.equal(fuelCreatePipeline.requiresAccessPreflight, true);
assert.equal(fuelCreatePipeline.requiresPayloadEnvelope, true);
assert.equal(fuelCreatePipeline.requiresAtomicTransaction, true);
assert.equal(fuelCreatePipeline.requiresChangeHistory, true);
assert.equal(fuelCreatePipeline.requiresPostCommitSideEffects, true);
assert.equal(fuelCreatePipeline.requiresDuplicateCheck, true);
assert.equal(fuelCreatePipeline.requiresExpectedVersion, false);
assert.equal(fuelCreatePipeline.maxEntityRowWrites, 1);
assert.equal(fuelCreatePipeline.queuesAggregateRefresh, true);
assert.equal(fuelCreatePipeline.noInlineReportRecalculation, true);
assert.equal(fuelCreatePipeline.noFullReportRebuild, true);

const fuelPatchPipeline = getModuleWritePipelinePlan("taxation-fuel-periods", "patch-fuel-period");
assert.ok(fuelPatchPipeline);
assert.equal(fuelPatchPipeline.pipelineKind, "patch");
assert.equal(fuelPatchPipeline.writeAction, "edit");
assert.equal(fuelPatchPipeline.requiresExpectedVersion, true);
assert.equal(fuelPatchPipeline.requiresDuplicateCheck, false);
assert.equal(fuelPatchPipeline.queuesAggregateRefresh, true);

const fuelTransitionPipeline = getModuleWritePipelinePlan("taxation-fuel-periods", "transition-fuel-period");
assert.ok(fuelTransitionPipeline);
assert.equal(fuelTransitionPipeline.pipelineKind, "workflow-transition");
assert.equal(fuelTransitionPipeline.writeAction, "approve");
assert.equal(fuelTransitionPipeline.queuesAggregateRefresh, true);

const overtimePipeline = getModuleWritePipelinePlan("common-overtime", "patch-overtime-request");
assert.ok(overtimePipeline);
assert.equal(overtimePipeline.pipelineKind, "patch");
assert.equal(overtimePipeline.queuesAggregateRefresh, false);

assert.deepEqual(
  listModuleWritePipelinePlans("fleet").map((plan) => plan.databaseAction),
  [
    "create-vehicle-movement",
    "create-service-vehicle-record",
    "patch-vehicle-movement",
    "transition-vehicle-movement",
    "patch-service-vehicle-record",
  ],
);

console.log("Module write pipeline plans checks passed");
