import { normalizePtoBucketManualRows } from "@/lib/domain/pto/buckets";
import { normalizePtoPlanRow, normalizeStoredPtoYears } from "@/lib/domain/pto/date-table";
import { adminStorageKeys } from "@/lib/storage/keys";
import { isRecord, normalizeDecimalRecord, normalizeNumberRecord, normalizeStringRecord } from "@/lib/utils/normalizers";

type InitialPtoStateInput = {
  savedPtoYears: unknown;
  savedPtoPlanRows: unknown;
  savedPtoSurveyRows: unknown;
  savedPtoOperRows: unknown;
  savedPtoColumnWidths: unknown;
  savedPtoRowHeights: unknown;
  savedPtoHeaderLabels: unknown;
  savedPtoBucketValues: unknown;
  savedPtoBucketRows: unknown;
};

export function buildInitialPtoState(storedState: InitialPtoStateInput) {
  const hasSavedPtoState = Boolean(
    storedState.savedPtoYears
    || Array.isArray(storedState.savedPtoPlanRows)
    || Array.isArray(storedState.savedPtoSurveyRows)
    || Array.isArray(storedState.savedPtoOperRows)
    || storedState.savedPtoColumnWidths
    || storedState.savedPtoRowHeights
    || storedState.savedPtoHeaderLabels
    || storedState.savedPtoBucketValues
    || storedState.savedPtoBucketRows,
  );

  if (hasSavedPtoState && !window.localStorage.getItem(adminStorageKeys.ptoLocalUpdatedAt)) {
    window.localStorage.setItem(adminStorageKeys.ptoLocalUpdatedAt, new Date().toISOString());
  }

  return {
    hasSavedPtoState,
    manualYears: storedState.savedPtoYears
      ? normalizeStoredPtoYears(storedState.savedPtoYears)
      : null,
    planRows: Array.isArray(storedState.savedPtoPlanRows)
      ? storedState.savedPtoPlanRows.map((row) => normalizePtoPlanRow(isRecord(row) ? row : {}))
      : null,
    surveyRows: Array.isArray(storedState.savedPtoSurveyRows)
      ? storedState.savedPtoSurveyRows.map((row) => normalizePtoPlanRow(isRecord(row) ? row : {}))
      : null,
    operRows: Array.isArray(storedState.savedPtoOperRows)
      ? storedState.savedPtoOperRows.map((row) => normalizePtoPlanRow(isRecord(row) ? row : {}))
      : null,
    columnWidths: normalizeNumberRecord(storedState.savedPtoColumnWidths, 44, 800),
    rowHeights: normalizeNumberRecord(storedState.savedPtoRowHeights, 28, 180),
    headerLabels: normalizeStringRecord(storedState.savedPtoHeaderLabels),
    bucketValues: normalizeDecimalRecord(storedState.savedPtoBucketValues, 0, 100000),
    bucketRows: normalizePtoBucketManualRows(storedState.savedPtoBucketRows),
  };
}

export type InitialPtoState = ReturnType<typeof buildInitialPtoState>;
