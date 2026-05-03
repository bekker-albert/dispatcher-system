"use client";

import { useMemo, type ReactNode } from "react";

import { createAppPtoBucketSectionProps } from "@/features/app/appPtoBucketSectionProps";
import { createAppPtoSectionShellProps } from "@/features/app/appPtoSectionShellProps";
import type { AppNavigation, AppPtoModels, AppRuntimeControllers } from "@/features/app/appPtoScreenPropsTypes";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { useAppPtoBucketSupplementalTables } from "@/features/app/useAppPtoBucketSupplementalTables";
import PtoSection from "@/features/pto/PtoSection";
import { databaseConfigured } from "@/lib/data/config";

type PtoBucketsPrimaryContentProps = {
  appState: AppStateBundle;
  models: AppPtoModels;
  runtime: AppRuntimeControllers;
  navigation: AppNavigation;
};

function renderEmptyPtoDateTable(): ReactNode {
  return null;
}

export function PtoBucketsPrimaryContent({
  appState,
  models,
  runtime,
  navigation,
}: PtoBucketsPrimaryContentProps) {
  const ptoPerformanceRowSources = useMemo(
    () => [
      ...models.deferredPtoPlanRows,
      ...models.deferredPtoOperRows,
      ...models.deferredPtoSurveyRows,
    ],
    [models.deferredPtoOperRows, models.deferredPtoPlanRows, models.deferredPtoSurveyRows],
  );
  const ptoSupplementalTables = useAppPtoBucketSupplementalTables({
    active: true,
    ptoTab: appState.ptoTab,
    ptoBucketRowLookupSources: models.ptoBucketRowLookupSources,
    ptoPerformanceRowSources,
    deferredVehicleRows: models.deferredVehicleRows,
    ptoAreaFilter: appState.ptoAreaFilter,
    ptoBucketManualRows: appState.ptoBucketManualRows,
    ptoBucketValues: appState.ptoBucketValues,
    setPtoBucketValues: appState.setPtoBucketValues,
    setPtoBucketManualRows: appState.setPtoBucketManualRows,
    databaseConfigured,
    ptoDatabaseLoadedRef: appState.ptoDatabaseLoadedRef,
    markPtoDatabaseInlineWriteSaved: runtime.markPtoDatabaseInlineWriteSaved,
    getPtoDatabaseExpectedUpdatedAt: runtime.getPtoDatabaseExpectedUpdatedAt,
    requestPtoDatabaseSave: runtime.requestPtoDatabaseSave,
    showSaveStatus: appState.showSaveStatus,
    addAdminLog: appState.addAdminLog,
  });
  const shellProps = createAppPtoSectionShellProps({ appState, models, navigation });
  const bucketProps = createAppPtoBucketSectionProps({ appState, ptoSupplementalTables });

  return (
    <PtoSection
      {...shellProps}
      onSelectArea={shellProps.selectPtoArea}
      ptoBucketRows={bucketProps.ptoBucketRows}
      ptoBucketColumns={bucketProps.ptoBucketColumns}
      ptoCycleRows={bucketProps.ptoCycleRows}
      ptoCycleColumns={bucketProps.ptoCycleColumns}
      ptoBodyRows={bucketProps.ptoBodyRows}
      ptoBodyColumns={bucketProps.ptoBodyColumns}
      ptoPerformanceRows={bucketProps.ptoPerformanceRows}
      ptoPerformanceColumns={bucketProps.ptoPerformanceColumns}
      ptoBucketValues={bucketProps.ptoBucketValues}
      ptoMatrixHeaderEditor={{
        editingHeaderKey: appState.editingPtoHeaderKey,
        headerDraft: appState.ptoHeaderDraft,
        headerLabel: runtime.ptoHeaderLabel,
        setHeaderDraft: appState.setPtoHeaderDraft,
        startHeaderEdit: runtime.startPtoHeaderEdit,
        commitHeaderEdit: runtime.commitPtoHeaderEdit,
        cancelHeaderEdit: runtime.cancelPtoHeaderEdit,
      }}
      onCommitBucketValue={bucketProps.commitPtoBucketValue}
      onClearBucketCells={bucketProps.clearPtoBucketCells}
      onAddBucketManualRow={bucketProps.addPtoBucketManualRow}
      onDeleteBucketManualRow={bucketProps.deletePtoBucketManualRow}
      onExportPtoMatrixToExcel={bucketProps.exportPtoMatrixToExcel}
      onImportPtoMatrixFromExcel={bucketProps.importPtoMatrixFromExcel}
      renderPlanTable={renderEmptyPtoDateTable}
      renderOperTable={renderEmptyPtoDateTable}
      renderSurveyTable={renderEmptyPtoDateTable}
    />
  );
}
