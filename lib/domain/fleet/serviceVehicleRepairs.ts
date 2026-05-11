import type { EffectiveAccessDecision } from "../access-control/effectivePermissions";
import type { PatchSaveCommand } from "../editing/patchEditing";
import type { ServiceVehicleRepair } from "./service-contracts";

export type ServiceVehicleRepairValidationCode =
  | "repair_date_required"
  | "reason_required"
  | "fault_description_required"
  | "mileage_negative"
  | "cost_negative"
  | "work_performed_required";

export type ServiceVehicleRepairValidationIssue = {
  code: ServiceVehicleRepairValidationCode;
  message: string;
};

export type ServiceVehicleRepairPatchRejectionCode =
  | "edit_permission_required"
  | "validation_failed"
  | "reason_required"
  | "no_changes";

export type ServiceVehicleRepairPatchResult =
  | { ok: true; command: PatchSaveCommand }
  | {
      ok: false;
      rejection: {
        code: ServiceVehicleRepairPatchRejectionCode;
        message: string;
        issues?: ServiceVehicleRepairValidationIssue[];
      };
    };

export const serviceVehicleRepairEditableFields = [
  "repairDate",
  "mileage",
  "reason",
  "faultDescription",
  "workPerformed",
  "vendor",
  "cost",
  "parts",
  "documentIds",
  "status",
  "comment",
] as const satisfies ReadonlyArray<Extract<keyof ServiceVehicleRepair, string>>;

type ServiceVehicleRepairEditableField = typeof serviceVehicleRepairEditableFields[number];

const needsPatchReason = (repair: ServiceVehicleRepair): boolean => (
  repair.status === "cancelled" || repair.status === "closed"
);

const canEditRepair = (access: EffectiveAccessDecision): boolean => access.canEdit || access.canAdmin;

export const validateServiceVehicleRepair = (
  repair: ServiceVehicleRepair,
): ServiceVehicleRepairValidationIssue[] => {
  const issues: ServiceVehicleRepairValidationIssue[] = [];

  if (!repair.repairDate.trim()) {
    issues.push({
      code: "repair_date_required",
      message: "Repair date is required.",
    });
  }

  if (!repair.reason.trim()) {
    issues.push({
      code: "reason_required",
      message: "Repair reason is required.",
    });
  }

  if (!repair.faultDescription.trim()) {
    issues.push({
      code: "fault_description_required",
      message: "Fault description is required.",
    });
  }

  if (repair.mileage < 0) {
    issues.push({
      code: "mileage_negative",
      message: "Repair mileage cannot be negative.",
    });
  }

  if (repair.cost !== undefined && repair.cost < 0) {
    issues.push({
      code: "cost_negative",
      message: "Repair cost cannot be negative.",
    });
  }

  if (repair.status === "completed" && !repair.workPerformed?.trim()) {
    issues.push({
      code: "work_performed_required",
      message: "Completed repair must describe completed work.",
    });
  }

  return issues;
};

export const createServiceVehicleRepairPatchCommand = (
  previous: ServiceVehicleRepair,
  next: ServiceVehicleRepair,
  access: EffectiveAccessDecision,
  reason?: string,
): ServiceVehicleRepairPatchResult => {
  if (!canEditRepair(access)) {
    return {
      ok: false,
      rejection: {
        code: "edit_permission_required",
        message: "Edit permission is required to patch service vehicle repair.",
      },
    };
  }

  const issues = validateServiceVehicleRepair(next);
  if (issues.length > 0) {
    return {
      ok: false,
      rejection: {
        code: "validation_failed",
        message: "Service vehicle repair patch failed validation.",
        issues,
      },
    };
  }

  if (previous.status !== next.status && needsPatchReason(next) && !reason?.trim()) {
    return {
      ok: false,
      rejection: {
        code: "reason_required",
        message: "Reason is required when cancelling or closing a repair.",
      },
    };
  }

  const changes = createRepairFieldChanges(previous, next);
  if (changes.length === 0) {
    return {
      ok: false,
      rejection: {
        code: "no_changes",
        message: "Service vehicle repair patch has no changed fields.",
      },
    };
  }

  return {
    ok: true,
    command: {
      entityType: "service_vehicle_repair",
      entity: {
        id: previous.id,
        version: previous.version,
        updatedAt: previous.updatedAt,
        updatedBy: previous.updatedBy,
      },
      changes,
      reason,
    },
  };
};

function createRepairFieldChanges(
  previous: ServiceVehicleRepair,
  next: ServiceVehicleRepair,
): PatchSaveCommand["changes"] {
  return serviceVehicleRepairEditableFields.flatMap((field: ServiceVehicleRepairEditableField) => (
    Object.is(previous[field], next[field])
      ? []
      : [{
          field,
          previousValue: previous[field],
          nextValue: next[field],
        }]
  ));
}
