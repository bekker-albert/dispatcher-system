"use client";

import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import type { PtoFormulaCellWithoutScope } from "@/features/pto/ptoDateFormulaModel";
import { formatPtoCellNumber, formatPtoFormulaNumber } from "@/lib/domain/pto/formatting";

type PtoDateFormulaInputProps = {
  cell: PtoFormulaCellWithoutScope;
  value: number | undefined;
  editing: boolean;
  draft: string;
  dataCellKey: string;
  placeholder?: string;
  style: CSSProperties;
  shouldSkipFocusSelection: () => boolean;
  onSelectCell: (cell: PtoFormulaCellWithoutScope, value: number | undefined) => void;
  onSelectRange: (cell: PtoFormulaCellWithoutScope, value: number | undefined) => void;
  onStartEdit: (cell: PtoFormulaCellWithoutScope, value: number | undefined) => void;
  onDraftChange: (value: string) => void;
  onCommitEdit: () => void;
  onMouseDown: (event: MouseEvent<HTMLInputElement>, cell: PtoFormulaCellWithoutScope, value: number | undefined, editing: boolean) => void;
  onMouseEnter: (event: MouseEvent<HTMLInputElement>, cell: PtoFormulaCellWithoutScope, value: number | undefined, editing: boolean) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>, cell: PtoFormulaCellWithoutScope, value: number | undefined, editing: boolean) => void;
};

export function PtoDateFormulaInput({
  cell,
  value,
  editing,
  draft,
  dataCellKey,
  placeholder,
  style,
  shouldSkipFocusSelection,
  onSelectCell,
  onSelectRange,
  onStartEdit,
  onDraftChange,
  onCommitEdit,
  onMouseDown,
  onMouseEnter,
  onKeyDown,
}: PtoDateFormulaInputProps) {
  return (
    <input
      readOnly={!editing}
      data-pto-cell-key={dataCellKey}
      type="text"
      inputMode="decimal"
      value={editing ? draft : formatPtoCellNumber(value)}
      onFocus={() => {
        if (!shouldSkipFocusSelection()) onSelectCell(cell, value);
      }}
      onMouseDown={(event) => onMouseDown(event, cell, value, editing)}
      onMouseEnter={(event) => onMouseEnter(event, cell, value, editing)}
      onClick={(event) => {
        if (event.shiftKey && !editing) onSelectRange(cell, value);
      }}
      onDoubleClick={(event) => {
        onStartEdit(cell, value);
        event.currentTarget.select();
      }}
      onChange={(event) => onDraftChange(event.target.value)}
      onBlur={() => {
        if (editing) onCommitEdit();
      }}
      onKeyDown={(event) => onKeyDown(event, cell, value, editing)}
      placeholder={placeholder}
      title={formatPtoFormulaNumber(value)}
      style={style}
    />
  );
}
