"use client";

import { reportRowKey } from "@/lib/domain/reports/display";
import {
  sourceNameStyle,
  sourceOptionStyle,
  sourceUnitStyle,
} from "./ReportFactSourcePickerStyles";
import type { ReportFactSourceOptionProps } from "./ReportFactSourcePickerTypes";

export function ReportFactSourcePickerSourceOption({
  customer,
  targetRowKey,
  sourceRow,
  sourceRowKeys,
  onToggleSource,
}: ReportFactSourceOptionProps) {
  const sourceRowKey = reportRowKey(sourceRow);
  const sourceRowLabel = customer.rowLabels[sourceRowKey]?.trim() || sourceRow.name;

  return (
    <label style={sourceOptionStyle}>
      <input
        type="checkbox"
        checked={sourceRowKeys.includes(sourceRowKey)}
        onChange={() => onToggleSource(customer.id, targetRowKey, sourceRowKey)}
      />
      <span style={sourceNameStyle}>{sourceRowLabel}</span>
      <span style={sourceUnitStyle}>{sourceRow.unit}</span>
    </label>
  );
}
