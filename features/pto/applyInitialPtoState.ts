import type { Dispatch, SetStateAction } from "react";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { InitialPtoState } from "@/features/pto/initialPtoState";

type MutableRef<T> = {
  current: T;
};

export type InitialPtoStateSetters = {
  hasStoredPtoStateRef: MutableRef<boolean>;
  setPtoManualYears: Dispatch<SetStateAction<string[]>>;
  setPtoPlanRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoSurveyRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoOperRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoColumnWidths: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoRowHeights: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoHeaderLabels: Dispatch<SetStateAction<Record<string, string>>>;
  setPtoBucketValues: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoBucketManualRows: Dispatch<SetStateAction<PtoBucketRow[]>>;
};

export function applyInitialPtoState(state: InitialPtoState, setters: InitialPtoStateSetters) {
  setters.hasStoredPtoStateRef.current = state.hasSavedPtoState;

  if (state.manualYears) {
    setters.setPtoManualYears(state.manualYears);
  }

  if (state.planRows) {
    setters.setPtoPlanRows(state.planRows);
  }

  if (state.surveyRows) {
    setters.setPtoSurveyRows(state.surveyRows);
  }

  if (state.operRows) {
    setters.setPtoOperRows(state.operRows);
  }

  setters.setPtoColumnWidths(state.columnWidths);
  setters.setPtoRowHeights(state.rowHeights);
  setters.setPtoHeaderLabels(state.headerLabels);
  setters.setPtoBucketValues(state.bucketValues);
  setters.setPtoBucketManualRows(state.bucketRows);
}
