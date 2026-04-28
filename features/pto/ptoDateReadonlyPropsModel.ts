import type {
  CreatePtoDateReadonlyPropsModelOptions,
  PtoDateReadonlyProps,
} from "@/features/pto/ptoDateContainerPropsTypes";

export function createPtoDateReadonlyProps({
  props,
  toolbar,
  rowsColumnsModel,
}: CreatePtoDateReadonlyPropsModelOptions): PtoDateReadonlyProps {
  const {
    ptoPlanYear,
    reportDate,
    ptoRowHeights,
    ptoDateTableScrollRef,
    requestPtoDatabaseSave,
    handlePtoDateTableScroll,
    setExpandedPtoMonths,
    ptoHeaderLabel,
    ptoTab,
  } = props;
  const {
    carryoverHeader,
    columnWidthByKey,
    displayPtoMonthGroups,
    getEffectiveCarryover,
    getRowDateTotals,
    renderedRows,
    showCustomerCode,
    showLocation,
    tableColumns,
    tableMinWidth,
    bottomSpacerHeight,
    tableSpacerColSpan,
    topSpacerHeight,
  } = rowsColumnsModel;

  return {
    rows: renderedRows,
    showCustomerCode,
    showLocation,
    ptoPlanYear,
    ptoTab,
    reportDate,
    bottomSpacerHeight,
    carryoverHeader,
    displayMonthGroups: displayPtoMonthGroups,
    tableColumns,
    tableMinWidth,
    columnWidthByKey,
    rowHeights: ptoRowHeights,
    scrollRef: ptoDateTableScrollRef,
    onScroll: handlePtoDateTableScroll,
    tableSpacerColSpan,
    topSpacerHeight,
    getEffectiveCarryover,
    getRowDateTotals,
    headerLabel: ptoHeaderLabel,
    onToggleMonth: (month: string) => {
      setExpandedPtoMonths((current) => ({ ...current, [month]: !current[month] }));
      requestPtoDatabaseSave();
    },
    toolbar,
  };
}
