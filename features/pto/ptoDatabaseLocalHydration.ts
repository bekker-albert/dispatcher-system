"use client";

import { hasInitialStoredPtoState, readInitialStoredPtoState } from "@/features/app/initialAppStorage";
import { applyInitialPtoState } from "@/features/pto/applyInitialPtoState";
import { buildInitialPtoState } from "@/features/pto/initialPtoState";
import { createPtoDatabaseState, type PtoDatabaseState } from "@/features/pto/ptoPersistenceModel";
import type { PtoDatabaseLoadOptions } from "@/features/pto/ptoDatabaseLoadTypes";

type PtoDatabaseLocalHydrationOptions = Pick<
  PtoDatabaseLoadOptions,
  | "hasStoredPtoStateRef"
  | "ptoDatabaseStateRef"
  | "setPtoBucketManualRows"
  | "setPtoBucketValues"
  | "setPtoColumnWidths"
  | "setPtoHeaderLabels"
  | "setPtoManualYears"
  | "setPtoOperRows"
  | "setPtoPlanRows"
  | "setPtoRowHeights"
  | "setPtoSurveyRows"
>;

export function createPtoDatabaseLocalHydration(options: PtoDatabaseLocalHydrationOptions) {
  let localPtoStateForResolution = options.ptoDatabaseStateRef.current;
  let localPtoHydrated = false;

  const hydrateInitialLocalPtoState = () => {
    if (localPtoHydrated) return localPtoStateForResolution;
    localPtoHydrated = true;

    if (!hasInitialStoredPtoState()) {
      options.hasStoredPtoStateRef.current = false;
      return localPtoStateForResolution;
    }

    const localInitialPtoState = buildInitialPtoState(readInitialStoredPtoState());
    if (!localInitialPtoState.hasSavedPtoState) {
      options.hasStoredPtoStateRef.current = false;
      return localPtoStateForResolution;
    }

    const currentState = options.ptoDatabaseStateRef.current;
    const nextLocalPtoState = createPtoDatabaseState({
      manualYears: localInitialPtoState.manualYears ?? currentState.manualYears,
      planRows: localInitialPtoState.planRows ?? currentState.planRows,
      operRows: localInitialPtoState.operRows ?? currentState.operRows,
      surveyRows: localInitialPtoState.surveyRows ?? currentState.surveyRows,
      bucketValues: localInitialPtoState.bucketValues,
      bucketRows: localInitialPtoState.bucketRows,
      uiState: {
        ...currentState.uiState,
        ptoColumnWidths: localInitialPtoState.columnWidths,
        ptoRowHeights: localInitialPtoState.rowHeights,
        ptoHeaderLabels: localInitialPtoState.headerLabels,
      },
    });

    localPtoStateForResolution = nextLocalPtoState;
    options.ptoDatabaseStateRef.current = nextLocalPtoState;
    applyInitialPtoState(localInitialPtoState, {
      hasStoredPtoStateRef: options.hasStoredPtoStateRef,
      setPtoManualYears: options.setPtoManualYears,
      setPtoPlanRows: options.setPtoPlanRows,
      setPtoSurveyRows: options.setPtoSurveyRows,
      setPtoOperRows: options.setPtoOperRows,
      setPtoColumnWidths: options.setPtoColumnWidths,
      setPtoRowHeights: options.setPtoRowHeights,
      setPtoHeaderLabels: options.setPtoHeaderLabels,
      setPtoBucketValues: options.setPtoBucketValues,
      setPtoBucketManualRows: options.setPtoBucketManualRows,
    });

    return nextLocalPtoState;
  };

  return {
    getLocalPtoStateForResolution: (): PtoDatabaseState => localPtoStateForResolution,
    hydrateInitialLocalPtoState,
  };
}
