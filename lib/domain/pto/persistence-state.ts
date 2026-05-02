import {
  ptoManualYearsKey,
  ptoUiStateKey,
  type PtoPersistenceLoadRecordGroups,
  type PtoPersistenceState,
  type PtoPersistenceStateFromRecordsOptions,
} from "./persistence-types";
import {
  ptoBucketRowsFromRecords,
  ptoBucketRowsToRecords,
  ptoBucketValuesFromRecords,
  ptoBucketValuesToRecords,
} from "./persistence-buckets";
import { ptoRowsByTables, ptoRowsToDayRecords, ptoRowsToRecords } from "./persistence-rows";
import { asObjectRecord, asStringArray, latestPtoUpdatedAt } from "./persistence-values";

function dateBelongsToYear(dateKey: string, year: string) {
  return dateKey.startsWith(`${year}-`);
}

function objectHasYearValue(values: Record<string, unknown> | undefined, year: string) {
  return Boolean(values && Object.prototype.hasOwnProperty.call(values, year));
}

function ptoRowBelongsToYear(row: PtoPersistenceState["planRows"][number], year: string) {
  return Object.keys(row.dailyPlans ?? {}).some((dateKey) => dateBelongsToYear(dateKey, year))
    || (row.years ?? []).includes(year)
    || (row.carryoverManualYears ?? []).includes(year)
    || objectHasYearValue(row.carryovers, year);
}

function scopePtoRowsForYear(rows: PtoPersistenceState["planRows"], year: string) {
  return rows
    .filter((row) => ptoRowBelongsToYear(row, year))
    .map((row) => ({
      ...row,
      dailyPlans: Object.fromEntries(
        Object.entries(row.dailyPlans ?? {}).filter(([dateKey]) => dateBelongsToYear(dateKey, year)),
      ),
      years: (row.years ?? []).filter((item) => item === year),
      carryoverManualYears: (row.carryoverManualYears ?? []).filter((item) => item === year),
      carryovers: Object.fromEntries(
        Object.entries(row.carryovers ?? {}).filter(([item]) => item === year),
      ),
    }));
}

export function ptoPersistenceLoadIsEmpty<SettingRecord extends { updated_at?: string | null }>(
  groups: PtoPersistenceLoadRecordGroups<SettingRecord>,
) {
  return groups.rowRecords.length === 0
    && groups.dayValueRecords.length === 0
    && groups.settingRecords.length === 0
    && groups.bucketRowRecords.length === 0
    && groups.bucketValueRecords.length === 0;
}

export function ptoStateFromPersistenceRecords<SettingRecord extends { updated_at?: string | null }>({
  rowRecords,
  dayValueRecords,
  settingRecords,
  bucketRowRecords,
  bucketValueRecords,
  getSettingKey,
  getSettingValue,
  normalizeDate,
  normalizeUpdatedAt,
  parseStoredValue,
}: PtoPersistenceStateFromRecordsOptions<SettingRecord>): PtoPersistenceState | null {
  const groups = {
    rowRecords,
    dayValueRecords,
    settingRecords,
    bucketRowRecords,
    bucketValueRecords,
  };

  if (ptoPersistenceLoadIsEmpty(groups)) return null;

  const settingsByKey = new Map(settingRecords.map((setting) => [getSettingKey(setting), getSettingValue(setting)]));
  const rowOptions = { normalizeDate, parseStoredValue };
  const rowsByTable = ptoRowsByTables(rowRecords, dayValueRecords, rowOptions);

  return {
    updatedAt: latestPtoUpdatedAt(
      [rowRecords, dayValueRecords, settingRecords, bucketRowRecords, bucketValueRecords],
      normalizeUpdatedAt,
    ),
    manualYears: asStringArray(settingsByKey.get(ptoManualYearsKey)),
    planRows: rowsByTable.planRows,
    operRows: rowsByTable.operRows,
    surveyRows: rowsByTable.surveyRows,
    bucketValues: ptoBucketValuesFromRecords(bucketValueRecords),
    bucketRows: ptoBucketRowsFromRecords(bucketRowRecords),
    uiState: asObjectRecord(settingsByKey.get(ptoUiStateKey)) as PtoPersistenceState["uiState"],
  };
}

export function ptoPersistenceStateToRecords(state: PtoPersistenceState) {
  const planRows = Array.isArray(state.planRows) ? state.planRows : [];
  const operRows = Array.isArray(state.operRows) ? state.operRows : [];
  const surveyRows = Array.isArray(state.surveyRows) ? state.surveyRows : [];

  return {
    planRows,
    operRows,
    surveyRows,
    rowRecords: [
      ...ptoRowsToRecords("plan", planRows),
      ...ptoRowsToRecords("oper", operRows),
      ...ptoRowsToRecords("survey", surveyRows),
    ],
    dayRecords: [
      ...ptoRowsToDayRecords("plan", planRows),
      ...ptoRowsToDayRecords("oper", operRows),
      ...ptoRowsToDayRecords("survey", surveyRows),
    ],
    bucketRowRecords: ptoBucketRowsToRecords(state.bucketRows ?? []),
    bucketValueRecords: ptoBucketValuesToRecords(state.bucketValues ?? {}),
  };
}

export function scopePtoStateForYear(state: PtoPersistenceState, year: string): PtoPersistenceState {
  return {
    ...state,
    planRows: scopePtoRowsForYear(state.planRows, year),
    operRows: scopePtoRowsForYear(state.operRows, year),
    surveyRows: scopePtoRowsForYear(state.surveyRows, year),
    bucketRows: [],
    bucketValues: {},
  };
}
