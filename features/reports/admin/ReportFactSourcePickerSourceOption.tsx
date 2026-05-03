"use client";

import { reportRowKey } from "@/lib/domain/reports/display";
import {
  sourceNameStyle,
  sourceOptionStyle,
  sourceUnitStyle,
} from "./ReportFactSourcePickerStyles";
import type { ReportFactSourceOptionProps } from "./ReportFactSourcePickerTypes";
import { repairAdminReportText } from "./adminReportText";

export function ReportFactSourcePickerSourceOption({
  customer,
  targetRowKey,
  sourceRow,
  sourceRowKeys,
  onToggleSource,
}: ReportFactSourceOptionProps) {
  const sourceRowKey = reportRowKey(sourceRow);
  const sourceRowLabel = repairAdminReportText(customer.rowLabels[sourceRowKey]?.trim() || sourceRow.name);
  const sourceUnitLabel = repairAdminReportText(sourceRow.unit);

  return (
    <label style={sourceOptionStyle}>
      <input
        type="checkbox"
        checked={sourceRowKeys.includes(sourceRowKey)}
        onChange={() => onToggleSource(customer.id, targetRowKey, sourceRowKey)}
      />
      <span style={sourceNameStyle}>{sourceRowLabel}</span>
      <span style={sourceUnitStyle}>{sourceUnitLabel}</span>
    </label>
  );
}
