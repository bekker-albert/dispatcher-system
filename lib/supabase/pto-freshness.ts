import {
  latestPtoUpdatedAt,
  ptoBucketRowRecordKey,
  ptoBucketValueRecordKey,
  ptoDayValueRecordKey,
  ptoPersistenceRowRecordKey,
} from "../domain/pto/persistence-shared";
import { ptoSupabaseStateToRecords } from "./pto-records";
import {
  loadCurrentSupabaseBucketRows,
  loadCurrentSupabaseBucketValues,
  loadCurrentSupabaseDayValues,
  loadCurrentSupabaseRows,
  loadCurrentSupabaseSettings,
} from "./pto-storage-load";
import type { SupabasePtoClient } from "./pto-schema";
import type { SupabasePtoState } from "./pto-types";

const ptoSnapshotConflictMessage = "PTO data changed in database. Reload before saving the full snapshot.";
const ptoInlineConflictMessage = "PTO data changed in database. Reload before saving inline edits.";

function comparableJson(value: unknown) {
  return JSON.stringify(value ?? null);
}

function updatedAfterExpected(updatedAt: string | null | undefined, expectedUpdatedAt: string | null) {
  if (expectedUpdatedAt === null) return true;

  const currentTime = updatedAt ? Date.parse(updatedAt) : 0;
  const expectedTime = Date.parse(expectedUpdatedAt);
  return Number.isFinite(currentTime) && Number.isFinite(expectedTime) && currentTime > expectedTime;
}

function assertFreshRecordsMatch<RecordType extends { updated_at?: string | null }>(
  currentRecords: RecordType[],
  nextRecords: RecordType[],
  expectedUpdatedAt: string | null,
  getKey: (record: RecordType) => string | null,
  getComparableValue: (record: RecordType) => string,
) {
  const nextRecordsByKey = new Map(
    nextRecords
      .map((record) => [getKey(record), getComparableValue(record)] as const)
      .filter((entry): entry is [string, string] => Boolean(entry[0])),
  );

  for (const record of currentRecords) {
    if (!updatedAfterExpected(record.updated_at, expectedUpdatedAt)) continue;

    const key = getKey(record);
    if (!key || nextRecordsByKey.get(key) !== getComparableValue(record)) {
      throw new Error(ptoSnapshotConflictMessage);
    }
  }
}

export async function assertSupabasePtoMatchesExpectedUpdatedAt(
  state: SupabasePtoState,
  expectedUpdatedAt: string | null | undefined,
  client: SupabasePtoClient,
  options: { yearScope?: string | null } = {},
) {
  if (expectedUpdatedAt === undefined) return;

  const {
    rowRecords,
    dayRecords,
    bucketRowRecords,
    bucketValueRecords,
    settingRecords,
  } = ptoSupabaseStateToRecords(state);
  const includeBuckets = !options.yearScope;

  const [currentRows, currentDayValues, currentBucketRows, currentBucketValues, currentSettings] = await Promise.all([
    loadCurrentSupabaseRows(client),
    loadCurrentSupabaseDayValues(client, { yearScope: options.yearScope }),
    includeBuckets ? loadCurrentSupabaseBucketRows(client) : Promise.resolve([]),
    includeBuckets ? loadCurrentSupabaseBucketValues(client) : Promise.resolve([]),
    loadCurrentSupabaseSettings(client),
  ]);

  assertFreshRecordsMatch(currentRows, rowRecords, expectedUpdatedAt, ptoPersistenceRowRecordKey, (record) =>
    comparableJson([
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
    ])
  );
  assertFreshRecordsMatch(currentDayValues, dayRecords, expectedUpdatedAt, ptoDayValueRecordKey, (record) =>
    comparableJson([Number(record.value ?? 0)])
  );
  if (includeBuckets) {
    assertFreshRecordsMatch(currentBucketRows, bucketRowRecords, expectedUpdatedAt, ptoBucketRowRecordKey, (record) =>
      comparableJson([record.area ?? "", record.structure ?? "", record.source ?? "manual", Number(record.sort_index ?? 0)])
    );
    assertFreshRecordsMatch(currentBucketValues, bucketValueRecords, expectedUpdatedAt, ptoBucketValueRecordKey, (record) =>
      comparableJson([Number(record.value ?? 0)])
    );
  }
  assertFreshRecordsMatch(currentSettings, settingRecords, expectedUpdatedAt, (record) => record.key, (record) =>
    comparableJson(record.value)
  );
}

export async function assertSupabasePtoInlineMatchesExpectedUpdatedAt(
  expectedUpdatedAt: string | null | undefined,
  client: SupabasePtoClient,
) {
  if (expectedUpdatedAt === undefined) return;
  const currentUpdatedAt = await loadSupabasePtoCurrentUpdatedAt(client);

  if (!currentUpdatedAt) return;
  if (!expectedUpdatedAt || updatedAfterExpected(currentUpdatedAt, expectedUpdatedAt)) {
    throw new Error(ptoInlineConflictMessage);
  }
}

export async function loadSupabasePtoCurrentUpdatedAt(client: SupabasePtoClient) {
  const [currentRows, currentDayValues, currentBucketRows, currentBucketValues, currentSettings] = await Promise.all([
    loadCurrentSupabaseRows(client),
    loadCurrentSupabaseDayValues(client),
    loadCurrentSupabaseBucketRows(client),
    loadCurrentSupabaseBucketValues(client),
    loadCurrentSupabaseSettings(client),
  ]);
  const currentUpdatedAt = latestPtoUpdatedAt([
    currentRows,
    currentDayValues,
    currentBucketRows,
    currentBucketValues,
    currentSettings,
  ]);
  return currentUpdatedAt;
}
