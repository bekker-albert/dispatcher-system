"use client";

import { createPtoDateEditableProps } from "@/features/pto/ptoDateEditablePropsModel";
import { createPtoDateFormulaBarProps } from "@/features/pto/ptoDateFormulaBarModel";
import { PtoDateEditableTable } from "@/features/pto/PtoDateEditableTable";
import { PtoFormulaBar } from "@/features/pto/PtoFormulaBar";
import { usePtoDateFormulaController } from "@/features/pto/ptoDateFormulaController";
import { usePtoDateRowsColumnsModel } from "@/features/pto/ptoDateRowsColumnsModel";
import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";
import { usePtoDateHeaderRenderers } from "@/features/pto/usePtoDateHeaderRenderers";
import { usePtoDateToolbar } from "@/features/pto/usePtoDateToolbar";
import { usePtoDateViewportRefresh } from "@/features/pto/ptoDateViewportModel";
import { usePtoDraftRowController } from "@/features/pto/usePtoDraftRowController";
import { usePtoFormulaCellScroller } from "@/features/pto/usePtoFormulaCellScroller";

const defaultPtoDateTableOptions: NonNullable<PtoDateTableContainerProps["options"]> = {};

export function PtoDateEditableTableContainer(props: PtoDateTableContainerProps) {
  const {
    addLinkedPtoDateRow,
    options = defaultPtoDateTableOptions,
    ptoAreaFilter,
    ptoDateEditing,
    ptoDateTableScrollRef,
    ptoDraftRowFields,
    ptoFormulaDraft,
    setPtoDraftRowFields,
    setPtoPendingFieldFocus,
    updatePtoDateViewportFromElement,
  } = props;
  const rowsColumnsModel = usePtoDateRowsColumnsModel({ ...props, options });
  const toolbar = usePtoDateToolbar(props);
  const draftRowController = usePtoDraftRowController({
    editing: ptoDateEditing,
    areaFilter: ptoAreaFilter,
    showCustomerCode: rowsColumnsModel.showCustomerCode,
    draftFields: ptoDraftRowFields,
    setDraftFields: setPtoDraftRowFields,
    addLinkedRow: addLinkedPtoDateRow,
    setPendingFieldFocus: setPtoPendingFieldFocus,
  });

  usePtoDateViewportRefresh({
    ...props,
    displayPtoMonthGroups: rowsColumnsModel.displayPtoMonthGroups,
    filteredRowCount: rowsColumnsModel.filteredRows.length,
    tableMinWidth: rowsColumnsModel.tableMinWidth,
  });

  const scrollFormulaCellIntoView = usePtoFormulaCellScroller({
    ...props,
    filteredRows: rowsColumnsModel.filteredRows,
    filteredRowHeights: rowsColumnsModel.filteredRowHeights,
    ptoDateEditing,
    ptoDateTableScrollRef,
    rowOffsetAt: rowsColumnsModel.rowOffsetAt,
    updatePtoDateViewportFromElement,
  });
  const formulaController = usePtoDateFormulaController({
    ...props,
    carryoverHeader: rowsColumnsModel.carryoverHeader,
    displayPtoMonthGroups: rowsColumnsModel.displayPtoMonthGroups,
    editableMonthTotal: rowsColumnsModel.editableMonthTotal,
    filteredRows: rowsColumnsModel.filteredRows,
    renderedRows: rowsColumnsModel.renderedRows,
    rowById: rowsColumnsModel.rowById,
    getEffectiveCarryover: rowsColumnsModel.getEffectiveCarryover,
    getRowDateTotals: rowsColumnsModel.getRowDateTotals,
    scrollFormulaCellIntoView,
  });
  const headerRenderers = usePtoDateHeaderRenderers(props);
  const formulaBarProps = createPtoDateFormulaBarProps({
    activeFormulaCell: formulaController.activeFormulaCell,
    formulaInputDisabled: formulaController.formulaInputDisabled,
    ptoFormulaDraft,
    commitFormulaBarEdit: formulaController.commitFormulaBarEdit,
    updateFormulaValue: formulaController.updateFormulaDraft,
  });
  const editableProps = createPtoDateEditableProps({
    props,
    toolbar,
    rowsColumnsModel,
    draftRowController,
    formulaController,
    headerRenderers,
  });

  return (
    <PtoDateEditableTable
      {...editableProps}
      formulaBar={<PtoFormulaBar {...formulaBarProps} />}
    />
  );
}
