"use client";

import type { KeyboardEvent } from "react";
import { allAreasLabel } from "@/features/pto/ptoBucketsConfig";
import {
  ptoBucketAddButtonStyle,
  ptoBucketDraftCellStyle,
  ptoBucketDraftRowStyle,
  ptoBucketHorizontalSpacerStyle,
  ptoBucketsTdStyle,
  ptoBucketTextInputStyle,
} from "@/features/pto/ptoBucketsStyles";
import type { PtoBucketsDraftRowValue, PtoBucketsVirtualColumnsView } from "@/features/pto/PtoBucketsTableTypes";

type PtoBucketsDraftRowProps = {
  draftRow: PtoBucketsDraftRowValue;
  ptoAreaFilter: string;
  virtualColumns: PtoBucketsVirtualColumnsView;
  onAddManualRow: () => void;
  onSetDraftRowArea: (area: string) => void;
  onSetDraftRowStructure: (structure: string) => void;
};

export function PtoBucketsDraftRow({
  draftRow,
  ptoAreaFilter,
  virtualColumns,
  onAddManualRow,
  onSetDraftRowArea,
  onSetDraftRowStructure,
}: PtoBucketsDraftRowProps) {
  const handleSubmitKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onAddManualRow();
  };

  return (
    <tr style={ptoBucketDraftRowStyle}>
      <td style={ptoBucketsTdStyle}>
        <input
          data-pto-bucket-draft-input
          value={draftRow.area}
          list="pto-bucket-area-options"
          onChange={(event) => onSetDraftRowArea(event.target.value)}
          onKeyDown={handleSubmitKeyDown}
          placeholder={ptoAreaFilter === allAreasLabel ? "Участок" : ptoAreaFilter}
          style={ptoBucketTextInputStyle}
        />
      </td>
      <td style={ptoBucketsTdStyle}>
        <div style={ptoBucketDraftCellStyle}>
          <input
            data-pto-bucket-draft-input
            value={draftRow.structure}
            onChange={(event) => onSetDraftRowStructure(event.target.value)}
            onKeyDown={handleSubmitKeyDown}
            placeholder="Временная структура"
            style={ptoBucketTextInputStyle}
          />
          <button
            type="button"
            onClick={onAddManualRow}
            title="Добавить временную строку"
            style={ptoBucketAddButtonStyle}
          >
            +
          </button>
        </div>
      </td>
      {virtualColumns.leftSpacerWidth > 0 ? <td aria-hidden style={ptoBucketHorizontalSpacerStyle} /> : null}
      {virtualColumns.columns.map((column) => (
        <td key={column.key} style={ptoBucketsTdStyle} />
      ))}
      {virtualColumns.rightSpacerWidth > 0 ? <td aria-hidden style={ptoBucketHorizontalSpacerStyle} /> : null}
    </tr>
  );
}
