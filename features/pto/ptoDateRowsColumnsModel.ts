"use client";

import { useMemo } from "react";

import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";
import {
  createPtoCarryoverHeader,
  createPtoDateFilteredRows,
  createPtoDateRowById,
} from "@/features/pto/ptoDateTableViewModel";
import {
  createPtoDateTableModel,
  createPtoEffectiveCarryoverGetter,
  createPtoRowDateTotalsGetter,
} from "@/features/pto/ptoDateTableModel";
import {
  createPtoDateVisibleRowHeightsModel,
  createPtoDateVirtualRowsLayoutModel,
  createPtoDateVirtualRowsViewModel,
} from "@/features/pto/ptoDateVirtualRowsViewModel";

type UsePtoDateRowsColumnsModelOptions = Pick<
  PtoDateTableContainerProps,
  | "rows"
  | "options"
  | "ptoTab"
  | "ptoAreaFilter"
  | "ptoPlanYear"
  | "reportDate"
  | "ptoYearMonths"
  | "ptoMonthGroups"
  | "ptoDateEditing"
  | "ptoColumnWidths"
  | "ptoRowHeights"
  | "ptoDateViewport"
  | "startPtoColumnResize"
>;

export function usePtoDateRowsColumnsModel({
  rows,
  options = {},
  ptoTab,
  ptoAreaFilter,
  ptoPlanYear,
  reportDate,
  ptoYearMonths,
  ptoMonthGroups,
  ptoDateEditing,
  ptoColumnWidths,
  ptoRowHeights,
  ptoDateViewport,
  startPtoColumnResize,
}: UsePtoDateRowsColumnsModelOptions) {
  const {
    editableMonthTotal: optionEditableMonthTotal,
    showLocation: optionShowLocation,
  } = options;
  const editableMonthTotal = optionEditableMonthTotal === true;
  const showLocation = optionShowLocation !== false;
  const showCustomerCode = ptoTab === "plan";
  const filteredRows = useMemo(() => (
    createPtoDateFilteredRows(rows, ptoAreaFilter, ptoPlanYear)
  ), [ptoAreaFilter, ptoPlanYear, rows]);
  const rowById = useMemo(() => (
    createPtoDateRowById(rows, ptoDateEditing)
  ), [ptoDateEditing, rows]);
  const getRowDateTotals = useMemo(() => (
    createPtoRowDateTotalsGetter(ptoPlanYear)
  ), [ptoPlanYear]);
  const getEffectiveCarryover = useMemo(() => (
    createPtoEffectiveCarryoverGetter(rows, ptoPlanYear)
  ), [ptoPlanYear, rows]);
  const carryoverHeader = useMemo(() => (
    createPtoCarryoverHeader(ptoPlanYear)
  ), [ptoPlanYear]);
  const tableLayoutModel = useMemo(() => createPtoDateTableModel({
    showCustomerCode,
    showLocation,
    planYear: ptoPlanYear,
    reportDate,
    yearMonths: ptoYearMonths,
    monthGroups: ptoMonthGroups,
    editing: ptoDateEditing,
    columnWidths: ptoColumnWidths,
  }), [
    ptoColumnWidths,
    ptoDateEditing,
    ptoMonthGroups,
    ptoPlanYear,
    ptoYearMonths,
    reportDate,
    showCustomerCode,
    showLocation,
  ]);
  const visibleRowHeights = useMemo(() => (
    createPtoDateVisibleRowHeightsModel(filteredRows, ptoRowHeights, ptoTab)
  ), [filteredRows, ptoRowHeights, ptoTab]);
  const virtualRowsLayout = useMemo(() => createPtoDateVirtualRowsLayoutModel({
    rows: filteredRows,
    rowHeights: visibleRowHeights.rowHeights,
    table: ptoTab,
  // `visibleRowHeights.signature` is enough here: unrelated row-height edits
  // should not rebuild the virtual layout for the current filtered table.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [filteredRows, ptoTab, visibleRowHeights.signature]);
  const virtualRowsModel = useMemo(() => createPtoDateVirtualRowsViewModel({
    layout: virtualRowsLayout,
    viewport: ptoDateViewport,
  }), [ptoDateViewport, virtualRowsLayout]);

  return {
    carryoverHeader,
    columnWidthByKey: tableLayoutModel.columnWidthByKey,
    displayPtoMonthGroups: tableLayoutModel.displayPtoMonthGroups,
    editableMonthTotal,
    filteredRows,
    getEffectiveCarryover,
    getRowDateTotals,
    rowById,
    showCustomerCode,
    showLocation,
    tableColumns: tableLayoutModel.tableColumns,
    tableMinWidth: tableLayoutModel.tableMinWidth,
    ...virtualRowsModel,
    ptoColumnResizeHandler: ptoDateEditing ? startPtoColumnResize : undefined,
    tableSpacerColSpan: tableLayoutModel.tableColumns.length,
  };
}

export type PtoDateRowsColumnsModel = ReturnType<typeof usePtoDateRowsColumnsModel>;
