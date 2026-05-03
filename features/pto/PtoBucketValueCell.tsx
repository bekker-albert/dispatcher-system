"use client";

import { memo, type ChangeEvent, type KeyboardEvent, type MouseEvent } from "react";
import { type PtoBucketCell, type PtoBucketColumn, type PtoBucketRow } from "../../lib/domain/pto/buckets";
import { formatBucketNumber } from "../../lib/domain/pto/formatting";
import {
  ptoActiveFormulaCellStyle,
  ptoBucketControlStyle,
  ptoBucketReadonlyValueStyle,
  ptoBucketsTdStyle,
  ptoEditingFormulaCellStyle,
  ptoSelectedFormulaCellStyle,
} from "./ptoBucketsStyles";

type PtoBucketValueCellProps = {
  row: PtoBucketRow;
  column: PtoBucketColumn;
  cellKey: string;
  value: number | undefined;
  draft: string;
  editingMode: boolean;
  active: boolean;
  selected: boolean;
  isEditing: boolean;
  onBlur: (cellKey: string) => void;
  onDraftChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (
    event: KeyboardEvent<HTMLElement>,
    cell: PtoBucketCell,
    value: number | undefined,
    cellKey: string,
    isEditing: boolean,
  ) => void;
  onMouseDown: (event: MouseEvent<HTMLElement>, cell: PtoBucketCell) => void;
  onSelectCell: (cell: PtoBucketCell) => void;
  onStartEdit: (cell: PtoBucketCell, value: number | undefined) => void;
};

export const PtoBucketValueCell = memo(function PtoBucketValueCell({
  row,
  column,
  cellKey,
  value,
  draft,
  editingMode,
  active,
  selected,
  isEditing,
  onBlur,
  onDraftChange,
  onKeyDown,
  onMouseDown,
  onSelectCell,
  onStartEdit,
}: PtoBucketValueCellProps) {
  const formattedValue = formatBucketNumber(value);

  if (!editingMode) {
    return (
      <td style={ptoBucketsTdStyle}>
        <div style={ptoBucketReadonlyValueStyle} title={formattedValue || undefined}>{formattedValue}</div>
      </td>
    );
  }

  const cellControlStyle = {
    ...ptoBucketControlStyle,
    ...(selected ? ptoSelectedFormulaCellStyle : null),
    ...(active ? ptoActiveFormulaCellStyle : null),
    ...(isEditing ? ptoEditingFormulaCellStyle : null),
  };
  const cell = { rowKey: row.key, equipmentKey: column.key };

  return (
    <td style={ptoBucketsTdStyle}>
      {isEditing ? (
        <input
          key={cellKey}
          id={`pto-bucket-cell-${cellKey}`}
          autoFocus
          data-pto-bucket-cell={cellKey}
          inputMode="decimal"
          defaultValue={draft}
          onChange={onDraftChange}
          onBlur={() => onBlur(cellKey)}
          onKeyDown={(event) => onKeyDown(event, cell, value, cellKey, true)}
          placeholder="0,00"
          style={cellControlStyle}
        />
      ) : (
        <button
          id={`pto-bucket-cell-${cellKey}`}
          data-pto-bucket-cell={cellKey}
          type="button"
          onFocus={() => {
            if (!selected) onSelectCell(cell);
          }}
          onMouseDown={(event) => onMouseDown(event, cell)}
          onDoubleClick={() => onStartEdit(cell, value)}
          onKeyDown={(event) => onKeyDown(event, cell, value, cellKey, false)}
          style={cellControlStyle}
          title={formattedValue || undefined}
        >
          {formattedValue}
        </button>
      )}
    </td>
  );
});
