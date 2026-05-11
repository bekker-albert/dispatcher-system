import type {
  MiningProductionLink,
  MiningShift,
  MiningShiftReport,
  MiningShiftReportLine,
  MiningShiftReportStatus,
  MiningSurveyAdjustment,
  MiningUnitOfMeasure,
} from "./service-contracts";
import { buildMiningShiftReportLineVolumeBreakdown } from "./shiftReportLineModel";

export type MiningOperationalAccountingVolumeSource = "trips_coefficient" | "weighbridge" | "mixed";

export type MiningOperationalAccountingRow = {
  id: string;
  sectionId: string;
  reportDate: string;
  shift: MiningShift;
  workType: string;
  productionLink: MiningProductionLink;
  unit: MiningUnitOfMeasure;
  sourceReportIds: string[];
  sourceLineIds: string[];
  trips: number;
  calculatedVolume: number;
  acceptedVolume: number;
  acceptedVolumeSource: MiningOperationalAccountingVolumeSource;
  surveyAdjustedVolume?: number;
  surveyAdjustmentIds: string[];
  finalVolume: number;
  repairHours: number;
};

type MutableMiningOperationalAccountingRow = MiningOperationalAccountingRow & {
  acceptedVolumeSources: Set<Exclude<MiningOperationalAccountingVolumeSource, "mixed">>;
};

export const operationalAccountingAcceptedReportStatuses: MiningShiftReportStatus[] = ["accepted", "closed"];

export const isMiningShiftReportAcceptedForOperationalAccounting = (
  report: Pick<MiningShiftReport, "status">,
): boolean => operationalAccountingAcceptedReportStatuses.includes(report.status);

const roundVolume = (value: number): number => {
  const multiplier = 1000;

  return Math.round(value * multiplier) / multiplier;
};

const normalizeProductionLinkForKey = (productionLink: MiningProductionLink): string => [
  productionLink.excavatorVehicleId,
  ...[...productionLink.haulTruckVehicleIds].sort(),
].join("|");

export const createMiningOperationalAccountingGroupKey = (
  report: Pick<MiningShiftReport, "sectionId" | "reportDate" | "shift">,
  line: Pick<MiningShiftReportLine, "workType" | "productionLink" | "unit">,
): string => [
  report.sectionId,
  report.reportDate,
  report.shift,
  line.workType,
  line.unit,
  normalizeProductionLinkForKey(line.productionLink),
].join(":");

export const getLatestMiningSurveyAdjustmentsByLine = (
  adjustments: readonly MiningSurveyAdjustment[],
): Map<string, MiningSurveyAdjustment> => {
  const latestByLine = new Map<string, MiningSurveyAdjustment>();

  for (const adjustment of adjustments) {
    const current = latestByLine.get(adjustment.sourceReportLineId);
    if (!current || adjustment.version >= current.version) {
      latestByLine.set(adjustment.sourceReportLineId, adjustment);
    }
  }

  return latestByLine;
};

const finalizeAcceptedVolumeSource = (
  sources: Set<Exclude<MiningOperationalAccountingVolumeSource, "mixed">>,
): MiningOperationalAccountingVolumeSource => {
  if (sources.size === 1) {
    return [...sources][0];
  }

  return "mixed";
};

export const createMiningOperationalAccountingRows = (
  reports: readonly MiningShiftReport[],
  lines: readonly MiningShiftReportLine[],
  adjustments: readonly MiningSurveyAdjustment[] = [],
): MiningOperationalAccountingRow[] => {
  const acceptedReportsById = new Map(
    reports
      .filter(isMiningShiftReportAcceptedForOperationalAccounting)
      .map((report) => [report.id, report]),
  );
  const latestAdjustmentsByLine = getLatestMiningSurveyAdjustmentsByLine(adjustments);
  const rowsByKey = new Map<string, MutableMiningOperationalAccountingRow>();

  for (const line of lines) {
    const report = acceptedReportsById.get(line.reportId);
    if (!report) {
      continue;
    }

    const key = createMiningOperationalAccountingGroupKey(report, line);
    const volumeBreakdown = buildMiningShiftReportLineVolumeBreakdown(line);
    const adjustment = latestAdjustmentsByLine.get(line.id);
    const finalLineVolume = adjustment ? adjustment.adjustedVolume : volumeBreakdown.acceptedVolume;
    const current = rowsByKey.get(key);

    if (!current) {
      rowsByKey.set(key, {
        id: `operational-${key}`,
        sectionId: report.sectionId,
        reportDate: report.reportDate,
        shift: report.shift,
        workType: line.workType,
        productionLink: line.productionLink,
        unit: line.unit,
        sourceReportIds: [report.id],
        sourceLineIds: [line.id],
        trips: line.trips,
        calculatedVolume: volumeBreakdown.calculatedVolume,
        acceptedVolume: volumeBreakdown.acceptedVolume,
        acceptedVolumeSource: volumeBreakdown.acceptedVolumeSource,
        acceptedVolumeSources: new Set([volumeBreakdown.acceptedVolumeSource]),
        surveyAdjustedVolume: adjustment ? adjustment.adjustedVolume : undefined,
        surveyAdjustmentIds: adjustment ? [adjustment.id] : [],
        finalVolume: finalLineVolume,
        repairHours: line.repairHours ?? 0,
      });
      continue;
    }

    if (!current.sourceReportIds.includes(report.id)) {
      current.sourceReportIds.push(report.id);
    }
    current.sourceLineIds.push(line.id);
    current.trips += line.trips;
    current.calculatedVolume = roundVolume(current.calculatedVolume + volumeBreakdown.calculatedVolume);
    current.acceptedVolume = roundVolume(current.acceptedVolume + volumeBreakdown.acceptedVolume);
    current.acceptedVolumeSources.add(volumeBreakdown.acceptedVolumeSource);
    current.acceptedVolumeSource = finalizeAcceptedVolumeSource(current.acceptedVolumeSources);
    current.finalVolume = roundVolume(current.finalVolume + finalLineVolume);
    current.repairHours = roundVolume(current.repairHours + (line.repairHours ?? 0));

    if (adjustment) {
      current.surveyAdjustedVolume = roundVolume((current.surveyAdjustedVolume ?? 0) + adjustment.adjustedVolume);
      current.surveyAdjustmentIds.push(adjustment.id);
    }
  }

  return [...rowsByKey.values()]
    .map((row) => ({
      id: row.id,
      sectionId: row.sectionId,
      reportDate: row.reportDate,
      shift: row.shift,
      workType: row.workType,
      productionLink: row.productionLink,
      unit: row.unit,
      sourceReportIds: row.sourceReportIds,
      sourceLineIds: row.sourceLineIds,
      trips: row.trips,
      calculatedVolume: roundVolume(row.calculatedVolume),
      acceptedVolume: roundVolume(row.acceptedVolume),
      acceptedVolumeSource: row.acceptedVolumeSource,
      surveyAdjustedVolume: row.surveyAdjustedVolume,
      surveyAdjustmentIds: row.surveyAdjustmentIds,
      finalVolume: roundVolume(row.finalVolume),
      repairHours: row.repairHours,
    }))
    .sort((left, right) => (
      left.reportDate.localeCompare(right.reportDate)
      || left.sectionId.localeCompare(right.sectionId)
      || left.shift.localeCompare(right.shift)
      || left.workType.localeCompare(right.workType)
      || left.productionLink.excavatorVehicleId.localeCompare(right.productionLink.excavatorVehicleId)
    ));
};
