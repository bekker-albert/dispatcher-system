import assert from "node:assert/strict";
import {
  createBusinessTripReadiness,
  createBusinessTripStatusCommand,
  createBusinessTripTaskStatusCommand,
  createOvertimeStatusCommand,
  validateBusinessTrip,
  validateOvertimeRequest,
} from "../lib/domain/common-processes/processCommands";
import {
  buildCommonProcessReminders,
  summarizeCommonProcessReminders,
} from "../lib/domain/common-processes/processReminders";
import type {
  BusinessTrip,
  BusinessTripTask,
  OvertimeRequest,
} from "../lib/domain/common-processes/service-contracts";

const commonAccess = {
  canView: true,
  canEdit: true,
  canApprove: true,
  canDelete: false,
  canExport: true,
  canAdmin: false,
  matchedGrantIds: ["grant-common-process"],
};

const overtimeRequest: OvertimeRequest = {
  id: "overtime-1",
  version: 2,
  employeeId: "employee-1",
  positionTitle: "dispatcher",
  sectionId: "baktay",
  workDate: "2026-05-08",
  shiftOrTime: "day",
  reason: "replacement",
  overtimeKind: "substitution",
  hours: 4,
  basis: "order-1",
  initiatedBy: "chief-1",
  status: "draft",
};

assert.deepEqual(validateOvertimeRequest(overtimeRequest), []);
assert.deepEqual(validateOvertimeRequest({
  ...overtimeRequest,
  reason: "",
  basis: "",
  hours: 25,
}).map((issue) => issue.code), [
  "hours_out_of_range",
  "reason_required",
  "basis_required",
]);

const submitOvertime = createOvertimeStatusCommand(
  overtimeRequest,
  "submit",
  commonAccess,
);
assert.equal(submitOvertime.ok, true);
if (submitOvertime.ok) {
  assert.deepEqual(submitOvertime.command.changes, [{
    field: "status",
    previousValue: "draft",
    nextValue: "submitted",
  }]);
}

const approveOvertimeWithoutReason = createOvertimeStatusCommand(
  { ...overtimeRequest, status: "reviewing" },
  "approve",
  commonAccess,
);
assert.equal(approveOvertimeWithoutReason.ok, false);
if (!approveOvertimeWithoutReason.ok) {
  assert.equal(approveOvertimeWithoutReason.rejection.code, "reason_required");
}

const approveOvertimeWithoutRight = createOvertimeStatusCommand(
  { ...overtimeRequest, status: "reviewing" },
  "approve",
  { ...commonAccess, canApprove: false },
  "approved",
);
assert.equal(approveOvertimeWithoutRight.ok, false);
if (!approveOvertimeWithoutRight.ok) {
  assert.equal(approveOvertimeWithoutRight.rejection.code, "approval_permission_required");
}

const businessTrip: BusinessTrip = {
  id: "trip-1",
  version: 3,
  employeeId: "installer-1",
  positionTitle: "SMTS installer",
  periodStart: "2026-05-08",
  periodEnd: "2026-05-10",
  route: "Baktay - Akbakay",
  purpose: "terminal installation",
  destinationSectionId: "akbakay",
  relatedVehicleIds: ["truck-101"],
  relatedMountingEventIds: [],
  relatedRequestIds: ["request-1"],
  approvalStatus: "reviewing",
};

assert.deepEqual(validateBusinessTrip(businessTrip), []);
assert.deepEqual(validateBusinessTrip({
  ...businessTrip,
  route: "",
  purpose: "",
  periodEnd: "2026-05-07",
}).map((issue) => issue.code), [
  "route_required",
  "purpose_required",
  "period_invalid",
]);

const approveTrip = createBusinessTripStatusCommand(
  businessTrip,
  "approve",
  commonAccess,
  "approved",
);
assert.equal(approveTrip.ok, true);
if (approveTrip.ok) {
  assert.deepEqual(approveTrip.command.changes, [{
    field: "approvalStatus",
    previousValue: "reviewing",
    nextValue: "approved",
  }]);
}

const tripTask: BusinessTripTask = {
  id: "trip-task-1",
  version: 1,
  tripId: businessTrip.id,
  taskType: "terminal_install",
  vehicleId: "truck-101",
  terminalId: "terminal-1",
  status: "submitted",
};
const taskReviewCommand = createBusinessTripTaskStatusCommand(
  tripTask,
  "startReview",
  commonAccess,
  "checked task",
);
assert.equal(taskReviewCommand.ok, true);

const blockedReadiness = createBusinessTripReadiness(
  { ...businessTrip, approvalStatus: "approved" },
  [tripTask],
);
assert.equal(blockedReadiness.canClose, false);
assert.deepEqual(blockedReadiness.issues.map((issue) => issue.code), [
  "report_required",
  "task_not_finished",
]);

const readyTripReadiness = createBusinessTripReadiness(
  { ...businessTrip, approvalStatus: "approved", reportText: "done" },
  [{ ...tripTask, status: "closed" }],
);
assert.equal(readyTripReadiness.canClose, true);

const commonProcessReminders = buildCommonProcessReminders({
  currentDate: "2026-05-08",
  approvalDueDays: 2,
  overtimeRequests: [
    { ...overtimeRequest, id: "overtime-overdue", status: "submitted", workDate: "2026-05-01" },
    { ...overtimeRequest, id: "overtime-soon", status: "reviewing", workDate: "2026-05-09" },
  ],
  businessTrips: [
    { ...businessTrip, id: "trip-overdue-approval", approvalStatus: "reviewing", periodStart: "2026-05-07" },
    { ...businessTrip, id: "trip-due", approvalStatus: "submitted", periodStart: "2026-05-09" },
    {
      ...businessTrip,
      id: "trip-report",
      approvalStatus: "approved",
      periodStart: "2026-05-01",
      periodEnd: "2026-05-07",
      reportText: "",
    },
  ],
  businessTripTasks: [
    {
      ...tripTask,
      id: "trip-task-overdue",
      tripId: "trip-report",
      status: "reviewing",
    },
  ],
});

assert.ok(commonProcessReminders.some((reminder) => (
  reminder.kind === "overtime_approval_overdue" && reminder.severity === "critical"
)));
assert.ok(commonProcessReminders.some((reminder) => (
  reminder.kind === "business_trip_report_missing" && reminder.severity === "critical"
)));
assert.ok(commonProcessReminders.some((reminder) => (
  reminder.kind === "business_trip_task_overdue" && reminder.severity === "critical"
)));
assert.ok(commonProcessReminders.some((reminder) => (
  reminder.kind === "overtime_waiting_review" && reminder.severity === "warning"
)));
assert.ok(commonProcessReminders.some((reminder) => (
  reminder.kind === "business_trip_approval_due" && reminder.severity === "warning"
)));
assert.deepEqual(summarizeCommonProcessReminders(commonProcessReminders), {
  total: 6,
  critical: 4,
  warning: 2,
  info: 0,
});

console.log("Common processes domain checks passed");
