"use client";

import type { ReactNode } from "react";

import { createAppPtoBucketSectionProps } from "@/features/app/appPtoBucketSectionProps";
import { createAppPtoSectionShellProps } from "@/features/app/appPtoSectionShellProps";
import type { AppNavigation, AppPtoModels, AppRuntimeControllers } from "@/features/app/appPtoScreenPropsTypes";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { useAppPtoSupplementalTables } from "@/features/app/useAppPtoSupplementalTables";
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
  const ptoSupplementalTables = useAppPtoSupplementalTables({
    isPtoBucketsSection: true,
    ptoBucketRowLookupSources: models.ptoBucketRowLookupSources,
    deferredVehicleRows: models.deferredVehicleRows,
    ptoTab: appState.ptoTab,
    ptoPlanYear: appState.ptoPlanYear,
    ptoAreaFilter: appState.ptoAreaFilter,
    ptoPlanRows: appState.ptoPlanRows,
    ptoOperRows: appState.ptoOperRows,
    ptoSurveyRows: appState.ptoSurveyRows,
    ptoBucketManualRows: appState.ptoBucketManualRows,
    ptoPlanImportInputRef: appState.ptoPlanImportInputRef,
    setPtoPlanRows: appState.setPtoPlanRows,
    setPtoOperRows: appState.setPtoOperRows,
    setPtoSurveyRows: appState.setPtoSurveyRows,
    setPtoManualYears: appState.setPtoManualYears,
    setExpandedPtoMonths: appState.setExpandedPtoMonths,
    setPtoBucketValues: appState.setPtoBucketValues,
    setPtoBucketManualRows: appState.setPtoBucketManualRows,
    databaseConfigured,
    ptoDatabaseLoadedRef: appState.ptoDatabaseLoadedRef,
    markPtoDatabaseInlineWriteSaved: runtime.markPtoDatabaseInlineWriteSaved,
    getPtoDatabaseExpectedUpdatedAt: runtime.getPtoDatabaseExpectedUpdatedAt,
    requestPtoDatabaseSave: runtime.requestPtoDatabaseSave,
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
      ptoBucketValues={bucketProps.ptoBucketValues}
      onCommitBucketValue={bucketProps.commitPtoBucketValue}
      onClearBucketCells={bucketProps.clearPtoBucketCells}
      onAddBucketManualRow={bucketProps.addPtoBucketManualRow}
      onDeleteBucketManualRow={bucketProps.deletePtoBucketManualRow}
      renderPlanTable={renderEmptyPtoDateTable}
      renderOperTable={renderEmptyPtoDateTable}
      renderSurveyTable={renderEmptyPtoDateTable}
    />
  );
}
