"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";

import { usePtoDatabaseLoad } from "@/features/pto/usePtoDatabaseLoad";
import { usePtoDatabaseSave } from "@/features/pto/usePtoDatabaseSave";
import { usePtoDatabaseState } from "@/features/pto/usePtoDatabaseState";
import { usePtoLocalPersistence } from "@/features/pto/usePtoLocalPersistence";
import { useSyncedRef } from "@/features/app/useSyncedRef";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

type MutableRef<T> = {
  current: T;
};

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

type UseAppPtoPersistenceOptions = {
  adminDataLoaded: boolean;
  ptoSaveRevision: number;
  ptoManualYears: string[];
  ptoPlanRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
  ptoBucketValues: Record<string, number>;
  ptoBucketManualRows: PtoBucketRow[];
  ptoTab: string;
  ptoPlanYear: string;
  ptoAreaFilter: string;
  expandedPtoMonths: Record<string, boolean>;
  reportColumnWidths: Record<string, number>;
  reportReasons: Record<string, string>;
  ptoColumnWidths: Record<string, number>;
  ptoRowHeights: Record<string, number>;
  ptoHeaderLabels: Record<string, string>;
  ptoDatabaseLoadedRef: RefObject<boolean>;
  hasStoredPtoStateRef: MutableRef<boolean>;
  requestClientSnapshotSave: (reason?: string) => void;
  resetUndoHistoryForExternalRestore: () => void;
  showSaveStatus: ShowSaveStatus;
  setPtoDatabaseReady: Dispatch<SetStateAction<boolean>>;
  setPtoDatabaseMessage: Dispatch<SetStateAction<string>>;
  setPtoSaveRevision: Dispatch<SetStateAction<number>>;
  setPtoManualYears: Dispatch<SetStateAction<string[]>>;
  setPtoPlanRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoOperRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoSurveyRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoBucketValues: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoBucketManualRows: Dispatch<SetStateAction<PtoBucketRow[]>>;
  setPtoTab: Dispatch<SetStateAction<string>>;
  setPtoPlanYear: Dispatch<SetStateAction<string>>;
  setPtoAreaFilter: Dispatch<SetStateAction<string>>;
  setExpandedPtoMonths: Dispatch<SetStateAction<Record<string, boolean>>>;
  setReportColumnWidths: Dispatch<SetStateAction<Record<string, number>>>;
  setReportReasons: Dispatch<SetStateAction<Record<string, string>>>;
  setPtoColumnWidths: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoRowHeights: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoHeaderLabels: Dispatch<SetStateAction<Record<string, string>>>;
};

export function useAppPtoPersistence({
  adminDataLoaded,
  ptoSaveRevision,
  ptoManualYears,
  ptoPlanRows,
  ptoOperRows,
  ptoSurveyRows,
  ptoBucketValues,
  ptoBucketManualRows,
  ptoTab,
  ptoPlanYear,
  ptoAreaFilter,
  expandedPtoMonths,
  reportColumnWidths,
  reportReasons,
  ptoColumnWidths,
  ptoRowHeights,
  ptoHeaderLabels,
  ptoDatabaseLoadedRef,
  hasStoredPtoStateRef,
  requestClientSnapshotSave,
  resetUndoHistoryForExternalRestore,
  showSaveStatus,
  setPtoDatabaseReady,
  setPtoDatabaseMessage,
  setPtoSaveRevision,
  setPtoManualYears,
  setPtoPlanRows,
  setPtoOperRows,
  setPtoSurveyRows,
  setPtoBucketValues,
  setPtoBucketManualRows,
  setPtoTab,
  setPtoPlanYear,
  setPtoAreaFilter,
  setExpandedPtoMonths,
  setReportColumnWidths,
  setReportReasons,
  setPtoColumnWidths,
  setPtoRowHeights,
  setPtoHeaderLabels,
}: UseAppPtoPersistenceOptions) {
  const ptoDatabaseState = usePtoDatabaseState({
    ptoManualYears,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    ptoBucketValues,
    ptoBucketManualRows,
    ptoTab,
    ptoPlanYear,
    ptoAreaFilter,
    expandedPtoMonths,
    reportColumnWidths,
    reportReasons,
    ptoColumnWidths,
    ptoRowHeights,
    ptoHeaderLabels,
  });
  const ptoDatabaseStateRef = useSyncedRef(ptoDatabaseState);

  const {
    ptoDatabaseSaveSnapshotRef,
    savePtoDatabaseChanges,
    requestPtoDatabaseSave,
  } = usePtoDatabaseSave({
    adminDataLoaded,
    ptoSaveRevision,
    ptoDatabaseStateRef,
    ptoDatabaseLoadedRef,
    setPtoDatabaseMessage,
    setPtoSaveRevision,
    showSaveStatus,
  });

  usePtoDatabaseLoad({
    adminDataLoaded,
    ptoDatabaseStateRef,
    hasStoredPtoStateRef,
    ptoDatabaseLoadedRef,
    ptoDatabaseSaveSnapshotRef,
    resetUndoHistoryForExternalRestore,
    showSaveStatus,
    setPtoDatabaseReady,
    setPtoDatabaseMessage,
    setPtoSaveRevision,
    setPtoManualYears,
    setPtoPlanRows,
    setPtoOperRows,
    setPtoSurveyRows,
    setPtoBucketValues,
    setPtoBucketManualRows,
    setPtoTab,
    setPtoPlanYear,
    setPtoAreaFilter,
    setExpandedPtoMonths,
    setReportColumnWidths,
    setReportReasons,
    setPtoColumnWidths,
    setPtoRowHeights,
    setPtoHeaderLabels,
  });

  const { savePtoLocalState } = usePtoLocalPersistence({
    adminDataLoaded,
    ptoDatabaseStateRef,
    ptoDatabaseLoadedRef,
    hasStoredPtoStateRef,
    requestClientSnapshotSave,
    ptoManualYears,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    ptoColumnWidths,
    ptoRowHeights,
    ptoHeaderLabels,
    ptoBucketValues,
    ptoBucketManualRows,
  });

  return {
    savePtoDatabaseChanges,
    requestPtoDatabaseSave,
    savePtoLocalState,
  };
}
