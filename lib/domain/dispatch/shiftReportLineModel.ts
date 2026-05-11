import type { PatchFieldChange, PatchSaveCommand } from "../editing/patchEditing";
import type { MiningProductionLink, MiningShiftReportLine } from "./service-contracts";

export type MiningShiftReportLineEditableField =
  | "workType"
  | "productionLink"
  | "trips"
  | "coefficient"
  | "unit"
  | "weighbridgeVolume"
  | "nonCompletionReasonId"
  | "repairHours";

export type MiningShiftReportLineValidationCode =
  | "missing_work_type"
  | "missing_excavator"
  | "missing_haul_trucks"
  | "duplicate_haul_trucks"
  | "negative_trips"
  | "invalid_coefficient"
  | "invalid_calculated_volume";

export type MiningShiftReportLineValidationIssue = {
  field: string;
  code: MiningShiftReportLineValidationCode;
  severity: "error" | "warning";
  message: string;
};

export type MiningShiftReportLineVolumeBreakdown = {
  trips: number;
  coefficient: number;
  calculatedVolume: number;
  acceptedVolume: number;
  acceptedVolumeSource: "trips_coefficient" | "weighbridge";
};

export const miningShiftReportLineEditableFields: MiningShiftReportLineEditableField[] = [
  "workType",
  "productionLink",
  "trips",
  "coefficient",
  "unit",
  "weighbridgeVolume",
  "nonCompletionReasonId",
  "repairHours",
];

const volumePrecision = 3;

const roundVolume = (value: number): number => {
  const multiplier = 10 ** volumePrecision;

  return Math.round(value * multiplier) / multiplier;
};

const valuesEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) {
    return true;
  }

  if (typeof left === "object" && left !== null && typeof right === "object" && right !== null) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  return false;
};

export const calculateMiningShiftReportLineVolume = (
  trips: number,
  coefficient: number,
): number => roundVolume(trips * coefficient);

export const buildMiningShiftReportLineVolumeBreakdown = (
  line: Pick<MiningShiftReportLine, "trips" | "coefficient" | "weighbridgeVolume">,
): MiningShiftReportLineVolumeBreakdown => {
  const calculatedVolume = calculateMiningShiftReportLineVolume(line.trips, line.coefficient);
  const hasWeighbridgeVolume = typeof line.weighbridgeVolume === "number" && Number.isFinite(line.weighbridgeVolume);

  return {
    trips: line.trips,
    coefficient: line.coefficient,
    calculatedVolume,
    acceptedVolume: hasWeighbridgeVolume ? line.weighbridgeVolume as number : calculatedVolume,
    acceptedVolumeSource: hasWeighbridgeVolume ? "weighbridge" : "trips_coefficient",
  };
};

export const normalizeMiningShiftReportLineForSave = (
  line: MiningShiftReportLine,
): MiningShiftReportLine => ({
  ...line,
  calculatedVolume: calculateMiningShiftReportLineVolume(line.trips, line.coefficient),
});

export const findDuplicateHaulTruckIds = (productionLink: MiningProductionLink): string[] => {
  const seenTruckIds = new Set<string>();
  const duplicateTruckIds = new Set<string>();

  for (const truckId of productionLink.haulTruckVehicleIds) {
    if (seenTruckIds.has(truckId)) {
      duplicateTruckIds.add(truckId);
    }
    seenTruckIds.add(truckId);
  }

  return [...duplicateTruckIds];
};

export const validateMiningShiftReportLineDraft = (
  line: MiningShiftReportLine,
): MiningShiftReportLineValidationIssue[] => {
  const issues: MiningShiftReportLineValidationIssue[] = [];
  const expectedVolume = calculateMiningShiftReportLineVolume(line.trips, line.coefficient);

  if (!line.workType.trim()) {
    issues.push({
      field: "workType",
      code: "missing_work_type",
      severity: "error",
      message: "Work type is required.",
    });
  }

  if (!line.productionLink.excavatorVehicleId.trim()) {
    issues.push({
      field: "productionLink.excavatorVehicleId",
      code: "missing_excavator",
      severity: "error",
      message: "Excavator is required for a production link.",
    });
  }

  if (line.productionLink.haulTruckVehicleIds.length === 0) {
    issues.push({
      field: "productionLink.haulTruckVehicleIds",
      code: "missing_haul_trucks",
      severity: "error",
      message: "At least one haul truck is required.",
    });
  }

  if (findDuplicateHaulTruckIds(line.productionLink).length > 0) {
    issues.push({
      field: "productionLink.haulTruckVehicleIds",
      code: "duplicate_haul_trucks",
      severity: "error",
      message: "Haul trucks must not be duplicated in one production link.",
    });
  }

  if (!Number.isFinite(line.trips) || line.trips < 0) {
    issues.push({
      field: "trips",
      code: "negative_trips",
      severity: "error",
      message: "Trips must be a non-negative number.",
    });
  }

  if (!Number.isFinite(line.coefficient) || line.coefficient <= 0) {
    issues.push({
      field: "coefficient",
      code: "invalid_coefficient",
      severity: "error",
      message: "Coefficient must be greater than zero.",
    });
  }

  if (Number.isFinite(line.calculatedVolume) && Math.abs(line.calculatedVolume - expectedVolume) > 0.001) {
    issues.push({
      field: "calculatedVolume",
      code: "invalid_calculated_volume",
      severity: "warning",
      message: "Calculated volume should match trips multiplied by coefficient.",
    });
  }

  return issues;
};

export const createMiningShiftReportLinePatchCommand = (
  previousLine: MiningShiftReportLine,
  nextLine: MiningShiftReportLine,
  reason?: string,
): PatchSaveCommand => {
  const normalizedNextLine = normalizeMiningShiftReportLineForSave(nextLine);
  const changes: PatchFieldChange[] = miningShiftReportLineEditableFields.flatMap((field) => {
    const previousValue = previousLine[field];
    const nextValue = normalizedNextLine[field];

    return valuesEqual(previousValue, nextValue)
      ? []
      : [{ field, previousValue, nextValue }];
  });

  return {
    entityType: "mining_shift_report_line",
    entity: {
      id: previousLine.id,
      version: previousLine.version,
      updatedAt: previousLine.updatedAt,
      updatedBy: previousLine.updatedBy,
    },
    changes,
    reason,
  };
};
