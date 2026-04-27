"use client";

import type { ReactNode } from "react";

import { PtoDateToolbarPanel } from "@/features/pto/PtoDateToolbarPanel";
import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";
import { usePtoDateEditingToggle } from "@/features/pto/usePtoDateEditingToggle";

type UsePtoDateToolbarOptions = Pick<
  PtoDateTableContainerProps,
  | "addPtoYear"
  | "currentPtoDateExcelMeta"
  | "deletePtoYear"
  | "exportPtoDateTableToExcel"
  | "importPtoDateTableFromExcel"
  | "openPtoDateImportFilePicker"
  | "ptoAreaFilter"
  | "ptoAreaTabs"
  | "ptoDateEditing"
  | "ptoPlanImportInputRef"
  | "ptoPlanYear"
  | "ptoTab"
  | "ptoYearDialogOpen"
  | "ptoYearInput"
  | "ptoYearTabs"
  | "requestPtoDatabaseSave"
  | "savePtoDatabaseChanges"
  | "savePtoLocalState"
  | "selectPtoArea"
  | "selectPtoPlanYear"
  | "setDraggedPtoRowId"
  | "setPtoDateEditing"
  | "setPtoDropTarget"
  | "setPtoFormulaCell"
  | "setPtoFormulaDraft"
  | "setPtoInlineEditCell"
  | "setPtoInlineEditInitialDraft"
  | "setPtoSelectedCellKeys"
  | "setPtoSelectionAnchorCell"
  | "setPtoYearDialogOpen"
  | "setPtoYearInput"
>;

export function usePtoDateToolbar({
  addPtoYear,
  currentPtoDateExcelMeta,
  deletePtoYear,
  exportPtoDateTableToExcel,
  importPtoDateTableFromExcel,
  openPtoDateImportFilePicker,
  ptoAreaFilter,
  ptoAreaTabs,
  ptoDateEditing,
  ptoPlanImportInputRef,
  ptoPlanYear,
  ptoTab,
  ptoYearDialogOpen,
  ptoYearInput,
  ptoYearTabs,
  requestPtoDatabaseSave,
  savePtoDatabaseChanges,
  savePtoLocalState,
  selectPtoArea,
  selectPtoPlanYear,
  setDraggedPtoRowId,
  setPtoDateEditing,
  setPtoDropTarget,
  setPtoFormulaCell,
  setPtoFormulaDraft,
  setPtoInlineEditCell,
  setPtoInlineEditInitialDraft,
  setPtoSelectedCellKeys,
  setPtoSelectionAnchorCell,
  setPtoYearDialogOpen,
  setPtoYearInput,
}: UsePtoDateToolbarOptions): ReactNode {
  const togglePtoDateEditing = usePtoDateEditingToggle({
    ptoDateEditing,
    setPtoDateEditing,
    setDraggedPtoRowId,
    setPtoDropTarget,
    setPtoFormulaCell,
    setPtoFormulaDraft,
    setPtoInlineEditCell,
    setPtoInlineEditInitialDraft,
    setPtoSelectionAnchorCell,
    setPtoSelectedCellKeys,
    savePtoLocalState,
    requestPtoDatabaseSave,
    savePtoDatabaseChanges,
  });

  return (
    <PtoDateToolbarPanel
      ptoAreaTabs={ptoAreaTabs}
      ptoAreaFilter={ptoAreaFilter}
      selectPtoArea={selectPtoArea}
      ptoTab={ptoTab}
      ptoDateEditing={ptoDateEditing}
      exportPtoDateTableToExcel={exportPtoDateTableToExcel}
      openPtoDateImportFilePicker={openPtoDateImportFilePicker}
      importPtoDateTableFromExcel={importPtoDateTableFromExcel}
      ptoPlanImportInputRef={ptoPlanImportInputRef}
      ptoYearTabs={ptoYearTabs}
      ptoPlanYear={ptoPlanYear}
      selectPtoPlanYear={selectPtoPlanYear}
      deletePtoYear={deletePtoYear}
      ptoYearDialogOpen={ptoYearDialogOpen}
      ptoYearInput={ptoYearInput}
      setPtoYearInput={setPtoYearInput}
      setPtoYearDialogOpen={setPtoYearDialogOpen}
      addPtoYear={addPtoYear}
      excelLabel={currentPtoDateExcelMeta().label}
      onToggleEditing={togglePtoDateEditing}
    />
  );
}
