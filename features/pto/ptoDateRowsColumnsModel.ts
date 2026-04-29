"use client";

import { useMemo } from "react";

import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";
import { createPtoDateTableViewModel } from "@/features/pto/ptoDateTableViewModel";
import {
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
  const tableModel = useMemo(() => createPtoDateTableViewModel({
    rows,
    options: {
      editableMonthTotal: optionEditableMonthTotal,
      showLocation: optionShowLocation,
    },
    ptoTab,
    ptoAreaFilter,
    ptoPlanYear,
    reportDate,
    ptoYearMonths,
    ptoMonthGroups,
    ptoDateEditing,
    ptoColumnWidths,
  }), [
    rows,
    optionEditableMonthTotal,
    optionShowLocation,
    ptoTab,
    ptoAreaFilter,
    ptoPlanYear,
    reportDate,
    ptoYearMonths,
    ptoMonthGroups,
    ptoDateEditing,
    ptoColumnWidths,
  ]);
  const virtualRowsLayout = useMemo(() => createPtoDateVirtualRowsLayoutModel({
    rows: tableModel.filteredRows,
    rowHeights: ptoRowHeights,
    table: ptoTab,
  }), [ptoRowHeights, ptoTab, tableModel.filteredRows]);
  const virtualRowsModel = useMemo(() => createPtoDateVirtualRowsViewModel({
    layout: virtualRowsLayout,
    viewport: ptoDateViewport,
  }), [ptoDateViewport, virtualRowsLayout]);

  return {
    ...tableModel,
    ...virtualRowsModel,
    ptoColumnResizeHandler: ptoDateEditing ? startPtoColumnResize : undefined,
    tableSpacerColSpan: tableModel.tableColumns.length,
  };
}

export type PtoDateRowsColumnsModel = ReturnType<typeof usePtoDateRowsColumnsModel>;
