"use client";

import { createPtoDateReadonlyProps } from "@/features/pto/ptoDateReadonlyPropsModel";
import { PtoDateReadonlyTable } from "@/features/pto/PtoDateReadonlyTable";
import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";
import { usePtoDateRowsColumnsModel } from "@/features/pto/ptoDateRowsColumnsModel";
import { usePtoDateToolbar } from "@/features/pto/usePtoDateToolbar";
import { usePtoDateViewportRefresh } from "@/features/pto/ptoDateViewportModel";

const defaultPtoDateTableOptions: NonNullable<PtoDateTableContainerProps["options"]> = {};

export function PtoDateReadonlyTableContainer(props: PtoDateTableContainerProps) {
  const {
    options = defaultPtoDateTableOptions,
  } = props;
  const rowsColumnsModel = usePtoDateRowsColumnsModel({ ...props, options });
  const toolbar = usePtoDateToolbar(props);

  usePtoDateViewportRefresh({
    ...props,
    displayPtoMonthGroups: rowsColumnsModel.displayPtoMonthGroups,
    filteredRowCount: rowsColumnsModel.filteredRows.length,
    tableMinWidth: rowsColumnsModel.tableMinWidth,
  });

  const readonlyProps = createPtoDateReadonlyProps({
    props,
    toolbar,
    rowsColumnsModel,
  });

  return <PtoDateReadonlyTable {...readonlyProps} />;
}
