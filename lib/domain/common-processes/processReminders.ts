import type {
  BusinessTrip,
  BusinessTripTask,
  OvertimeRequest,
} from "./service-contracts";

export type CommonProcessReminderKind =
  | "overtime_approval_overdue"
  | "overtime_waiting_review"
  | "business_trip_approval_overdue"
  | "business_trip_approval_due"
  | "business_trip_report_missing"
  | "business_trip_task_overdue";

export type CommonProcessReminderSeverity = "critical" | "warning" | "info";

export type CommonProcessReminder = {
  id: string;
  entityType: "overtime_request" | "business_trip" | "business_trip_task";
  entityId: string;
  kind: CommonProcessReminderKind;
  severity: CommonProcessReminderSeverity;
  employeeId?: string;
  sectionId?: string;
  dueDate?: string;
  message: string;
};

export type CommonProcessReminderInput = {
  currentDate: string;
  overtimeRequests: readonly OvertimeRequest[];
  businessTrips: readonly BusinessTrip[];
  businessTripTasks: readonly BusinessTripTask[];
  approvalDueDays?: number;
};

export type CommonProcessReminderCounts = Record<CommonProcessReminderSeverity, number> & {
  total: number;
};

const reviewStatuses = new Set(["submitted", "reviewing"]);
const finishedTaskStatuses = new Set(["approved", "closed"]);

const severityRank: Record<CommonProcessReminderSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function buildCommonProcessReminders(input: CommonProcessReminderInput): CommonProcessReminder[] {
  const currentDay = toDateOnly(input.currentDate);
  const approvalDueDate = addDays(currentDay, input.approvalDueDays ?? 3);
  const tripsById = new Map(input.businessTrips.map((trip) => [trip.id, trip]));
  const reminders: CommonProcessReminder[] = [];

  for (const request of input.overtimeRequests) {
    if (!reviewStatuses.has(request.status)) {
      continue;
    }

    const workDate = toDateOnly(request.workDate);
    if (workDate < currentDay) {
      reminders.push({
        id: `overtime_request:${request.id}:approval-overdue`,
        entityType: "overtime_request",
        entityId: request.id,
        kind: "overtime_approval_overdue",
        severity: "critical",
        employeeId: request.employeeId,
        sectionId: request.sectionId,
        dueDate: request.workDate,
        message: "Overtime request is still waiting for approval after the work date.",
      });
    } else if (workDate <= approvalDueDate) {
      reminders.push({
        id: `overtime_request:${request.id}:waiting-review`,
        entityType: "overtime_request",
        entityId: request.id,
        kind: "overtime_waiting_review",
        severity: "warning",
        employeeId: request.employeeId,
        sectionId: request.sectionId,
        dueDate: request.workDate,
        message: "Overtime request needs review before the work date.",
      });
    }
  }

  for (const trip of input.businessTrips) {
    const tripStart = toDateOnly(trip.periodStart);
    const tripEnd = toDateOnly(trip.periodEnd);

    if (reviewStatuses.has(trip.approvalStatus) && tripStart < currentDay) {
      reminders.push({
        id: `business_trip:${trip.id}:approval-overdue`,
        entityType: "business_trip",
        entityId: trip.id,
        kind: "business_trip_approval_overdue",
        severity: "critical",
        employeeId: trip.employeeId,
        sectionId: trip.destinationSectionId,
        dueDate: trip.periodStart,
        message: "Business trip started before approval was completed.",
      });
    } else if (reviewStatuses.has(trip.approvalStatus) && tripStart <= approvalDueDate) {
      reminders.push({
        id: `business_trip:${trip.id}:approval-due`,
        entityType: "business_trip",
        entityId: trip.id,
        kind: "business_trip_approval_due",
        severity: "warning",
        employeeId: trip.employeeId,
        sectionId: trip.destinationSectionId,
        dueDate: trip.periodStart,
        message: "Business trip approval is due soon.",
      });
    }

    if (trip.approvalStatus === "approved" && tripEnd < currentDay && !trip.reportText?.trim()) {
      reminders.push({
        id: `business_trip:${trip.id}:report-missing`,
        entityType: "business_trip",
        entityId: trip.id,
        kind: "business_trip_report_missing",
        severity: "critical",
        employeeId: trip.employeeId,
        sectionId: trip.destinationSectionId,
        dueDate: trip.periodEnd,
        message: "Business trip report is missing after trip end.",
      });
    }
  }

  for (const task of input.businessTripTasks) {
    const trip = tripsById.get(task.tripId);
    if (!trip || finishedTaskStatuses.has(task.status)) {
      continue;
    }

    if (toDateOnly(trip.periodEnd) < currentDay) {
      reminders.push({
        id: `business_trip_task:${task.id}:task-overdue`,
        entityType: "business_trip_task",
        entityId: task.id,
        kind: "business_trip_task_overdue",
        severity: "critical",
        employeeId: trip.employeeId,
        sectionId: trip.destinationSectionId,
        dueDate: trip.periodEnd,
        message: "Business trip task is not finished after trip end.",
      });
    }
  }

  return reminders.sort((left, right) => (
    severityRank[left.severity] - severityRank[right.severity]
    || (left.dueDate ?? "").localeCompare(right.dueDate ?? "")
    || left.entityType.localeCompare(right.entityType)
    || left.entityId.localeCompare(right.entityId)
  ));
}

export function summarizeCommonProcessReminders(
  reminders: readonly CommonProcessReminder[],
): CommonProcessReminderCounts {
  return reminders.reduce<CommonProcessReminderCounts>((summary, reminder) => ({
    ...summary,
    total: summary.total + 1,
    [reminder.severity]: summary[reminder.severity] + 1,
  }), {
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
  });
}

function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
