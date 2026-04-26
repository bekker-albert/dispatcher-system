import type { DataPtoState } from "@/lib/data/pto";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import { adminStorageKeys } from "@/lib/storage/keys";

export type CreatePtoDatabaseStateOptions = {
  manualYears: string[];
  planRows: PtoPlanRow[];
  operRows: PtoPlanRow[];
  surveyRows: PtoPlanRow[];
  bucketValues: Record<string, number>;
  bucketRows: PtoBucketRow[];
  uiState: NonNullable<DataPtoState["uiState"]>;
};

export type PtoDatabaseState = DataPtoState & {
  uiState: NonNullable<DataPtoState["uiState"]>;
};

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

export function savePtoStateToBrowserStorage(state: DataPtoState, markLocalUpdatedAt: boolean) {
  const uiState = state.uiState ?? {};

  window.localStorage.setItem(adminStorageKeys.ptoYears, JSON.stringify(state.manualYears));
  window.localStorage.setItem(adminStorageKeys.ptoPlanRows, JSON.stringify(state.planRows));
  window.localStorage.setItem(adminStorageKeys.ptoSurveyRows, JSON.stringify(state.surveyRows));
  window.localStorage.setItem(adminStorageKeys.ptoOperRows, JSON.stringify(state.operRows));
  window.localStorage.setItem(adminStorageKeys.ptoColumnWidths, JSON.stringify(uiState.ptoColumnWidths ?? {}));
  window.localStorage.setItem(adminStorageKeys.ptoRowHeights, JSON.stringify(uiState.ptoRowHeights ?? {}));
  window.localStorage.setItem(adminStorageKeys.ptoHeaderLabels, JSON.stringify(uiState.ptoHeaderLabels ?? {}));
  window.localStorage.setItem(adminStorageKeys.ptoBucketValues, JSON.stringify(state.bucketValues ?? {}));
  window.localStorage.setItem(adminStorageKeys.ptoBucketRows, JSON.stringify(state.bucketRows ?? []));

  if (markLocalUpdatedAt) {
    window.localStorage.setItem(adminStorageKeys.ptoLocalUpdatedAt, new Date().toISOString());
  }
  window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
}
