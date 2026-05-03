"use client";

import type { ReactNode } from "react";

import { createAppPtoSectionShellProps } from "@/features/app/appPtoSectionShellProps";
import type { AppNavigation, AppPtoModels } from "@/features/app/appPtoScreenPropsTypes";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import PtoSection from "@/features/pto/PtoSection";

type PtoStaticPrimaryContentProps = {
  appState: AppStateBundle;
  models: AppPtoModels;
  navigation: AppNavigation;
};

function renderEmptyPtoDateTable(): ReactNode {
  return null;
}

function noopCommitBucketValue() {}

function noopClearBucketCells() {}

function noopAddBucketManualRow() {
  return false;
}

function noopDeleteBucketManualRow() {}

function noopExportPtoMatrixToExcel() {}

function noopImportPtoMatrixFromExcel() {}

export function PtoStaticPrimaryContent({
  appState,
  models,
  navigation,
}: PtoStaticPrimaryContentProps) {
  const shellProps = createAppPtoSectionShellProps({ appState, models, navigation });

  return (
    <PtoSection
      {...shellProps}
      onSelectArea={shellProps.selectPtoArea}
      ptoBucketRows={[]}
      ptoBucketColumns={[]}
      ptoCycleRows={[]}
      ptoCycleColumns={[]}
      ptoBodyRows={[]}
      ptoBodyColumns={[]}
      ptoPerformanceRows={[]}
      ptoPerformanceColumns={[]}
      ptoBucketValues={{}}
      onCommitBucketValue={noopCommitBucketValue}
      onClearBucketCells={noopClearBucketCells}
      onAddBucketManualRow={noopAddBucketManualRow}
      onDeleteBucketManualRow={noopDeleteBucketManualRow}
      onExportPtoMatrixToExcel={noopExportPtoMatrixToExcel}
      onImportPtoMatrixFromExcel={noopImportPtoMatrixFromExcel}
      renderPlanTable={renderEmptyPtoDateTable}
      renderOperTable={renderEmptyPtoDateTable}
      renderSurveyTable={renderEmptyPtoDateTable}
    />
  );
}
