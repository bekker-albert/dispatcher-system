import type { AssignmentPetition, DriverVehicleAssignment } from "./service-contracts";

export type AssignmentPetitionOverlapKind =
  | "driver_has_overlapping_assignment"
  | "vehicle_has_overlapping_assignment";

export type AssignmentPetitionOverlapConflict = {
  kind: AssignmentPetitionOverlapKind;
  petitionId: string;
  conflictingAssignmentId: string;
  driverId: string;
  vehicleId: string;
  overlapFrom: string;
  overlapTo?: string;
};

export type TemporaryAssignmentCreateCommand = {
  entityType: "driver_vehicle_assignment";
  driverId: string;
  vehicleId: string;
  sectionId: string;
  validFrom: string;
  validTo: string;
  priority: "temporary";
  petitionId: string;
  basis: string;
};

export type TemporaryAssignmentCommandResult =
  | { ok: true; command: TemporaryAssignmentCreateCommand }
  | {
      ok: false;
      rejection: {
        code: "petition_not_approved" | "overlap_conflict";
        message: string;
        conflicts?: AssignmentPetitionOverlapConflict[];
      };
    };

const openEndedDate = "9999-12-31";

export const doAssignmentPeriodsOverlap = (
  left: Pick<DriverVehicleAssignment, "validFrom" | "validTo">,
  right: Pick<DriverVehicleAssignment, "validFrom" | "validTo">,
): boolean => (
  left.validFrom <= (right.validTo ?? openEndedDate)
  && right.validFrom <= (left.validTo ?? openEndedDate)
);

const createOverlapConflict = (
  kind: AssignmentPetitionOverlapKind,
  petition: AssignmentPetition,
  assignment: DriverVehicleAssignment,
): AssignmentPetitionOverlapConflict => ({
  kind,
  petitionId: petition.id,
  conflictingAssignmentId: assignment.id,
  driverId: petition.driverId,
  vehicleId: petition.vehicleId,
  overlapFrom: petition.validFrom > assignment.validFrom ? petition.validFrom : assignment.validFrom,
  overlapTo: (petition.validTo < (assignment.validTo ?? openEndedDate) ? petition.validTo : assignment.validTo),
});

export const findAssignmentPetitionOverlapConflicts = (
  petition: AssignmentPetition,
  assignments: readonly DriverVehicleAssignment[],
): AssignmentPetitionOverlapConflict[] => assignments.flatMap((assignment) => {
  if (
    assignment.sectionId !== petition.sectionId
    || assignment.id === petition.id
    || !doAssignmentPeriodsOverlap(petition, assignment)
  ) {
    return [];
  }

  const samePair = assignment.driverId === petition.driverId && assignment.vehicleId === petition.vehicleId;
  if (samePair && assignment.priority === "primary") {
    return [];
  }

  if (assignment.driverId === petition.driverId) {
    return [createOverlapConflict("driver_has_overlapping_assignment", petition, assignment)];
  }

  if (assignment.vehicleId === petition.vehicleId) {
    return [createOverlapConflict("vehicle_has_overlapping_assignment", petition, assignment)];
  }

  return [];
});

export const createTemporaryAssignmentCommandFromPetition = (
  petition: AssignmentPetition,
  assignments: readonly DriverVehicleAssignment[],
): TemporaryAssignmentCommandResult => {
  if (petition.status !== "approved") {
    return {
      ok: false,
      rejection: {
        code: "petition_not_approved",
        message: "Temporary assignment can be created only from an approved petition.",
      },
    };
  }

  const conflicts = findAssignmentPetitionOverlapConflicts(petition, assignments);
  if (conflicts.length > 0) {
    return {
      ok: false,
      rejection: {
        code: "overlap_conflict",
        message: "Temporary assignment overlaps with existing driver or vehicle assignment.",
        conflicts,
      },
    };
  }

  return {
    ok: true,
    command: {
      entityType: "driver_vehicle_assignment",
      driverId: petition.driverId,
      vehicleId: petition.vehicleId,
      sectionId: petition.sectionId,
      validFrom: petition.validFrom,
      validTo: petition.validTo,
      priority: "temporary",
      petitionId: petition.id,
      basis: petition.reason,
    },
  };
};
