"use client";

import { PtoDateToolbar } from "@/features/pto/PtoDateToolbar";
import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";

type PtoDateToolbarPanelProps = Pick<
  PtoDateTableContainerProps,
  | "ptoAreaTabs"
  | "ptoAreaFilter"
  | "selectPtoArea"
  | "ptoTab"
  | "ptoDateEditing"
  | "exportPtoDateTableToExcel"
  | "openPtoDateImportFilePicker"
  | "importPtoDateTableFromExcel"
  | "ptoPlanImportInputRef"
  | "ptoYearTabs"
  | "ptoPlanYear"
  | "selectPtoPlanYear"
  | "deletePtoYear"
  | "ptoYearDialogOpen"
  | "ptoYearInput"
  | "setPtoYearInput"
  | "setPtoYearDialogOpen"
  | "addPtoYear"
> & {
  excelLabel: string;
  onToggleEditing: () => void;
};

export function PtoDateToolbarPanel({
  ptoAreaTabs,
  ptoAreaFilter,
  selectPtoArea,
  ptoTab,
  ptoDateEditing,
  exportPtoDateTableToExcel,
  openPtoDateImportFilePicker,
  importPtoDateTableFromExcel,
  ptoPlanImportInputRef,
  ptoYearTabs,
  ptoPlanYear,
  selectPtoPlanYear,
  deletePtoYear,
  ptoYearDialogOpen,
  ptoYearInput,
  setPtoYearInput,
  setPtoYearDialogOpen,
  addPtoYear,
  excelLabel,
  onToggleEditing,
}: PtoDateToolbarPanelProps) {
  return (
    <PtoDateToolbar
      areaTabs={ptoAreaTabs}
      areaFilter={ptoAreaFilter}
      onSelectArea={selectPtoArea}
      showExcelControls={["plan", "oper", "survey"].includes(ptoTab)}
      excelLabel={excelLabel}
      editing={ptoDateEditing}
      onExport={exportPtoDateTableToExcel}
      onOpenImport={openPtoDateImportFilePicker}
      onImportChange={importPtoDateTableFromExcel}
      importInputRef={ptoPlanImportInputRef}
      onToggleEditing={onToggleEditing}
      yearTabs={ptoYearTabs}
      selectedYear={ptoPlanYear}
      onSelectYear={selectPtoPlanYear}
      onDeleteYear={deletePtoYear}
      onOpenYearDialog={() => {
        setPtoYearInput("");
        setPtoYearDialogOpen(true);
      }}
      yearDialogOpen={ptoYearDialogOpen}
      yearInput={ptoYearInput}
      onYearInputChange={setPtoYearInput}
      onAddYear={addPtoYear}
      onCloseYearDialog={() => {
        setPtoYearDialogOpen(false);
        setPtoYearInput("");
      }}
    />
  );
}
