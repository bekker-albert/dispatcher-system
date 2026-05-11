import type {
  MiningGpsReconciliationStatus,
  MiningShift,
  MiningShiftReport,
  MiningShiftReportLine,
} from "./service-contracts";
import { isMiningShiftReportAcceptedForOperationalAccounting } from "./operationalAccounting";

export type MiningGpsTripReading = {
  id: string;
  vehicleId: string;
  reportDate: string;
  shift: MiningShift;
  trips: number;
};

export type MiningGpsLineReconciliationRow = {
  id: string;
  reportId: string;
  reportLineId: string;
  sectionId: string;
  reportDate: string;
  shift: MiningShift;
  workType: string;
  haulTruckVehicleIds: string[];
  reportedTrips: number;
  gpsTrips: number;
  tripDifference: number;
  toleranceTrips: number;
  status: MiningGpsReconciliationStatus;
  matchedGpsVehicleIds: string[];
  missingGpsVehicleIds: string[];
};

export type MiningGpsReconciliationSummary = {
  totalRows: number;
  matchedCount: number;
  mismatchCount: number;
  missingGpsCount: number;
};

const gpsTripKey = (
  reportDate: string,
  shift: MiningShift,
  vehicleId: string,
): string => [reportDate, shift, vehicleId].join(":");

export const createMiningGpsTripKey = gpsTripKey;

export const buildMiningGpsTripsByVehicle = (
  readings: readonly MiningGpsTripReading[],
): Map<string, number> => {
  const tripsByVehicle = new Map<string, number>();

  for (const reading of readings) {
    const key = gpsTripKey(reading.reportDate, reading.shift, reading.vehicleId);
    tripsByVehicle.set(key, (tripsByVehicle.get(key) ?? 0) + reading.trips);
  }

  return tripsByVehicle;
};

const resolveGpsStatus = (
  matchedGpsVehicleIds: readonly string[],
  missingGpsVehicleIds: readonly string[],
  tripDifference: number,
  toleranceTrips: number,
): MiningGpsReconciliationStatus => {
  if (matchedGpsVehicleIds.length === 0) {
    return "new";
  }

  if (missingGpsVehicleIds.length === 0 && Math.abs(tripDifference) <= toleranceTrips) {
    return "matched";
  }

  return "mismatch";
};

export const buildMiningGpsLineReconciliationRows = (
  reports: readonly MiningShiftReport[],
  lines: readonly MiningShiftReportLine[],
  gpsReadings: readonly MiningGpsTripReading[],
  toleranceTrips = 0,
): MiningGpsLineReconciliationRow[] => {
  const acceptedReportsById = new Map(
    reports
      .filter(isMiningShiftReportAcceptedForOperationalAccounting)
      .map((report) => [report.id, report]),
  );
  const gpsTripsByVehicle = buildMiningGpsTripsByVehicle(gpsReadings);

  return lines.flatMap((line) => {
    const report = acceptedReportsById.get(line.reportId);
    if (!report) {
      return [];
    }

    let gpsTrips = 0;
    const matchedGpsVehicleIds: string[] = [];
    const missingGpsVehicleIds: string[] = [];

    for (const vehicleId of line.productionLink.haulTruckVehicleIds) {
      const gpsTripsForVehicle = gpsTripsByVehicle.get(gpsTripKey(report.reportDate, report.shift, vehicleId));

      if (typeof gpsTripsForVehicle === "number") {
        gpsTrips += gpsTripsForVehicle;
        matchedGpsVehicleIds.push(vehicleId);
      } else {
        missingGpsVehicleIds.push(vehicleId);
      }
    }

    const tripDifference = gpsTrips - line.trips;

    return [{
      id: `gps-reconciliation-${line.id}`,
      reportId: report.id,
      reportLineId: line.id,
      sectionId: report.sectionId,
      reportDate: report.reportDate,
      shift: report.shift,
      workType: line.workType,
      haulTruckVehicleIds: line.productionLink.haulTruckVehicleIds,
      reportedTrips: line.trips,
      gpsTrips,
      tripDifference,
      toleranceTrips,
      status: resolveGpsStatus(matchedGpsVehicleIds, missingGpsVehicleIds, tripDifference, toleranceTrips),
      matchedGpsVehicleIds,
      missingGpsVehicleIds,
    }];
  });
};

export const summarizeMiningGpsReconciliations = (
  rows: readonly MiningGpsLineReconciliationRow[],
): MiningGpsReconciliationSummary => ({
  totalRows: rows.length,
  matchedCount: rows.filter((row) => row.status === "matched").length,
  mismatchCount: rows.filter((row) => row.status === "mismatch").length,
  missingGpsCount: rows.filter((row) => row.status === "new" || row.missingGpsVehicleIds.length > 0).length,
});
