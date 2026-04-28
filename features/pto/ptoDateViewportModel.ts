"use client";

import { useEffect } from "react";

import type { PtoMonthGroupView } from "@/features/pto/ptoDateTableModel";
import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";

type UsePtoDateViewportRefreshOptions = Pick<
  PtoDateTableContainerProps,
  | "ptoDateEditing"
  | "ptoDateTableScrollRef"
  | "ptoTab"
  | "updatePtoDateViewportFromElement"
> & {
  displayPtoMonthGroups: PtoMonthGroupView[];
  filteredRowCount: number;
  tableMinWidth: number;
};

export function usePtoDateViewportRefresh({
  displayPtoMonthGroups,
  filteredRowCount,
  ptoDateEditing,
  ptoDateTableScrollRef,
  ptoTab,
  tableMinWidth,
  updatePtoDateViewportFromElement,
}: UsePtoDateViewportRefreshOptions) {
  useEffect(() => {
    const element = ptoDateTableScrollRef.current;
    if (!element) return;

    updatePtoDateViewportFromElement(element);
  }, [
    displayPtoMonthGroups,
    filteredRowCount,
    ptoDateEditing,
    ptoDateTableScrollRef,
    ptoTab,
    tableMinWidth,
    updatePtoDateViewportFromElement,
  ]);
}
