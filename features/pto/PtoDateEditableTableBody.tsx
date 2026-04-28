"use client";

import { PtoDateDraftRow } from "@/features/pto/PtoDateDraftRow";
import { PtoDateEditableTableRow } from "@/features/pto/PtoDateEditableTableRow";
import { PtoVirtualSpacerRow } from "@/features/pto/PtoDateTableParts";
import type { PtoDateEditableTableBodyProps } from "@/features/pto/PtoDateEditableTableBodyTypes";

export function PtoDateEditableTableBody(props: PtoDateEditableTableBodyProps) {
  const {
    addRowFromDraft,
    bottomSpacerHeight,
    handleDraftKeyDown,
    ptoDraftRowFields,
    renderedRows,
    tableSpacerColSpan,
    topSpacerHeight,
    updateDraftField,
    virtualStartIndex,
    ...rowProps
  } = props;

  return (
    <tbody>
      <PtoVirtualSpacerRow height={topSpacerHeight} colSpan={tableSpacerColSpan} />
      {renderedRows.map((row, renderedRowIndex) => (
        <PtoDateEditableTableRow
          key={row.id}
          {...rowProps}
          ptoFormulaDraft={
            rowProps.ptoDateEditing && rowProps.formulaRowEditing(row.id)
              ? rowProps.ptoFormulaDraft
              : ""
          }
          row={row}
          rowIndex={virtualStartIndex + renderedRowIndex}
        />
      ))}
      <PtoVirtualSpacerRow height={bottomSpacerHeight} colSpan={tableSpacerColSpan} />
      {rowProps.ptoDateEditing ? (
        <PtoDateDraftRow
          showCustomerCode={rowProps.showCustomerCode}
          showLocation={rowProps.showLocation}
          fields={ptoDraftRowFields}
          monthGroups={rowProps.displayPtoMonthGroups}
          onUpdateField={updateDraftField}
          onKeyDown={handleDraftKeyDown}
          onAddRow={addRowFromDraft}
        />
      ) : null}
    </tbody>
  );
}
