import type { DriverVehicleAssignment, Waybill } from "./service-contracts";

export type WaybillIssueRequest = {
  workDate: string;
  sectionId: string;
  shift: Waybill["shift"];
  watchId?: string;
};

export type WaybillCreateCommand = WaybillIssueRequest & {
  entityType: "waybill";
  issueMode: Waybill["issueMode"];
  driverId: string;
  vehicleId: string;
  assignmentId?: string;
  basis?: string;
};

export type WaybillIssueSkippedReason =
  | "already_created"
  | "superseded_by_temporary_assignment";

export type WaybillIssueSkipped = {
  reason: WaybillIssueSkippedReason;
  assignmentId?: string;
  existingWaybillId?: string;
  driverId: string;
  vehicleId: string;
  canReprint: boolean;
};

export type WaybillAssignmentConflictKind =
  | "driver_has_multiple_vehicles"
  | "vehicle_has_multiple_drivers";

export type WaybillAssignmentConflict = {
  kind: WaybillAssignmentConflictKind;
  assignmentId: string;
  conflictingAssignmentId: string;
  driverId: string;
  vehicleId: string;
};

export type BatchWaybillIssuePlan = {
  commands: WaybillCreateCommand[];
  skipped: WaybillIssueSkipped[];
  conflicts: WaybillAssignmentConflict[];
};

export type SingleWaybillIssueRejectionCode =
  | "already_created"
  | "basis_required";

export type SingleWaybillIssueResult =
  | { ok: true; command: WaybillCreateCommand }
  | {
      ok: false;
      rejection: {
        code: SingleWaybillIssueRejectionCode;
        message: string;
        existingWaybillId?: string;
      };
    };

export type BatchWaybillIssuePlanInput = WaybillIssueRequest & {
  assignments: readonly DriverVehicleAssignment[];
  existingWaybills: readonly Waybill[];
  selectedAssignmentIds?: readonly string[];
};

export type SingleWaybillIssueInput = WaybillIssueRequest & {
  driverId: string;
  vehicleId: string;
  assignments: readonly DriverVehicleAssignment[];
  existingWaybills: readonly Waybill[];
  basis?: string;
};

const activeWaybillStatuses = new Set<Waybill["status"]>([
  "draft",
  "created",
  "printed",
  "reprinted",
  "closed",
]);

const isOnOrAfter = (value: string, floor: string): boolean => value >= floor;
const isOnOrBefore = (value: string, ceiling: string): boolean => value <= ceiling;

export const isDriverVehicleAssignmentActiveOnDate = (
  assignment: DriverVehicleAssignment,
  workDate: string,
): boolean => (
  isOnOrAfter(workDate, assignment.validFrom)
  && (!assignment.validTo || isOnOrBefore(workDate, assignment.validTo))
);

export const buildWaybillDuplicateKey = (
  waybill: Pick<Waybill, "workDate" | "sectionId" | "shift" | "driverId" | "vehicleId">,
): string => [
  waybill.workDate,
  waybill.sectionId,
  waybill.shift,
  waybill.driverId,
  waybill.vehicleId,
].join("|");

const createWaybillCreateCommand = (
  request: WaybillIssueRequest,
  assignment: Pick<DriverVehicleAssignment, "driverId" | "vehicleId"> & { id?: string },
  issueMode: Waybill["issueMode"],
  basis?: string,
): WaybillCreateCommand => ({
  entityType: "waybill",
  issueMode,
  workDate: request.workDate,
  sectionId: request.sectionId,
  shift: request.shift,
  watchId: request.watchId,
  driverId: assignment.driverId,
  vehicleId: assignment.vehicleId,
  assignmentId: assignment.id,
  basis,
});

const findExistingWaybill = (
  request: WaybillIssueRequest,
  driverId: string,
  vehicleId: string,
  existingWaybills: readonly Waybill[],
): Waybill | undefined => {
  const duplicateKey = buildWaybillDuplicateKey({
    ...request,
    driverId,
    vehicleId,
  });

  return existingWaybills.find((waybill) => (
    activeWaybillStatuses.has(waybill.status)
    && buildWaybillDuplicateKey(waybill) === duplicateKey
  ));
};

const sortAssignmentsByPriority = (
  assignments: readonly DriverVehicleAssignment[],
): DriverVehicleAssignment[] => [...assignments].sort((left, right) => {
  if (left.priority !== right.priority) {
    return left.priority === "temporary" ? -1 : 1;
  }

  return right.validFrom.localeCompare(left.validFrom);
});

export const selectEffectiveWaybillAssignments = (
  request: WaybillIssueRequest,
  assignments: readonly DriverVehicleAssignment[],
  selectedAssignmentIds?: readonly string[],
): {
  effectiveAssignments: DriverVehicleAssignment[];
  skipped: WaybillIssueSkipped[];
  conflicts: WaybillAssignmentConflict[];
} => {
  const selectedIds = selectedAssignmentIds ? new Set(selectedAssignmentIds) : undefined;
  const effectiveAssignments: DriverVehicleAssignment[] = [];
  const skipped: WaybillIssueSkipped[] = [];
  const conflicts: WaybillAssignmentConflict[] = [];

  const activeAssignments = sortAssignmentsByPriority(assignments.filter((assignment) => (
    assignment.sectionId === request.sectionId
    && isDriverVehicleAssignmentActiveOnDate(assignment, request.workDate)
    && (!selectedIds || selectedIds.has(assignment.id))
  )));

  for (const assignment of activeAssignments) {
    const driverConflict = effectiveAssignments.find((item) => item.driverId === assignment.driverId);
    const vehicleConflict = effectiveAssignments.find((item) => item.vehicleId === assignment.vehicleId);
    const samePairConflict = driverConflict?.id === vehicleConflict?.id
      && driverConflict?.driverId === assignment.driverId
      && driverConflict?.vehicleId === assignment.vehicleId;

    if (samePairConflict && driverConflict.priority === "temporary" && assignment.priority === "primary") {
      skipped.push({
        reason: "superseded_by_temporary_assignment",
        assignmentId: assignment.id,
        driverId: assignment.driverId,
        vehicleId: assignment.vehicleId,
        canReprint: false,
      });
      continue;
    }

    if (driverConflict) {
      conflicts.push({
        kind: "driver_has_multiple_vehicles",
        assignmentId: assignment.id,
        conflictingAssignmentId: driverConflict.id,
        driverId: assignment.driverId,
        vehicleId: assignment.vehicleId,
      });
      continue;
    }

    if (vehicleConflict) {
      conflicts.push({
        kind: "vehicle_has_multiple_drivers",
        assignmentId: assignment.id,
        conflictingAssignmentId: vehicleConflict.id,
        driverId: assignment.driverId,
        vehicleId: assignment.vehicleId,
      });
      continue;
    }

    effectiveAssignments.push(assignment);
  }

  return { effectiveAssignments, skipped, conflicts };
};

export const createBatchWaybillIssuePlan = (
  input: BatchWaybillIssuePlanInput,
): BatchWaybillIssuePlan => {
  const { effectiveAssignments, skipped, conflicts } = selectEffectiveWaybillAssignments(
    input,
    input.assignments,
    input.selectedAssignmentIds,
  );
  const commands: WaybillCreateCommand[] = [];

  for (const assignment of effectiveAssignments) {
    const existingWaybill = findExistingWaybill(
      input,
      assignment.driverId,
      assignment.vehicleId,
      input.existingWaybills,
    );

    if (existingWaybill) {
      skipped.push({
        reason: "already_created",
        assignmentId: assignment.id,
        existingWaybillId: existingWaybill.id,
        driverId: assignment.driverId,
        vehicleId: assignment.vehicleId,
        canReprint: true,
      });
      continue;
    }

    commands.push(createWaybillCreateCommand(input, assignment, "batch"));
  }

  return { commands, skipped, conflicts };
};

export const createSingleWaybillIssueCommand = (
  input: SingleWaybillIssueInput,
): SingleWaybillIssueResult => {
  const existingWaybill = findExistingWaybill(
    input,
    input.driverId,
    input.vehicleId,
    input.existingWaybills,
  );

  if (existingWaybill) {
    return {
      ok: false,
      rejection: {
        code: "already_created",
        message: "Waybill is already created for this driver, vehicle, date and shift.",
        existingWaybillId: existingWaybill.id,
      },
    };
  }

  const matchingAssignment = input.assignments.find((assignment) => (
    assignment.driverId === input.driverId
    && assignment.vehicleId === input.vehicleId
    && assignment.sectionId === input.sectionId
    && isDriverVehicleAssignmentActiveOnDate(assignment, input.workDate)
  ));

  if (!matchingAssignment && !input.basis?.trim()) {
    return {
      ok: false,
      rejection: {
        code: "basis_required",
        message: "Single waybill issue without an active assignment requires a basis.",
      },
    };
  }

  return {
    ok: true,
    command: createWaybillCreateCommand(
      input,
      {
        id: matchingAssignment?.id,
        driverId: input.driverId,
        vehicleId: input.vehicleId,
      },
      "single",
      input.basis,
    ),
  };
};
