import assert from "node:assert/strict";
import { getEffectiveAccess, hasAccessCapability } from "../lib/domain/access-control/effectivePermissions";
import {
  buildMiningGpsLineReconciliationRows,
  summarizeMiningGpsReconciliations,
} from "../lib/domain/dispatch/gpsReconciliation";
import {
  createMiningNonCompletionReasonRequirements,
  summarizeMiningNonCompletionReasons,
} from "../lib/domain/dispatch/nonCompletionReasons";
import { createMiningOperationalAccountingRows } from "../lib/domain/dispatch/operationalAccounting";
import { createMiningPlanFactRows } from "../lib/domain/dispatch/planFact";
import { createMiningDispatchReportClosureCommands } from "../lib/domain/dispatch/reportClosure";
import { createMiningDispatchReportReadiness } from "../lib/domain/dispatch/reportReadiness";
import { createMiningShiftReportActionCommand } from "../lib/domain/dispatch/shiftReportCommands";
import {
  buildMiningShiftReportLineVolumeBreakdown,
  createMiningShiftReportLinePatchCommand,
  validateMiningShiftReportLineDraft,
} from "../lib/domain/dispatch/shiftReportLineModel";
import {
  hasBoundedMiningShiftReportPeriod,
  normalizeMiningShiftReportListQuery,
  toMiningShiftReportServerFilters,
} from "../lib/domain/dispatch/shiftReportQueries";
import {
  buildMiningShiftReportSubmissionControlRows,
  summarizeMiningShiftReportSubmissions,
} from "../lib/domain/dispatch/submissionControl";
import { applyPatchFieldChanges, createPatchFieldChanges, isPatchSaveNoop } from "../lib/domain/editing/patchEditing";
import {
  getDataRouteContractsOutsideSingleDatabaseRouter,
  getModuleDataRouteAction,
  getWorkspaceModulesWithoutDataRouteContract,
} from "../lib/domain/data-access/moduleDataRoutes";
import { workspaceModuleCatalog } from "../lib/domain/workspaces/moduleCatalog";
import { createWorkspaceGuardrailReport } from "../lib/domain/workspaces/guardrails";
import { preflightWorkspaceModuleAction } from "../lib/domain/workspaces/moduleActionPreflight";
import {
  getModulePersistenceContract,
  getPatchContractsWithoutVersioning,
  getWorkspaceModulesWithoutPersistenceContract,
} from "../lib/domain/data-access/persistenceContracts";
import {
  getWorkspaceModuleQueryPolicy,
  getWorkspaceModulesWithoutQueryPolicy,
  listWorkspaceModuleQueryPolicies,
  workspaceModuleQueryPolicyBindings,
} from "../lib/domain/data-access/workspaceQueryPolicies";
import {
  canTransitionStatus,
  getAllowedNextStatuses,
  getTransitionRule,
  isTerminalWorkflowStatus,
  workflowDefinitions,
} from "../lib/domain/workflows/statusTransitions";

const previousRow = {
  id: "row-1",
  version: 4,
  trips: 80,
  coefficient: 18,
  comment: "ok",
};
const nextRow = {
  ...previousRow,
  trips: 85,
  comment: "accepted",
};
const patchChanges = createPatchFieldChanges(previousRow, nextRow, ["trips", "coefficient", "comment"]);
assert.deepEqual(patchChanges, [
  { field: "trips", previousValue: 80, nextValue: 85 },
  { field: "comment", previousValue: "ok", nextValue: "accepted" },
]);
assert.deepEqual(applyPatchFieldChanges(previousRow, patchChanges), nextRow);

const miningShiftLine = {
  id: "line-1",
  version: 2,
  reportId: "report-1",
  workType: "career haulage",
  productionLink: {
    excavatorVehicleId: "ex-305",
    haulTruckVehicleIds: ["truck-101", "truck-102", "truck-103"],
  },
  trips: 85,
  coefficient: 18,
  unit: "m3" as const,
  calculatedVolume: 1530,
};
assert.equal(buildMiningShiftReportLineVolumeBreakdown(miningShiftLine).acceptedVolume, 1530);
assert.deepEqual(validateMiningShiftReportLineDraft(miningShiftLine), []);
assert.ok(validateMiningShiftReportLineDraft({
  ...miningShiftLine,
  workType: "",
  productionLink: {
    excavatorVehicleId: "",
    haulTruckVehicleIds: ["truck-101", "truck-101"],
  },
  trips: -1,
  coefficient: 0,
}).some((issue) => issue.code === "duplicate_haul_trucks"));

const miningLinePatch = createMiningShiftReportLinePatchCommand(
  miningShiftLine,
  { ...miningShiftLine, trips: 86, calculatedVolume: 0 },
  "correct trips",
);
assert.equal(miningLinePatch.entityType, "mining_shift_report_line");
assert.equal(miningLinePatch.entity.version, 2);
assert.deepEqual(miningLinePatch.changes.map((change) => change.field), ["trips"]);
assert.equal(isPatchSaveNoop(miningLinePatch), false);

const miningListQuery = normalizeMiningShiftReportListQuery({
  pageSize: 999 as never,
  offset: -20,
  filters: {
    dateFrom: "2026-05-01",
    dateTo: "2026-05-08",
    sectionId: "baktay",
    shift: "day",
    status: "submitted",
  },
});
assert.equal(miningListQuery.pageSize, 50);
assert.equal(miningListQuery.offset, 0);
assert.equal(hasBoundedMiningShiftReportPeriod(miningListQuery), true);
assert.deepEqual(toMiningShiftReportServerFilters(miningListQuery.filters), {
  date_from: "2026-05-01",
  date_to: "2026-05-08",
  section_id: "baktay",
  shift: "day",
  status: "submitted",
  submitted_by: undefined,
  accepted_by: undefined,
});

const miningShiftReport = {
  id: "report-1",
  version: 7,
  sectionId: "baktay",
  reportDate: "2026-05-08",
  shift: "day" as const,
  status: "accepted" as const,
};
const miningShiftReportAccess = {
  canView: true,
  canEdit: true,
  canApprove: true,
  canDelete: false,
  canExport: true,
  canAdmin: false,
  matchedGrantIds: ["grant-mining-dispatcher"],
};
const closeShiftReportCommand = createMiningShiftReportActionCommand(
  miningShiftReport,
  "close",
  miningShiftReportAccess,
);
assert.equal(closeShiftReportCommand.ok, true);
if (closeShiftReportCommand.ok) {
  assert.equal(closeShiftReportCommand.command.entity.version, 7);
  assert.deepEqual(closeShiftReportCommand.command.changes, [{
    field: "status",
    previousValue: "accepted",
    nextValue: "closed",
  }]);
}
assert.equal(createMiningShiftReportActionCommand(
  { ...miningShiftReport, status: "draft" },
  "close",
  miningShiftReportAccess,
).ok, false);

const submissionControlRows = buildMiningShiftReportSubmissionControlRows(
  [
    { sectionId: "baktay", reportDate: "2026-05-08", shift: "day", deadlineAt: "2026-05-08T09:00:00.000Z" },
    { sectionId: "baktay", reportDate: "2026-05-08", shift: "night", deadlineAt: "2026-05-08T21:00:00.000Z" },
  ],
  [{ ...miningShiftReport, submittedAt: "2026-05-08T08:30:00.000Z", submittedBy: "master-1" }],
  "2026-05-08T22:00:00.000Z",
);
assert.equal(submissionControlRows.length, 2);
assert.equal(submissionControlRows[0].isAccepted, true);
assert.equal(submissionControlRows[1].status, "missing");
assert.equal(submissionControlRows[1].isOverdue, true);
assert.deepEqual(summarizeMiningShiftReportSubmissions(submissionControlRows), {
  totalExpected: 2,
  missingCount: 1,
  overdueCount: 1,
  returnedCount: 0,
  acceptedCount: 1,
  closedCount: 0,
});

const operationalAccountingRows = createMiningOperationalAccountingRows(
  [miningShiftReport, { ...miningShiftReport, id: "report-draft", status: "draft" }],
  [miningShiftLine, { ...miningShiftLine, id: "line-draft", reportId: "report-draft", trips: 999, calculatedVolume: 17982 }],
  [{
    id: "survey-1",
    version: 1,
    sectionId: "baktay",
    reportDate: "2026-05-08",
    sourceReportLineId: "line-1",
    adjustedVolume: 1525,
    reason: "survey correction",
    surveyorUserId: "surveyor-1",
  }],
);
assert.equal(operationalAccountingRows.length, 1);
assert.equal(operationalAccountingRows[0].acceptedVolume, 1530);
assert.equal(operationalAccountingRows[0].surveyAdjustedVolume, 1525);
assert.equal(operationalAccountingRows[0].finalVolume, 1525);
assert.deepEqual(operationalAccountingRows[0].sourceLineIds, ["line-1"]);

const planFactRows = createMiningPlanFactRows(
  [
    {
      id: "plan-version-1",
      version: 1,
      sectionId: "baktay",
      periodMonth: "2026-05",
      versionNumber: 1,
      status: "approved",
    },
    {
      id: "plan-version-draft",
      version: 1,
      sectionId: "baktay",
      periodMonth: "2026-05",
      versionNumber: 2,
      status: "draft",
    },
  ],
  [
    {
      id: "plan-target-1",
      planVersionId: "plan-version-1",
      sectionId: "baktay",
      planDate: "2026-05-08",
      shift: "day",
      workType: "career haulage",
      productionLink: miningShiftLine.productionLink,
      unit: "m3",
      plannedVolume: 1600,
    },
    {
      id: "plan-target-draft",
      planVersionId: "plan-version-draft",
      sectionId: "baktay",
      planDate: "2026-05-08",
      shift: "day",
      workType: "career haulage",
      productionLink: miningShiftLine.productionLink,
      unit: "m3",
      plannedVolume: 9999,
    },
  ],
  operationalAccountingRows,
);
assert.equal(planFactRows.length, 1);
assert.equal(planFactRows[0].plannedVolume, 1600);
assert.equal(planFactRows[0].actualVolume, 1525);
assert.equal(planFactRows[0].deltaVolume, -75);
assert.equal(planFactRows[0].status, "behind_plan");
assert.deepEqual(planFactRows[0].sourceOperationalRowIds, [operationalAccountingRows[0].id]);

const nonCompletionReasonRequirements = createMiningNonCompletionReasonRequirements(planFactRows);
assert.equal(nonCompletionReasonRequirements[0].status, "reason_required");
assert.deepEqual(summarizeMiningNonCompletionReasons(nonCompletionReasonRequirements), {
  totalRows: 1,
  requiredCount: 1,
  providedCount: 0,
  missingCount: 1,
});
assert.equal(createMiningNonCompletionReasonRequirements(
  planFactRows,
  [{ planFactRowId: planFactRows[0].id, reasonId: "equipment_repair" }],
)[0].status, "reason_provided");

const gpsReconciliationRows = buildMiningGpsLineReconciliationRows(
  [miningShiftReport],
  [miningShiftLine],
  [
    { id: "gps-101", vehicleId: "truck-101", reportDate: "2026-05-08", shift: "day", trips: 30 },
    { id: "gps-102", vehicleId: "truck-102", reportDate: "2026-05-08", shift: "day", trips: 30 },
    { id: "gps-103", vehicleId: "truck-103", reportDate: "2026-05-08", shift: "day", trips: 25 },
  ],
);
assert.equal(gpsReconciliationRows[0].status, "matched");

const gpsMismatchRows = buildMiningGpsLineReconciliationRows(
  [miningShiftReport],
  [miningShiftLine],
  [{ id: "gps-101", vehicleId: "truck-101", reportDate: "2026-05-08", shift: "day", trips: 30 }],
);
assert.equal(gpsMismatchRows[0].status, "mismatch");
assert.deepEqual(gpsMismatchRows[0].missingGpsVehicleIds, ["truck-102", "truck-103"]);
assert.deepEqual(summarizeMiningGpsReconciliations([...gpsReconciliationRows, ...gpsMismatchRows]), {
  totalRows: 2,
  matchedCount: 1,
  mismatchCount: 1,
  missingGpsCount: 1,
});

const dispatchReportReadiness = createMiningDispatchReportReadiness({
  submissions: submissionControlRows,
  gpsReconciliations: gpsMismatchRows,
  nonCompletionReasons: nonCompletionReasonRequirements,
  planFactRows,
});
assert.equal(dispatchReportReadiness.canClose, false);
assert.equal(dispatchReportReadiness.blockerCount, 3);
assert.ok(dispatchReportReadiness.issues.some((issue) => issue.code === "missing_submission"));
assert.ok(dispatchReportReadiness.issues.some((issue) => issue.code === "gps_mismatch"));
assert.ok(dispatchReportReadiness.issues.some((issue) => issue.code === "missing_non_completion_reason"));

const readyDispatchReportReadiness = createMiningDispatchReportReadiness({
  submissions: submissionControlRows.slice(0, 1),
  gpsReconciliations: gpsReconciliationRows,
  nonCompletionReasons: createMiningNonCompletionReasonRequirements(
    planFactRows,
    [{ planFactRowId: planFactRows[0].id, reasonId: "equipment_repair" }],
  ),
  planFactRows,
});
assert.equal(readyDispatchReportReadiness.canClose, true);
const reportClosureCommands = createMiningDispatchReportClosureCommands(
  [miningShiftReport, { ...miningShiftReport, id: "report-closed", status: "closed" }],
  readyDispatchReportReadiness,
  miningShiftReportAccess,
  "close dispatch day",
);
assert.equal(reportClosureCommands.ok, true);
if (reportClosureCommands.ok) {
  assert.equal(reportClosureCommands.commands.length, 1);
  assert.deepEqual(reportClosureCommands.commands[0].changes, [{
    field: "status",
    previousValue: "accepted",
    nextValue: "closed",
  }]);
}
const blockedReportClosure = createMiningDispatchReportClosureCommands(
  [miningShiftReport],
  dispatchReportReadiness,
  miningShiftReportAccess,
);
assert.equal(blockedReportClosure.ok, false);
if (!blockedReportClosure.ok) {
  assert.equal(blockedReportClosure.rejection.code, "readiness_blockers");
}

assert.ok(workspaceModuleCatalog.some((module) => module.id === "access-matrix" && module.editingStrategy === "versioned-patch"));
assert.equal(getWorkspaceModulesWithoutQueryPolicy().length, 0);
assert.equal(getWorkspaceModuleQueryPolicy("smts-fuel-drains")?.policy.id, "gps-events");
assert.equal(getWorkspaceModuleQueryPolicy("taxation-fuel-periods")?.policy.id, "period-section-status");
assert.deepEqual(listWorkspaceModuleQueryPolicies("taxation").map((binding) => binding.moduleId), [
  "taxation-waybills",
  "taxation-fuel-periods",
]);
assert.ok(workspaceModuleQueryPolicyBindings.every((binding) => binding.reason.length > 20));
assert.equal(getWorkspaceModulesWithoutPersistenceContract().length, 0);
assert.equal(getPatchContractsWithoutVersioning().length, 0);
assert.equal(getModulePersistenceContract("prepared-reports")?.exportOnDemand, true);
assert.equal(getModulePersistenceContract("taxation-fuel-periods")?.primaryEntities.includes("supplier_fuel_invoices"), true);
assert.equal(getWorkspaceModulesWithoutDataRouteContract().length, 0);
assert.equal(getDataRouteContractsOutsideSingleDatabaseRouter().length, 0);
assert.equal(getModuleDataRouteAction("taxation-waybills", "list"), "list-waybills");
assert.equal(createWorkspaceGuardrailReport().blockerCount, 0);
assert.equal(createWorkspaceGuardrailReport("taxation").checkedModuleCount, 2);

assert.ok(workflowDefinitions.length >= 6);
assert.deepEqual(getAllowedNextStatuses("mining-shift-report", "draft"), ["submitted"]);
assert.equal(canTransitionStatus("fuel-accounting-period", "sent_to_1c", "closed"), true);
assert.equal(canTransitionStatus("vehicle-movement", "draft", "closed"), false);
assert.equal(isTerminalWorkflowStatus("assignment-petition", "approved"), true);
assert.equal(getTransitionRule("common-process", "reviewing", "approved")?.requiresApprovalRight, true);

const effectiveAccess = getEffectiveAccess(
  [
    {
      id: "grant-role-taxation-view",
      roleId: "taxation-dispatcher",
      sectionId: "baktay",
      workspaceId: "taxation",
      canView: true,
      canEdit: false,
      canApprove: false,
      canDelete: false,
      canExport: false,
      canAdmin: false,
      version: 1,
    },
    {
      id: "grant-user-taxation-edit",
      userId: "user-1",
      workspaceId: "taxation",
      moduleId: "waybills",
      canView: true,
      canEdit: true,
      canApprove: false,
      canDelete: false,
      canExport: true,
      canAdmin: false,
      version: 1,
    },
  ],
  { userId: "user-1", roleIds: ["taxation-dispatcher"] },
  { workspaceId: "taxation", sectionId: "baktay", moduleId: "waybills" },
);
assert.equal(effectiveAccess.canView, true);
assert.equal(effectiveAccess.canEdit, true);
assert.equal(hasAccessCapability(effectiveAccess, "export"), true);
assert.deepEqual(effectiveAccess.matchedGrantIds, ["grant-role-taxation-view", "grant-user-taxation-edit"]);
const taxationListPreflight = preflightWorkspaceModuleAction({
  moduleId: "taxation-waybills",
  action: "list",
  access: effectiveAccess,
  query: {
    pageSize: 50,
    filters: {
      date_from: "2026-05-01",
      date_to: "2026-05-15",
      section_id: "baktay",
      status: "created",
    },
  },
});
assert.equal(taxationListPreflight.ok, true);

console.log("Dispatch service domain checks passed");
