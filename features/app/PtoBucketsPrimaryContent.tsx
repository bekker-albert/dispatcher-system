"use client";

import { useCallback, useMemo, type ReactNode } from "react";

import { createAppPtoBucketSectionProps } from "@/features/app/appPtoBucketSectionProps";
import { createAppPtoSectionShellProps } from "@/features/app/appPtoSectionShellProps";
import type { AppNavigation, AppPtoModels, AppRuntimeControllers } from "@/features/app/appPtoScreenPropsTypes";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { useAppPtoBucketSupplementalTables } from "@/features/app/useAppPtoBucketSupplementalTables";
import PtoSection from "@/features/pto/PtoSection";
import { databaseConfigured } from "@/lib/data/config";
import {
  addPtoBodyAreaMetadata,
  addPtoBodyMaterialMetadata,
  ptoBodyAreaExists,
  ptoBodyMaterialExists,
} from "@/lib/domain/pto/bodies";
import { cleanAreaName } from "@/lib/utils/text";

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
    () => (
      appState.ptoTab === "performance"
        ? [
            ...models.deferredPtoPlanRows,
            ...models.deferredPtoOperRows,
            ...models.deferredPtoSurveyRows,
          ]
        : []
    ),
    [appState.ptoTab, models.deferredPtoOperRows, models.deferredPtoPlanRows, models.deferredPtoSurveyRows],
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
    ptoHeaderLabels: appState.ptoHeaderLabels,
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

  const addBodyArea = useCallback(() => {
    const entered = window.prompt("Название нового участка");
    const area = cleanAreaName(entered ?? "").trim();
    if (!area) return;

    if (ptoBodyAreaExists(ptoSupplementalTables.ptoBodyReferenceData.areas, area)) {
      appState.setPtoAreaFilter(area);
      window.alert(`Участок «${area}» уже есть в Кузовах.`);
      return;
    }

    appState.setPtoHeaderLabels((current) => addPtoBodyAreaMetadata(current, area));
    appState.setPtoAreaFilter(area);
    runtime.requestPtoDatabaseSave();
    appState.addAdminLog({
      action: "Добавление",
      section: "ПТО — Кузова",
      details: `Добавлен участок «${area}».`,
    });
  }, [appState, ptoSupplementalTables.ptoBodyReferenceData.areas, runtime]);

  const addBodyMaterial = useCallback(() => {
    const selectedArea = appState.ptoAreaFilter === "Все участки"
      ? ""
      : cleanAreaName(appState.ptoAreaFilter).trim();
    const enteredArea = selectedArea || cleanAreaName(window.prompt("Участок для нового материала") ?? "").trim();
    if (!enteredArea) return;

    const material = (window.prompt(`Новый материал для участка «${enteredArea}»`) ?? "").trim();
    if (!material) return;

    if (ptoBodyMaterialExists(ptoSupplementalTables.ptoBodyReferenceData.materialSources, enteredArea, material)) {
      appState.setPtoAreaFilter(enteredArea);
      window.alert(`Материал «${material}» уже есть на участке «${enteredArea}».`);
      return;
    }

    appState.setPtoHeaderLabels((current) => addPtoBodyMaterialMetadata(current, enteredArea, material));
    appState.setPtoAreaFilter(enteredArea);
    runtime.requestPtoDatabaseSave();
    appState.addAdminLog({
      action: "Добавление",
      section: "ПТО — Кузова",
      details: `Добавлен материал «${material}» на участок «${enteredArea}».`,
    });
  }, [appState, ptoSupplementalTables.ptoBodyReferenceData.materialSources, runtime]);

  const ptoAreaTabs = appState.ptoTab === "bodies"
    ? bucketProps.ptoBodyAreaTabs
    : shellProps.ptoAreaTabs;

  return (
    <PtoSection
      {...shellProps}
      ptoAreaTabs={ptoAreaTabs}
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
      onAddPtoBodyArea={addBodyArea}
      onAddPtoBodyMaterial={addBodyMaterial}
      onExportPtoMatrixToExcel={bucketProps.exportPtoMatrixToExcel}
      onImportPtoMatrixFromExcel={bucketProps.importPtoMatrixFromExcel}
      renderPlanTable={renderEmptyPtoDateTable}
      renderOperTable={renderEmptyPtoDateTable}
      renderSurveyTable={renderEmptyPtoDateTable}
    />
  );
}
