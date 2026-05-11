import assert from "node:assert/strict";
import {
  createReportAggregateInvalidationEnvelope,
  validateReportAggregateInvalidationEvent,
} from "../lib/domain/reports/aggregateInvalidation";
import { createReportAggregateRefreshEnvelope } from "../lib/domain/reports/aggregateRefresh";

const fuelInvalidation = createReportAggregateInvalidationEnvelope({
  id: "fuel-period-patch-1",
  sourceModuleId: "taxation-fuel-periods",
  entityId: "fuel-period-2026-05-a",
  changedBy: "taxer-1",
  changedAt: "2026-05-16T04:00:00.000Z",
  reason: "patch-saved",
  grain: "fuel_period",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-15",
  sectionId: "baktay",
  sourceVersion: "fuel-period-v4",
  changedFields: ["issuedFuelLiters"],
  estimatedInputRows: 250,
});

assert.equal(fuelInvalidation.ok, true);
if (fuelInvalidation.ok) {
  assert.equal(fuelInvalidation.envelope.action, "queue-prepared-aggregate-refresh");
  assert.equal(fuelInvalidation.envelope.refreshScope, "entity-period-section");
  assert.equal(fuelInvalidation.envelope.noFullReportRebuild, true);
  assert.equal(fuelInvalidation.envelope.noClientSideRecalculation, true);
  assert.equal(fuelInvalidation.envelope.refreshPlan.moduleId, "taxation-fuel-periods");
  assert.equal(fuelInvalidation.envelope.refreshPlan.trigger, "event-driven");
  assert.deepEqual(fuelInvalidation.envelope.refreshPlan.sourceIds, ["fuel-period-2026-05-a"]);
  assert.equal(fuelInvalidation.envelope.refreshPlan.sourceVersion, "fuel-period-v4");

  const refreshEnvelope = createReportAggregateRefreshEnvelope(fuelInvalidation.envelope.refreshPlan);
  assert.equal(refreshEnvelope.ok, true);
}

const movementInvalidation = createReportAggregateInvalidationEnvelope({
  id: "vehicle-movement-transition-1",
  sourceModuleId: "fleet-movements",
  entityId: "movement-1",
  changedBy: "dispatcher-1",
  changedAt: "2026-05-09T06:00:00.000Z",
  reason: "workflow-transition",
  trigger: "manual-request",
  grain: "day",
  periodStart: "2026-05-09",
  periodEnd: "2026-05-09",
  sectionId: "baktay",
  sourceVersion: "movement-v2",
});

assert.equal(movementInvalidation.ok, true);
if (movementInvalidation.ok) {
  assert.equal(movementInvalidation.envelope.refreshPlan.trigger, "manual-request");
  assert.equal(movementInvalidation.envelope.refreshPlan.maxInputRows, 5000);
}

assert.deepEqual(validateReportAggregateInvalidationEvent({
  id: "bad-invalidation",
  sourceModuleId: "unknown-module",
  entityId: "",
  changedBy: "",
  changedAt: "",
  reason: "patch-saved",
  trigger: "continuous-background",
  grain: "shift",
  changedFields: ["rows"],
}).map((issue) => issue.code), [
  "source_plan_missing",
  "entity_id_required",
  "changed_by_required",
  "changed_at_required",
  "period_required",
  "source_version_required",
  "continuous_background_forbidden",
  "whole_table_invalidation_forbidden",
]);

assert.deepEqual(validateReportAggregateInvalidationEvent({
  id: "bad-grain",
  sourceModuleId: "taxation-fuel-periods",
  entityId: "fuel-period-2026-05-a",
  changedBy: "taxer-1",
  changedAt: "2026-05-16T04:00:00.000Z",
  reason: "patch-saved",
  trigger: "event-driven",
  grain: "shift",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-15",
  sectionId: "baktay",
  sourceVersion: "fuel-period-v4",
}).map((issue) => issue.code), [
  "grain_not_allowed",
]);

console.log("Report aggregate invalidation checks passed");
