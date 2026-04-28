import type { DataPtoState } from "../../lib/data/pto";
import { normalizePtoBucketManualRows } from "../../lib/domain/pto/buckets";
import { normalizePtoPlanRow, normalizeStoredPtoYears } from "../../lib/domain/pto/date-table";
import { isRecord, normalizeDecimalRecord, normalizeNumberRecord, normalizeStringRecord } from "../../lib/utils/normalizers";
import type {
  CreatePtoDatabaseStateOptions,
  NormalizedPtoDatabaseLoadState,
  PtoDatabaseState,
} from "./ptoPersistenceTypes";

function normalizeExpandedPtoMonths(
  databaseUiState: NonNullable<DataPtoState["uiState"]>,
  fallbackUiState: NonNullable<DataPtoState["uiState"]>,
) {
  return isRecord(databaseUiState.expandedPtoMonths)
    ? Object.fromEntries(
      Object.entries(databaseUiState.expandedPtoMonths).filter(
        (entry): entry is [string, boolean] => typeof entry[0] === "string" && typeof entry[1] === "boolean",
      ),
    )
    : fallbackUiState.expandedPtoMonths ?? {};
}

function normalizeReportFallbackState(
  databaseUiState: NonNullable<DataPtoState["uiState"]>,
  fallbackUiState: NonNullable<DataPtoState["uiState"]>,
) {
  const currentReportColumnWidths = normalizeNumberRecord(fallbackUiState.reportColumnWidths, 42, 520);
  const legacyReportColumnWidths = normalizeNumberRecord(databaseUiState.reportColumnWidths, 42, 520);
  const reportColumnWidths = Object.keys(currentReportColumnWidths).length > 0
    ? currentReportColumnWidths
    : legacyReportColumnWidths;
  const currentReportReasons = normalizeStringRecord(fallbackUiState.reportReasons);
  const legacyReportReasons = normalizeStringRecord(databaseUiState.reportReasons);
  const reportReasons = Object.keys(currentReportReasons).length > 0
    ? currentReportReasons
    : legacyReportReasons;

  return {
    reportColumnWidths,
    reportReasons,
  };
}

export function createPtoDatabaseState({
  manualYears,
  planRows,
  operRows,
  surveyRows,
  bucketValues,
  bucketRows,
  uiState,
}: CreatePtoDatabaseStateOptions): PtoDatabaseState {
  return {
    manualYears,
    planRows,
    operRows,
    surveyRows,
    bucketValues,
    bucketRows,
    uiState,
  };
}

export function normalizeLoadedPtoDatabaseState(
  databaseState: DataPtoState,
  fallbackState: PtoDatabaseState,
  options: {
    preserveFallbackBuckets?: boolean;
  } = {},
): NormalizedPtoDatabaseLoadState {
  const nextUiState = databaseState.uiState ?? {};
  const fallbackUiState = fallbackState.uiState;
  const expandedPtoMonths = normalizeExpandedPtoMonths(nextUiState, fallbackUiState);
  const manualYears = normalizeStoredPtoYears(databaseState.manualYears);
  const planRows = databaseState.planRows.map((row) => normalizePtoPlanRow(row));
  const operRows = databaseState.operRows.map((row) => normalizePtoPlanRow(row));
  const surveyRows = databaseState.surveyRows.map((row) => normalizePtoPlanRow(row));
  const bucketValues = options.preserveFallbackBuckets
    ? fallbackState.bucketValues ?? {}
    : normalizeDecimalRecord(databaseState.bucketValues, 0, 100000);
  const bucketRows = options.preserveFallbackBuckets
    ? fallbackState.bucketRows ?? []
    : normalizePtoBucketManualRows(databaseState.bucketRows);
  const reportFallbackState = normalizeReportFallbackState(nextUiState, fallbackUiState);
  const uiState = {
    ptoTab: typeof nextUiState.ptoTab === "string" ? nextUiState.ptoTab : fallbackUiState.ptoTab,
    ptoPlanYear: typeof nextUiState.ptoPlanYear === "string" ? nextUiState.ptoPlanYear : fallbackUiState.ptoPlanYear,
    ptoAreaFilter: typeof nextUiState.ptoAreaFilter === "string" ? nextUiState.ptoAreaFilter : fallbackUiState.ptoAreaFilter,
    expandedPtoMonths,
    ptoColumnWidths: normalizeNumberRecord(nextUiState.ptoColumnWidths ?? fallbackUiState.ptoColumnWidths, 44, 800),
    ptoRowHeights: normalizeNumberRecord(nextUiState.ptoRowHeights ?? fallbackUiState.ptoRowHeights, 28, 180),
    ptoHeaderLabels: normalizeStringRecord(nextUiState.ptoHeaderLabels ?? fallbackUiState.ptoHeaderLabels),
  };
  const snapshotState = createPtoDatabaseState({
    manualYears,
    planRows,
    operRows,
    surveyRows,
    bucketValues,
    bucketRows,
    uiState: {
      ...uiState,
      ...reportFallbackState,
    },
  });

  return {
    manualYears,
    planRows,
    operRows,
    surveyRows,
    bucketValues,
    bucketRows,
    uiState,
    reportFallbackState,
    snapshotState,
  };
}
