"use client";

import { Pencil } from "lucide-react";
import { reportRowKey } from "@/lib/domain/reports/display";
import type { ReportRow } from "@/lib/domain/reports/types";
import { MiniIconButton } from "@/shared/ui/buttons";
import {
  factSourceCellStyle,
  factSourceOwnBadgeStyle,
  factSourceSumBadgeStyle,
} from "./ReportFactSourcePickerStyles";
import type { ReportFactSourceCellProps } from "./ReportFactSourcePickerTypes";

export function ReportFactSourceCell({
  sourceRowKeys,
  rowsByKey,
  rowLabels,
  onEdit,
}: ReportFactSourceCellProps) {
  const selectedRows = sourceRowKeys
    .map((sourceRowKey) => rowsByKey.get(sourceRowKey))
    .filter((row): row is ReportRow => Boolean(row));
  const isSumMode = sourceRowKeys.length > 0;
  const selectedText = selectedRows.length > 0
    ? selectedRows.map((row) => rowLabels[reportRowKey(row)]?.trim() || row.name).join(" + ")
    : "Свой факт";

  return (
    <div style={factSourceCellStyle}>
      <span style={isSumMode ? factSourceSumBadgeStyle : factSourceOwnBadgeStyle} title={selectedText}>
        {isSumMode ? `Сумма: ${sourceRowKeys.length}` : "Свой"}
      </span>
      <MiniIconButton label="Настроить источник факта" onClick={onEdit}>
        <Pencil size={13} aria-hidden />
      </MiniIconButton>
    </div>
  );
}
