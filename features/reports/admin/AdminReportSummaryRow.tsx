"use client";

import { Check, Pencil, Trash2 } from "lucide-react";
import { reportRowKey } from "@/lib/domain/reports/display";
import type { ReportCustomerConfig, ReportRow, ReportSummaryRowConfig } from "@/lib/domain/reports/types";
import { MiniIconButton } from "@/shared/ui/buttons";
import {
  emptyTextStyle,
  summaryCardStyle,
  summaryCompactInputStyle,
  summaryFormStyle,
  summaryNoteStyle,
  summaryPlanPickerStyle,
  summaryRowNameStyle,
  summaryRowOptionStyle,
  summaryRowsGridStyle,
  summaryRowsHeaderStyle,
  summaryRowUnitStyle,
  summarySelectionPanelStyle,
  summaryUnitValueStyle,
  summaryValueStyle,
} from "./adminReportSummarySettingsStyles";
import type { SummaryUpdateField } from "./adminReportSummarySettingsTypes";
import { buildAdminReportSummaryRowModel } from "./summarySettingsViewModel";
import { repairAdminReportText } from "./adminReportText";

type AdminReportSummaryRowProps = {
  customer: ReportCustomerConfig;
  summary: ReportSummaryRowConfig;
  areaOptions: string[];
  expandedIds: string[];
  rowsForArea: (area: string) => ReportRow[];
  onUpdate: (customerId: string, summaryId: string, field: SummaryUpdateField, value: string) => void;
  onToggleRow: (customerId: string, summaryId: string, rowKey: string) => void;
  onStartEdit: (summaryId: string) => void;
  onFinishEdit: (summaryId: string) => void;
  onRemove: (customerId: string, summaryId: string) => void;
};

export function AdminReportSummaryRow({
  customer,
  summary,
  areaOptions,
  expandedIds,
  rowsForArea,
  onUpdate,
  onToggleRow,
  onStartEdit,
  onFinishEdit,
  onRemove,
}: AdminReportSummaryRowProps) {
  const {
    hasStoredArea,
    visibleSummaryArea,
    summaryAreaRows,
    selectedSummaryRows,
    summaryExpanded,
    selectedSummaryText,
    selectedPlanRow,
    selectedPlanText,
  } = buildAdminReportSummaryRowModel({
    customer,
    summary,
    areaOptions,
    expandedIds,
    rowsForArea,
  });
  const selectedPlanLabel = repairAdminReportText(selectedPlanText);
  const selectedSummaryLabel = repairAdminReportText(selectedSummaryText);

  return (
    <div style={summaryCardStyle}>
      <div style={summaryFormStyle}>
        <SummaryFields
          customer={customer}
          summary={summary}
          areaOptions={areaOptions}
          hasStoredArea={hasStoredArea}
          visibleSummaryArea={visibleSummaryArea}
          summaryExpanded={summaryExpanded}
          onUpdate={onUpdate}
        />
        <MiniIconButton label={summaryExpanded ? "Сохранить суммирование" : "Редактировать суммирование"} onClick={() => (summaryExpanded ? onFinishEdit(summary.id) : onStartEdit(summary.id))}>
          {summaryExpanded ? <Check size={13} aria-hidden /> : <Pencil size={13} aria-hidden />}
        </MiniIconButton>
        <MiniIconButton label="Удалить итоговую строку" onClick={() => onRemove(customer.id, summary.id)}>
          <Trash2 size={16} aria-hidden />
        </MiniIconButton>
      </div>
      <div style={summaryNoteStyle} title={selectedPlanLabel}>План из ПТО: {selectedPlanLabel}</div>
      <div style={summaryNoteStyle} title={selectedSummaryLabel}>Строки в сумме: {selectedSummaryLabel}</div>

      {summaryExpanded ? (
        <SummarySelectionPanel
          customer={customer}
          summary={summary}
          summaryAreaRows={summaryAreaRows}
          selectedSummaryRowsCount={selectedSummaryRows.length}
          selectedPlanRow={selectedPlanRow}
          onUpdate={onUpdate}
          onToggleRow={onToggleRow}
        />
      ) : null}
    </div>
  );
}

type SummaryFieldsProps = {
  customer: ReportCustomerConfig;
  summary: ReportSummaryRowConfig;
  areaOptions: string[];
  hasStoredArea: boolean;
  visibleSummaryArea: string;
  summaryExpanded: boolean;
  onUpdate: (customerId: string, summaryId: string, field: SummaryUpdateField, value: string) => void;
};

function SummaryFields({
  customer,
  summary,
  areaOptions,
  hasStoredArea,
  visibleSummaryArea,
  summaryExpanded,
  onUpdate,
}: SummaryFieldsProps) {
  if (!summaryExpanded) {
    const summaryAreaLabel = repairAdminReportText(visibleSummaryArea);
    const summaryNameLabel = repairAdminReportText(summary.label);
    const summaryUnitLabel = repairAdminReportText(summary.unit);

    return (
      <>
        <span style={summaryValueStyle}>{summaryAreaLabel || "-"}</span>
        <span style={summaryValueStyle}>{summaryNameLabel || "Без названия"}</span>
        <span style={summaryUnitValueStyle}>{summaryUnitLabel || "Авто"}</span>
      </>
    );
  }
  const summaryNameValue = repairAdminReportText(summary.label);

  return (
    <>
      <select value={visibleSummaryArea} onChange={(event) => onUpdate(customer.id, summary.id, "area", event.target.value)} style={summaryCompactInputStyle} aria-label="Участок итоговой строки">
        {areaOptions.map((area) => (
          <option key={area} value={area}>{repairAdminReportText(area)}</option>
        ))}
        {!hasStoredArea && summary.area ? <option value={summary.area}>{repairAdminReportText(summary.area)}</option> : null}
      </select>
      <input value={summaryNameValue} onChange={(event) => onUpdate(customer.id, summary.id, "label", event.target.value)} style={summaryCompactInputStyle} aria-label="Название итоговой строки" />
      <select value={summary.unit} onChange={(event) => onUpdate(customer.id, summary.id, "unit", event.target.value)} style={summaryCompactInputStyle} aria-label="Единица измерения итоговой строки">
        <option value="">Авто</option>
        <option value="м2">м2</option>
        <option value="м3">м3</option>
        <option value="тн">тн</option>
      </select>
    </>
  );
}

type SummarySelectionPanelProps = {
  customer: ReportCustomerConfig;
  summary: ReportSummaryRowConfig;
  summaryAreaRows: ReportRow[];
  selectedSummaryRowsCount: number;
  selectedPlanRow: ReportRow | undefined;
  onUpdate: (customerId: string, summaryId: string, field: SummaryUpdateField, value: string) => void;
  onToggleRow: (customerId: string, summaryId: string, rowKey: string) => void;
};

function SummarySelectionPanel({
  customer,
  summary,
  summaryAreaRows,
  selectedSummaryRowsCount,
  selectedPlanRow,
  onUpdate,
  onToggleRow,
}: SummarySelectionPanelProps) {
  return (
    <div style={summarySelectionPanelStyle}>
      <div style={summaryPlanPickerStyle}>
        <span style={summaryRowsHeaderStyle}>План из ПТО</span>
        <select
          value={selectedPlanRow ? summary.planRowKey ?? "" : ""}
          onChange={(event) => onUpdate(customer.id, summary.id, "planRowKey", event.target.value)}
          style={summaryCompactInputStyle}
          aria-label="План из ПТО для итоговой строки"
        >
          <option value="">Авто: сумма выбранных строк</option>
          {summaryAreaRows.map((row) => {
            const rowKey = reportRowKey(row);
            const customerRowLabel = repairAdminReportText(customer.rowLabels[rowKey]?.trim() || row.name);
            return <option key={`${summary.id}-plan-${rowKey}`} value={rowKey}>{customerRowLabel}</option>;
          })}
        </select>
      </div>
      <div style={summaryRowsHeaderStyle}>Выберите виды работ для суммирования: {selectedSummaryRowsCount} из {summaryAreaRows.length}</div>
      <div style={summaryRowsGridStyle}>
        {summaryAreaRows.length === 0 ? (
          <div style={emptyTextStyle}>В выбранном участке строк пока нет.</div>
        ) : (
          summaryAreaRows.map((row) => {
            const rowKey = reportRowKey(row);
            const customerRowLabel = repairAdminReportText(customer.rowLabels[rowKey]?.trim() || row.name);
            const rowUnitLabel = repairAdminReportText(row.unit);
            return (
              <label key={`${summary.id}-${rowKey}`} style={summaryRowOptionStyle}>
                <input type="checkbox" checked={summary.rowKeys.includes(rowKey)} onChange={() => onToggleRow(customer.id, summary.id, rowKey)} />
                <span style={summaryRowNameStyle}>{customerRowLabel}</span>
                <span style={summaryRowUnitStyle}>{rowUnitLabel}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
