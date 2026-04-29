import {
  ptoBucketRowRecordKey,
  ptoBucketValueRecordKey,
  ptoDayValueRecordKey,
  ptoManualYearsKey,
  ptoPersistenceRowRecordKey,
  ptoPersistenceStateToRecords,
  ptoUiStateKey,
  ptoYearDateRange,
  type PtoPersistenceState,
} from "../../domain/pto/persistence-shared";
import { DatabaseConflictError } from "../database/conflicts";
import { parseJson, toDateKey, toIsoLike } from "./json";
import { dbRows } from "./pool";
import type {
  PtoBucketRowRecord,
  PtoBucketValueRecord,
  PtoDayValueRecord,
  PtoRowRecord,
  PtoSettingNextRecord,
  PtoSettingRecord,
} from "./pto-records";

const ptoSnapshotConflictMessage = "Данные ПТО уже изменились в базе. Обновите страницу перед повторным сохранением.";

function comparableJson(value: unknown) {
  return JSON.stringify(value ?? null);
}

function mysqlRecordUpdatedAfterExpected(updatedAt: string | null | undefined, expectedUpdatedAt: string | null) {
  if (expectedUpdatedAt === null) return true;

  const normalizedUpdatedAt = toIsoLike(updatedAt);
  const currentTime = normalizedUpdatedAt ? Date.parse(normalizedUpdatedAt) : 0;
  const expectedTime = Date.parse(expectedUpdatedAt);
  return Number.isFinite(currentTime) && Number.isFinite(expectedTime) && currentTime > expectedTime;
}

function mysqlUpdatedAfterExpectedClause(
  expectedUpdatedAt: string | null,
  params: unknown[],
  prefix: "WHERE" | "AND",
) {
  if (expectedUpdatedAt === null) return "";

  const expectedDate = new Date(expectedUpdatedAt);
  if (!Number.isFinite(expectedDate.getTime())) return "";

  params.push(expectedDate);
  return ` ${prefix} updated_at > ?`;
}

function assertFreshMysqlRecordsMatch<CurrentRecord extends { updated_at?: string | null }, NextRecord>(
  currentRecords: CurrentRecord[],
  nextRecords: NextRecord[],
  expectedUpdatedAt: string | null,
  getCurrentKey: (record: CurrentRecord) => string | null,
  getNextKey: (record: NextRecord) => string | null,
  getCurrentComparableValue: (record: CurrentRecord) => string,
  getNextComparableValue: (record: NextRecord) => string,
) {
  const freshCurrentRecords = currentRecords.filter((record) => (
    mysqlRecordUpdatedAfterExpected(record.updated_at, expectedUpdatedAt)
  ));
  if (freshCurrentRecords.length === 0) return;

  const nextRecordsByKey = new Map(
    nextRecords
      .map((record) => [getNextKey(record), getNextComparableValue(record)] as const)
      .filter((entry): entry is [string, string] => Boolean(entry[0])),
  );

  for (const record of freshCurrentRecords) {
    const key = getCurrentKey(record);
    if (!key || nextRecordsByKey.get(key) !== getCurrentComparableValue(record)) {
      throw new DatabaseConflictError(ptoSnapshotConflictMessage);
    }
  }
}

export async function assertMysqlPtoMatchesExpectedUpdatedAt(
  state: PtoPersistenceState,
  expectedUpdatedAt: string | null | undefined,
  options: { yearScope?: string | null } = {},
) {
  if (expectedUpdatedAt === undefined) return;

  const {
    rowRecords,
    dayRecords,
    bucketRowRecords,
    bucketValueRecords,
  } = ptoPersistenceStateToRecords(state);
  const nextSettings: PtoSettingNextRecord[] = [
    { setting_key: ptoManualYearsKey, value: state.manualYears, updated_at: null },
    { setting_key: ptoUiStateKey, value: state.uiState ?? {}, updated_at: null },
  ];
  const yearScope = options.yearScope;
  const rowParams: unknown[] = [];
  const rowQuery = `SELECT * FROM pto_rows${mysqlUpdatedAfterExpectedClause(expectedUpdatedAt, rowParams, "WHERE")}`;
  const dayValueParams: unknown[] = yearScope
    ? [ptoYearDateRange(yearScope).start, ptoYearDateRange(yearScope).end]
    : [];
  const dayValueFreshnessClause = mysqlUpdatedAfterExpectedClause(
    expectedUpdatedAt,
    dayValueParams,
    yearScope ? "AND" : "WHERE",
  );
  const currentDayValueQuery = yearScope
    ? `SELECT * FROM pto_day_values
      WHERE work_date >= ? AND work_date <= ?${dayValueFreshnessClause}`
    : `SELECT * FROM pto_day_values${dayValueFreshnessClause}`;
  const settingParams: unknown[] = [ptoManualYearsKey, ptoUiStateKey];
  const settingQuery = `SELECT * FROM pto_settings WHERE setting_key IN (?, ?)${mysqlUpdatedAfterExpectedClause(expectedUpdatedAt, settingParams, "AND")}`;
  const bucketRowParams: unknown[] = [];
  const bucketRowQuery = `SELECT * FROM pto_bucket_rows${mysqlUpdatedAfterExpectedClause(expectedUpdatedAt, bucketRowParams, "WHERE")}`;
  const bucketValueParams: unknown[] = [];
  const bucketValueQuery = `SELECT * FROM pto_bucket_values${mysqlUpdatedAfterExpectedClause(expectedUpdatedAt, bucketValueParams, "WHERE")}`;
  const includeBuckets = !yearScope;
  const [currentRows, currentDayValues, currentSettings, currentBucketRows, currentBucketValues] = await Promise.all([
    dbRows<PtoRowRecord>(rowQuery, rowParams),
    dbRows<PtoDayValueRecord>(currentDayValueQuery, dayValueParams),
    dbRows<PtoSettingRecord>(settingQuery, settingParams),
    includeBuckets ? dbRows<PtoBucketRowRecord>(bucketRowQuery, bucketRowParams) : Promise.resolve([]),
    includeBuckets ? dbRows<PtoBucketValueRecord>(bucketValueQuery, bucketValueParams) : Promise.resolve([]),
  ]);

  assertFreshMysqlRecordsMatch(
    currentRows,
    rowRecords,
    expectedUpdatedAt,
    ptoPersistenceRowRecordKey,
    ptoPersistenceRowRecordKey,
    (record) => comparableJson([
      record.area ?? "",
      record.location ?? "",
      record.structure ?? "",
      record.customer_code ?? "",
      record.unit ?? "",
      record.status ?? "",
      Number(record.carryover ?? 0),
      parseJson(record.carryovers, record.carryovers ?? {}),
      parseJson(record.carryover_manual_years, record.carryover_manual_years ?? []),
      parseJson(record.years, record.years ?? []),
      Number(record.sort_index ?? 0),
    ]),
    (record) => comparableJson([
      record.area ?? "",
      record.location ?? "",
      record.structure ?? "",
      record.customer_code ?? "",
      record.unit ?? "",
      record.status ?? "",
      Number(record.carryover ?? 0),
      record.carryovers ?? {},
      record.carryover_manual_years ?? [],
      record.years ?? [],
      Number(record.sort_index ?? 0),
    ]),
  );
  assertFreshMysqlRecordsMatch(
    currentDayValues,
    dayRecords,
    expectedUpdatedAt,
    (record) => ptoDayValueRecordKey(record, toDateKey),
    (record) => ptoDayValueRecordKey(record),
    (record) => comparableJson([Number(record.value ?? 0)]),
    (record) => comparableJson([Number(record.value ?? 0)]),
  );
  if (includeBuckets) {
    assertFreshMysqlRecordsMatch(
      currentBucketRows,
      bucketRowRecords,
      expectedUpdatedAt,
      ptoBucketRowRecordKey,
      ptoBucketRowRecordKey,
      (record) => comparableJson([record.area ?? "", record.structure ?? "", record.source ?? "manual", Number(record.sort_index ?? 0)]),
      (record) => comparableJson([record.area ?? "", record.structure ?? "", record.source ?? "manual", Number(record.sort_index ?? 0)]),
    );
    assertFreshMysqlRecordsMatch(
      currentBucketValues,
      bucketValueRecords,
      expectedUpdatedAt,
      ptoBucketValueRecordKey,
      ptoBucketValueRecordKey,
      (record) => comparableJson([Number(record.value ?? 0)]),
      (record) => comparableJson([Number(record.value ?? 0)]),
    );
  }
  assertFreshMysqlRecordsMatch<PtoSettingRecord, PtoSettingNextRecord>(
    currentSettings,
    nextSettings,
    expectedUpdatedAt,
    (record) => record.setting_key,
    (record) => record.setting_key,
    (record) => comparableJson(parseJson(record.value, record.value)),
    (record) => comparableJson(record.value),
  );
}
