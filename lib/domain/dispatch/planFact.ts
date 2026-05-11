import type { MiningOperationalAccountingRow } from "./operationalAccounting";
import type {
  MiningPlanVersion,
  MiningProductionLink,
  MiningShift,
  MiningUnitOfMeasure,
} from "./service-contracts";

export type MiningPlanTargetLine = {
  id: string;
  planVersionId: string;
  sectionId: string;
  planDate: string;
  shift: MiningShift;
  workType: string;
  productionLink: MiningProductionLink;
  unit: MiningUnitOfMeasure;
  plannedVolume: number;
};

export type MiningPlanFactStatus =
  | "behind_plan"
  | "on_plan"
  | "over_plan"
  | "missing_fact"
  | "unplanned_fact";

export type MiningPlanFactRow = {
  id: string;
  planVersionId?: string;
  planTargetLineId?: string;
  sectionId: string;
  reportDate: string;
  shift: MiningShift;
  workType: string;
  productionLink: MiningProductionLink;
  unit: MiningUnitOfMeasure;
  plannedVolume: number;
  actualVolume: number;
  deltaVolume: number;
  completionPercent?: number;
  status: MiningPlanFactStatus;
  sourceOperationalRowIds: string[];
};

export const miningPlanFactPlanStatuses: Array<MiningPlanVersion["status"]> = ["approved", "closed"];

export const isMiningPlanVersionUsableForPlanFact = (
  planVersion: Pick<MiningPlanVersion, "status">,
): boolean => miningPlanFactPlanStatuses.includes(planVersion.status);

const roundVolume = (value: number): number => {
  const multiplier = 1000;

  return Math.round(value * multiplier) / multiplier;
};

const normalizeProductionLinkForKey = (productionLink: MiningProductionLink): string => [
  productionLink.excavatorVehicleId,
  ...[...productionLink.haulTruckVehicleIds].sort(),
].join("|");

export const createMiningPlanFactKey = (
  row: Pick<MiningPlanFactRow, "sectionId" | "reportDate" | "shift" | "workType" | "productionLink" | "unit">,
): string => [
  row.sectionId,
  row.reportDate,
  row.shift,
  row.workType,
  row.unit,
  normalizeProductionLinkForKey(row.productionLink),
].join(":");

const getPlanFactStatus = (
  plannedVolume: number,
  actualVolume: number,
  toleranceVolume: number,
  hasPlan: boolean,
): MiningPlanFactStatus => {
  if (!hasPlan) {
    return "unplanned_fact";
  }

  if (actualVolume <= 0 && plannedVolume > 0) {
    return "missing_fact";
  }

  const delta = actualVolume - plannedVolume;
  if (Math.abs(delta) <= toleranceVolume) {
    return "on_plan";
  }

  return delta < 0 ? "behind_plan" : "over_plan";
};

export const createMiningPlanFactRows = (
  planVersions: readonly MiningPlanVersion[],
  planTargets: readonly MiningPlanTargetLine[],
  operationalRows: readonly MiningOperationalAccountingRow[],
  toleranceVolume = 0,
): MiningPlanFactRow[] => {
  const usablePlanVersionIds = new Set(
    planVersions
      .filter(isMiningPlanVersionUsableForPlanFact)
      .map((planVersion) => planVersion.id),
  );
  const factRowsByKey = new Map<string, { actualVolume: number; sourceOperationalRowIds: string[] }>();

  for (const row of operationalRows) {
    const key = createMiningPlanFactKey({
      sectionId: row.sectionId,
      reportDate: row.reportDate,
      shift: row.shift,
      workType: row.workType,
      productionLink: row.productionLink,
      unit: row.unit,
    });
    const current = factRowsByKey.get(key);

    if (!current) {
      factRowsByKey.set(key, {
        actualVolume: row.finalVolume,
        sourceOperationalRowIds: [row.id],
      });
      continue;
    }

    current.actualVolume = roundVolume(current.actualVolume + row.finalVolume);
    current.sourceOperationalRowIds.push(row.id);
  }

  const resultRows: MiningPlanFactRow[] = [];
  const plannedKeys = new Set<string>();

  for (const target of planTargets) {
    if (!usablePlanVersionIds.has(target.planVersionId)) {
      continue;
    }

    const key = createMiningPlanFactKey({
      sectionId: target.sectionId,
      reportDate: target.planDate,
      shift: target.shift,
      workType: target.workType,
      productionLink: target.productionLink,
      unit: target.unit,
    });
    const fact = factRowsByKey.get(key);
    const actualVolume = fact?.actualVolume ?? 0;
    const plannedVolume = roundVolume(target.plannedVolume);
    const deltaVolume = roundVolume(actualVolume - plannedVolume);

    plannedKeys.add(key);
    resultRows.push({
      id: `plan-fact-${key}`,
      planVersionId: target.planVersionId,
      planTargetLineId: target.id,
      sectionId: target.sectionId,
      reportDate: target.planDate,
      shift: target.shift,
      workType: target.workType,
      productionLink: target.productionLink,
      unit: target.unit,
      plannedVolume,
      actualVolume,
      deltaVolume,
      completionPercent: plannedVolume > 0 ? roundVolume((actualVolume / plannedVolume) * 100) : undefined,
      status: getPlanFactStatus(plannedVolume, actualVolume, toleranceVolume, true),
      sourceOperationalRowIds: fact?.sourceOperationalRowIds ?? [],
    });
  }

  for (const [key, fact] of factRowsByKey.entries()) {
    if (plannedKeys.has(key)) {
      continue;
    }

    const [sectionId, reportDate, shift, workType, unit, productionLinkKey] = key.split(":");
    const [excavatorVehicleId, ...haulTruckVehicleIds] = productionLinkKey.split("|");
    const actualVolume = roundVolume(fact.actualVolume);

    resultRows.push({
      id: `plan-fact-${key}`,
      sectionId,
      reportDate,
      shift: shift as MiningShift,
      workType,
      productionLink: {
        excavatorVehicleId,
        haulTruckVehicleIds,
      },
      unit: unit as MiningUnitOfMeasure,
      plannedVolume: 0,
      actualVolume,
      deltaVolume: actualVolume,
      status: getPlanFactStatus(0, actualVolume, toleranceVolume, false),
      sourceOperationalRowIds: fact.sourceOperationalRowIds,
    });
  }

  return resultRows.sort((left, right) => (
    left.reportDate.localeCompare(right.reportDate)
    || left.sectionId.localeCompare(right.sectionId)
    || left.shift.localeCompare(right.shift)
    || left.workType.localeCompare(right.workType)
    || left.productionLink.excavatorVehicleId.localeCompare(right.productionLink.excavatorVehicleId)
  ));
};
