import assert from "node:assert/strict";
import {
  createReportAggregateInvalidationEnvelopeFromMutation,
  getInvalidReportAggregateInvalidationPlans,
  getRefreshSourceModulesWithoutInvalidationPlans,
  getReportAggregateInvalidationPlan,
  listReportAggregateInvalidationPlans,
  reportAggregateInvalidationPlans,
  validateReportAggregateInvalidationPlan,
  type ReportAggregateInvalidationPlan,
} from "../lib/domain/reports/aggregateInvalidationPlans";
import { createReportAggregateRefreshEnvelope } from "../lib/domain/reports/aggregateRefresh";

assert.equal(getInvalidReportAggregateInvalidationPlans().length, 0);
assert.equal(getRefreshSourceModulesWithoutInvalidationPlans().length, 0);
assert.equal(reportAggregateInvalidationPlans.length, 11);
assert.deepEqual(listReportAggregateInvalidationPlans("taxation-fuel-periods").map((plan) => plan.mutationKind), [
  "create",
  "patch",
  "workflow-transition",
  "import-accepted",
]);

const fuelPatchPlan = getReportAggregateInvalidationPlan("taxation-fuel-periods", "patch");
assert.ok(fuelPatchPlan);
assert.equal(fuelPatchPlan.databaseAction, "patch-fuel-period");
assert.equal(fuelPatchPlan.invalidationReason, "patch-saved");
assert.equal(fuelPatchPlan.noFullReportRebuild, true);

const fuelPatchInvalidation = createReportAggregateInvalidationEnvelopeFromMutation(fuelPatchPlan, {
  id: "fuel-period-patch-2",
  entityId: "fuel-period-2026-05-a",
  changedBy: "taxer-1",
  changedAt: "2026-05-16T04:00:00.000Z",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-15",
  sectionId: "baktay",
  sourceVersion: "fuel-period-v5",
  changedFields: ["contractorDebtLiters"],
  estimatedInputRows: 250,
});

assert.equal(fuelPatchInvalidation.ok, true);
if (fuelPatchInvalidation.ok) {
  assert.equal(fuelPatchInvalidation.envelope.reason, "patch-saved");
  assert.equal(fuelPatchInvalidation.envelope.refreshPlan.trigger, "event-driven");
  assert.equal(fuelPatchInvalidation.envelope.refreshPlan.grain, "fuel_period");
  assert.equal(fuelPatchInvalidation.envelope.refreshPlan.sourceVersion, "fuel-period-v5");
  const refreshEnvelope = createReportAggregateRefreshEnvelope(fuelPatchInvalidation.envelope.refreshPlan);
  assert.equal(refreshEnvelope.ok, true);
}

const movementImportPlan = getReportAggregateInvalidationPlan("fleet-movements", "import-accepted");
assert.ok(movementImportPlan);
assert.equal(movementImportPlan.databaseAction, "stage-vehicle-movement-import");
const movementImportInvalidation = createReportAggregateInvalidationEnvelopeFromMutation(movementImportPlan, {
  id: "movement-import-accepted-1",
  entityId: "movement-1",
  changedBy: "dispatcher-1",
  changedAt: "2026-05-09T09:00:00.000Z",
  periodStart: "2026-05-09",
  periodEnd: "2026-05-09",
  sectionId: "baktay",
  sourceVersion: "movement-import-v1",
});

assert.equal(movementImportInvalidation.ok, true);
if (movementImportInvalidation.ok) {
  assert.equal(movementImportInvalidation.envelope.reason, "import-accepted");
  assert.equal(movementImportInvalidation.envelope.refreshPlan.maxInputRows, 5000);
}

assert.deepEqual(validateReportAggregateInvalidationPlan({
  sourceModuleId: "taxation-fuel-periods",
  mutationKind: "patch",
  databaseAction: "wrong-action",
  invalidationReason: "patch-saved",
  defaultGrain: "shift",
  requiresEntityId: true,
  requiresPeriod: true,
  requiresSourceVersion: true,
  derivesFromVersionedWrite: true,
  queuesBoundedRefresh: true,
  noFullReportRebuild: true,
}).map((issue) => issue.code), [
  "grain_not_allowed",
  "mutation_action_mismatch",
]);

const incompletePlan: ReportAggregateInvalidationPlan = {
  sourceModuleId: "unknown-module",
  mutationKind: "create",
  databaseAction: "create-unknown",
  invalidationReason: "create-saved",
  defaultGrain: "day",
  requiresEntityId: true,
  requiresPeriod: true,
  requiresSourceVersion: true,
  derivesFromVersionedWrite: true,
  queuesBoundedRefresh: true,
  noFullReportRebuild: true,
};

assert.deepEqual(validateReportAggregateInvalidationPlan(incompletePlan).map((issue) => issue.code), [
  "source_plan_missing",
  "mutation_plan_missing",
]);

console.log("Report aggregate invalidation plans checks passed");
