import type { VersionedEntityReference } from "@/lib/domain/editing/patchEditing";

export type WaybillIssueMode = "batch" | "single";
export type WaybillStatus = "draft" | "created" | "printed" | "reprinted" | "cancelled" | "closed";
export type AssignmentPetitionStatus = "draft" | "submitted" | "chief_review" | "approved" | "rejected" | "cancelled" | "expired";
export type FuelAccountingPeriodStatus = "open" | "reconciling" | "supplier_reconciled" | "sent_to_1c" | "closed" | "returned";
export type FuelMovementKind = "vehicle_issue" | "fuel_truck_receipt" | "contractor_transfer" | "write_off" | "correction";
export type TaxerSubstitutionBasis = "sick_leave" | "vacation" | "vacancy" | "order" | "other";
export type TaxerSubstitutionStatus = "draft" | "active" | "expired" | "cancelled" | "closed";

export const fuelAccountingPeriodStatuses: FuelAccountingPeriodStatus[] = [
  "open",
  "reconciling",
  "supplier_reconciled",
  "sent_to_1c",
  "closed",
  "returned",
];

export type DriverVehicleAssignment = VersionedEntityReference & {
  driverId: string;
  vehicleId: string;
  sectionId: string;
  validFrom: string;
  validTo?: string;
  priority: "primary" | "temporary";
  petitionId?: string;
};

export type Waybill = VersionedEntityReference & {
  issueMode: WaybillIssueMode;
  workDate: string;
  sectionId: string;
  shift: "day" | "night";
  watchId?: string;
  driverId: string;
  vehicleId: string;
  status: WaybillStatus;
  basis?: string;
  printedAt?: string;
};

export type AssignmentPetition = VersionedEntityReference & {
  sectionId: string;
  driverId: string;
  vehicleId: string;
  validFrom: string;
  validTo: string;
  status: AssignmentPetitionStatus;
  requestedBy: string;
  approvedBy?: string;
  reason: string;
};

export type FuelAccountingPeriod = VersionedEntityReference & {
  sectionId: string;
  periodStart: string;
  periodEnd: string;
  status: FuelAccountingPeriodStatus;
  sentTo1cAt?: string;
};

export type FuelMovement = VersionedEntityReference & {
  periodId: string;
  movementKind: FuelMovementKind;
  fuelType: string;
  liters: number;
  vehicleId?: string;
  driverId?: string;
  waybillId?: string;
  fuelTruckVehicleId?: string;
  contractorId?: string;
  supplierInvoiceId?: string;
};

export type ContractorFuelDebt = VersionedEntityReference & {
  contractorId: string;
  sectionId: string;
  periodId: string;
  fuelType: string;
  liters: number;
  status: "open" | "reconciled" | "written_off" | "closed";
};

export type TaxerSubstitutionSession = VersionedEntityReference & {
  seniorTaxerUserId: string;
  replacedTaxerUserId?: string;
  sectionId: string;
  validFrom: string;
  validTo: string;
  basis: TaxerSubstitutionBasis;
  basisDocumentId?: string;
  status: TaxerSubstitutionStatus;
  createdBy: string;
  approvedBy?: string;
  reason: string;
};
