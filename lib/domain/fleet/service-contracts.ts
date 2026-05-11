import type { VersionedEntityReference } from "@/lib/domain/editing/patchEditing";

export type VehicleMovementStatus = "draft" | "approval" | "approved" | "in_transit" | "arrived" | "accepted" | "cancelled" | "closed";
export type ServiceVehicleDocumentStatus = "valid" | "expiring" | "expired" | "renewal" | "closed";
export type ServiceVehicleRepairStatus = "draft" | "planned" | "in_progress" | "completed" | "cancelled" | "closed";

export type VehicleMovementDocument = VersionedEntityReference & {
  vehicleId: string;
  fromSectionId: string;
  toSectionId: string;
  departureDate: string;
  arrivalDate?: string;
  reason: string;
  basis: string;
  senderResponsibleId: string;
  receiverResponsibleId: string;
  approvedBy?: string;
  status: VehicleMovementStatus;
  comment?: string;
};

export type VehicleSectionHistoryEntry = VersionedEntityReference & {
  vehicleId: string;
  sectionId: string;
  validFrom: string;
  validTo?: string;
  movementDocumentId?: string;
};

export type ServiceVehicleCard = VersionedEntityReference & {
  vehicleId: string;
  brand: string;
  model: string;
  plateNumber: string;
  garageNumber?: string;
  vin: string;
  manufactureYear: string;
  responsibleUserId: string;
  currentMileage: number;
  status: "active" | "repair" | "idle" | "written_off";
  location: string;
};

export type ServiceVehicleMaintenance = VersionedEntityReference & {
  serviceVehicleId: string;
  maintenanceDate: string;
  mileage: number;
  maintenanceKind: string;
  nextMileage?: number;
  nextDate?: string;
  vendor?: string;
  cost?: number;
  documentId?: string;
  comment?: string;
};

export type ServiceVehicleInsurance = VersionedEntityReference & {
  serviceVehicleId: string;
  policyNumber: string;
  company: string;
  startsAt: string;
  endsAt: string;
  cost?: number;
  documentId?: string;
  status: ServiceVehicleDocumentStatus;
};

export type ServiceVehicleTireSet = VersionedEntityReference & {
  serviceVehicleId: string;
  tireType: "winter" | "summer";
  brand: string;
  size: string;
  installedAt?: string;
  installedMileage?: number;
  removedAt?: string;
  removedMileage?: number;
  totalMileage?: number;
  condition: string;
  storageLocation?: string;
  remainingResource?: string;
};

export type ServiceVehicleRepair = VersionedEntityReference & {
  serviceVehicleId: string;
  repairDate: string;
  mileage: number;
  reason: string;
  faultDescription: string;
  workPerformed?: string;
  vendor?: string;
  cost?: number;
  parts?: readonly string[];
  documentIds?: readonly string[];
  status: ServiceVehicleRepairStatus;
  comment?: string;
};
