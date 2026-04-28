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
import { ptoRowsByTable, ptoRowsToDayRecords, ptoRowsToRecords } from "./persistence-rows";
import { asObjectRecord, asStringArray, latestPtoUpdatedAt } from "./persistence-values";

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

  return {
    updatedAt: latestPtoUpdatedAt(
      [rowRecords, dayValueRecords, settingRecords, bucketRowRecords, bucketValueRecords],
      normalizeUpdatedAt,
    ),
    manualYears: asStringArray(settingsByKey.get(ptoManualYearsKey)),
    planRows: ptoRowsByTable(rowRecords, dayValueRecords, "plan", rowOptions),
    operRows: ptoRowsByTable(rowRecords, dayValueRecords, "oper", rowOptions),
    surveyRows: ptoRowsByTable(rowRecords, dayValueRecords, "survey", rowOptions),
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
