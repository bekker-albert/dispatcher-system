import type { VersionedEntityReference } from "@/lib/domain/editing/patchEditing";

export type CommonProcessStatus = "draft" | "submitted" | "reviewing" | "approved" | "rejected" | "cancelled" | "closed";
export type OvertimeKind = "overtime" | "substitution" | "rest_recall" | "day_off_work" | "vacancy_work" | "extra_hours";
export type BusinessTripTaskType = "terminal_install" | "fuel_sensor_connect" | "can_connect" | "lights_setup" | "seatbelt_setup" | "remove" | "diagnostics";

export type OvertimeRequest = VersionedEntityReference & {
  employeeId: string;
  positionTitle: string;
  sectionId: string;
  workDate: string;
  shiftOrTime: string;
  reason: string;
  overtimeKind: OvertimeKind;
  hours: number;
  basis?: string;
  initiatedBy: string;
  approvedBy?: string;
  status: CommonProcessStatus;
};

export type BusinessTrip = VersionedEntityReference & {
  employeeId: string;
  positionTitle: string;
  periodStart: string;
  periodEnd: string;
  route: string;
  purpose: string;
  destinationSectionId?: string;
  transport?: string;
  fuelLimitLiters?: number;
  dailyAllowance?: number;
  lodging?: string;
  relatedVehicleIds: string[];
  relatedMountingEventIds: string[];
  relatedRequestIds: string[];
  approvalStatus: CommonProcessStatus;
  reportText?: string;
};

export type BusinessTripTask = VersionedEntityReference & {
  tripId: string;
  taskType: BusinessTripTaskType;
  vehicleId?: string;
  terminalId?: string;
  status: CommonProcessStatus;
  resultComment?: string;
};

export type DispatchServiceEventLogEntry = {
  id: string;
  workspaceId: string;
  entityType: string;
  entityId: string;
  eventType: string;
  createdAt: string;
  createdBy: string;
  payloadSummary: string;
};
