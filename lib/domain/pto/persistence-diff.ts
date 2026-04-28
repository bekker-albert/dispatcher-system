import type {
  PtoPersistenceBucketRowRecord,
  PtoPersistenceBucketValueRecord,
  PtoPersistenceDayValueRecord,
  PtoPersistenceRowRecord,
} from "./persistence-types";
import {
  ptoBucketRowRecordKey,
  ptoBucketValueRecordKey,
  ptoDayValueRecordKey,
  ptoPersistenceRowRecordKey,
} from "./persistence-keys";

export function ptoMissingRowRecords(
  currentRecords: PtoPersistenceRowRecord[],
  nextRecords: PtoPersistenceRowRecord[],
) {
  const nextKeys = new Set(nextRecords.map(ptoPersistenceRowRecordKey));
  return currentRecords.filter((record) => !nextKeys.has(ptoPersistenceRowRecordKey(record)));
}

export function ptoMissingDayValueRecords(
  currentRecords: PtoPersistenceDayValueRecord[],
  nextRecords: PtoPersistenceDayValueRecord[],
  normalizeDate?: (value: string) => string | null,
) {
  const nextKeys = new Set(
    nextRecords
      .map((record) => ptoDayValueRecordKey(record, normalizeDate))
      .filter((key): key is string => Boolean(key)),
  );
  return currentRecords.filter((record) => {
    const key = ptoDayValueRecordKey(record, normalizeDate);
    return key ? !nextKeys.has(key) : false;
  });
}

export function ptoMissingBucketRowRecords(
  currentRecords: PtoPersistenceBucketRowRecord[],
  nextRecords: PtoPersistenceBucketRowRecord[],
) {
  const nextKeys = new Set(nextRecords.map(ptoBucketRowRecordKey));
  return currentRecords.filter((record) => !nextKeys.has(ptoBucketRowRecordKey(record)));
}

export function ptoMissingBucketValueRecords(
  currentRecords: PtoPersistenceBucketValueRecord[],
  nextRecords: PtoPersistenceBucketValueRecord[],
) {
  const nextKeys = new Set(nextRecords.map(ptoBucketValueRecordKey));
  return currentRecords.filter((record) => !nextKeys.has(ptoBucketValueRecordKey(record)));
}
