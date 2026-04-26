"use client";

import { Trash2 } from "lucide-react";
import type { CSSProperties, Dispatch, MouseEvent, SetStateAction } from "react";
import { PtoDateEditableTextCell } from "@/features/pto/PtoDateEditableTextCell";
import { PtoPlanTd } from "@/features/pto/PtoDateTableParts";
import type { PtoDropTarget } from "@/features/pto/ptoDateInteractionTypes";
import type { PtoRowsSetter } from "@/features/pto/ptoDateTableTypes";
import type { PtoRowTextField } from "@/features/pto/usePtoRowTextDrafts";
import {
  dragHandleDotStyle,
  dragHandleDotsStyle,
  dragHandleStyle,
  ptoAreaCellStyle,
  ptoInlineAddRowButtonHoverStyle,
  ptoInlineAddRowButtonStyle,
  ptoRowDeleteButtonStyle,
  ptoRowResizeHandleStyle,
  ptoRowToolsStyle,
} from "@/features/pto/ptoDateTableStyles";
import { ptoRowFieldDomKey, type PtoPlanRow } from "@/lib/domain/pto/date-table";

type PtoDateAreaCellProps = {
  row: PtoPlanRow;
  ptoDateEditing: boolean;
  dropLineStyle: CSSProperties | null;
  tableMinWidth: number;
  rowHeightKey: string;
  showInlineAddRowButton: boolean;
  hoveredPtoAddRowId: string | null;
  setRows: PtoRowsSetter;
  setDraggedPtoRowId: Dispatch<SetStateAction<string | null>>;
  setHoveredPtoAddRowId: Dispatch<SetStateAction<string | null>>;
  setPtoDropTarget: Dispatch<SetStateAction<PtoDropTarget | null>>;
  removeLinkedPtoDateRow: (row: PtoPlanRow) => void;
  startPtoRowResize: (event: MouseEvent<HTMLElement>, key: string) => void;
  addPtoRowAfter: (row: PtoPlanRow) => void;
  beginPtoRowTextDraft: (row: PtoPlanRow, field: PtoRowTextField) => void;
  getPtoRowTextDraft: (row: PtoPlanRow, field: PtoRowTextField) => string;
  updatePtoRowTextDraft: (rowId: string, field: PtoRowTextField, value: string) => void;
  commitPtoRowTextDraft: (setRows: PtoRowsSetter, row: PtoPlanRow, field: PtoRowTextField) => void;
  cancelPtoRowTextDraft: (rowId: string, field: PtoRowTextField) => void;
};

export function PtoDateAreaCell({
  row,
  ptoDateEditing,
  dropLineStyle,
  tableMinWidth,
  rowHeightKey,
  showInlineAddRowButton,
  hoveredPtoAddRowId,
  setRows,
  setDraggedPtoRowId,
  setHoveredPtoAddRowId,
  setPtoDropTarget,
  removeLinkedPtoDateRow,
  startPtoRowResize,
  addPtoRowAfter,
  beginPtoRowTextDraft,
  getPtoRowTextDraft,
  updatePtoRowTextDraft,
  commitPtoRowTextDraft,
  cancelPtoRowTextDraft,
}: PtoDateAreaCellProps) {
  return (
    <PtoPlanTd>
      {dropLineStyle ? <span style={dropLineStyle} /> : null}
      {ptoDateEditing ? (
        <button
          type="button"
          onClick={() => removeLinkedPtoDateRow(row)}
          style={{ ...ptoRowDeleteButtonStyle, left: tableMinWidth + 8 }}
          title={`Удалить строку: ${row.structure || "ПТО"}`}
          aria-label={`Удалить строку: ${row.structure || "ПТО"}`}
        >
          <Trash2 size={14} aria-hidden />
        </button>
      ) : null}
      {ptoDateEditing ? (
        <span
          onMouseDown={(event) => startPtoRowResize(event, rowHeightKey)}
          style={ptoRowResizeHandleStyle}
          title="Потяни вниз или вверх, чтобы изменить высоту строки"
          aria-hidden
        />
      ) : null}
      {showInlineAddRowButton ? (
        <button
          type="button"
          onClick={() => addPtoRowAfter(row)}
          onMouseEnter={() => setHoveredPtoAddRowId(row.id)}
          onMouseLeave={() => setHoveredPtoAddRowId((current) => (current === row.id ? null : current))}
          style={{
            ...ptoInlineAddRowButtonStyle,
            ...(hoveredPtoAddRowId === row.id ? ptoInlineAddRowButtonHoverStyle : null),
          }}
          title="Добавить строку ниже"
          aria-label="Добавить строку ниже"
        >
          +
        </button>
      ) : null}
      <div style={ptoAreaCellStyle}>
        {ptoDateEditing ? (
          <div style={ptoRowToolsStyle}>
            <button
              type="button"
              draggable
              onDragStart={() => {
                setDraggedPtoRowId(row.id);
                setPtoDropTarget(null);
              }}
              onDragEnd={() => {
                setDraggedPtoRowId(null);
                setPtoDropTarget(null);
              }}
              style={dragHandleStyle}
              title="Перетащи строку"
              aria-label="Перетащи строку"
            >
              <span style={dragHandleDotsStyle} aria-hidden>
                <span style={dragHandleDotStyle} />
                <span style={dragHandleDotStyle} />
                <span style={dragHandleDotStyle} />
              </span>
            </button>
          </div>
        ) : null}
        <PtoDateEditableTextCell
          editing={ptoDateEditing}
          value={row.area}
          draftValue={getPtoRowTextDraft(row, "area")}
          dataFieldKey={ptoRowFieldDomKey(row.id, "area")}
          listId="pto-area-options"
          placeholder="Уч_Аксу"
          onBeginDraft={() => beginPtoRowTextDraft(row, "area")}
          onUpdateDraft={(value) => updatePtoRowTextDraft(row.id, "area", value)}
          onCommitDraft={() => commitPtoRowTextDraft(setRows, row, "area")}
          onCancelDraft={() => cancelPtoRowTextDraft(row.id, "area")}
        />
      </div>
    </PtoPlanTd>
  );
}
