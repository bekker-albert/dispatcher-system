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

const FACT_SOURCE_VISIBLE_LABEL_LIMIT = 2;

function sourceRowLabel(row: ReportRow, rowLabels: Record<string, string>) {
  return (rowLabels[reportRowKey(row)]?.trim() || row.name).replace(/\s+/g, " ");
}

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
  const selectedLabels = selectedRows.map((row) => sourceRowLabel(row, rowLabels));
  const compactLabels = selectedLabels.slice(0, FACT_SOURCE_VISIBLE_LABEL_LIMIT);
  const hiddenSourceCount = Math.max(selectedLabels.length - compactLabels.length, 0);
  const selectedTitle = isSumMode
    ? selectedLabels.length > 0
      ? `Сумма строк (${sourceRowKeys.length}): ${selectedLabels.join(" + ")}`
      : `Сумма строк: ${sourceRowKeys.length}`
    : "Свой факт";
  const selectedBadgeText = isSumMode
    ? [
        `Сумма: ${sourceRowKeys.length}`,
        compactLabels.join(" + "),
        hiddenSourceCount > 0 ? `еще ${hiddenSourceCount}` : "",
      ].filter(Boolean).join(" · ")
    : "Свой";

  return (
    <div style={factSourceCellStyle}>
      <span
        style={isSumMode ? factSourceSumBadgeStyle : factSourceOwnBadgeStyle}
        title={selectedTitle}
        aria-label={selectedTitle}
      >
        {selectedBadgeText}
      </span>
      <MiniIconButton label="Настроить источник факта" onClick={onEdit}>
        <Pencil size={13} aria-hidden />
      </MiniIconButton>
    </div>
  );
}
