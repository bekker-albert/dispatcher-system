import type { VersionedEntityReference } from "@/lib/domain/editing/patchEditing";

export type MiningShift = "day" | "night";
export type MiningUnitOfMeasure = "m3" | "tonnes";
export type MiningShiftReportStatus = "draft" | "submitted" | "reviewing" | "returned" | "accepted" | "closed";
export type MiningGpsReconciliationStatus = "new" | "reviewing" | "matched" | "mismatch" | "closed";

export const miningShiftReportStatuses: MiningShiftReportStatus[] = [
  "draft",
  "submitted",
  "reviewing",
  "returned",
  "accepted",
  "closed",
];

export type MiningProductionLink = {
  excavatorVehicleId: string;
  haulTruckVehicleIds: string[];
};

export type MiningShiftReport = VersionedEntityReference & {
  sectionId: string;
  reportDate: string;
  shift: MiningShift;
  status: MiningShiftReportStatus;
  submittedAt?: string;
  submittedBy?: string;
  acceptedAt?: string;
  acceptedBy?: string;
};

export type MiningShiftReportLine = VersionedEntityReference & {
  reportId: string;
  workType: string;
  productionLink: MiningProductionLink;
  trips: number;
  coefficient: number;
  unit: MiningUnitOfMeasure;
  calculatedVolume: number;
  weighbridgeVolume?: number;
  nonCompletionReasonId?: string;
  repairHours?: number;
};

export type MiningPlanVersion = VersionedEntityReference & {
  sectionId: string;
  periodMonth: string;
  versionNumber: number;
  status: "draft" | "approved" | "superseded" | "closed";
  annualPlanImpactNote?: string;
};

export type MiningSurveyAdjustment = VersionedEntityReference & {
  sectionId: string;
  reportDate: string;
  sourceReportLineId: string;
  adjustedVolume: number;
  reason: string;
  surveyorUserId: string;
};

export type MiningGpsReconciliation = VersionedEntityReference & {
  reportLineId: string;
  vehicleId: string;
  reportDate: string;
  shift: MiningShift;
  reportedTrips: number;
  gpsTrips: number;
  status: MiningGpsReconciliationStatus;
  dispatcherComment?: string;
};
