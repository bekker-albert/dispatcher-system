"use client";

import { Plus } from "lucide-react";
import type { ReportCustomerConfig, ReportRow } from "@/lib/domain/reports/types";
import { IconButton } from "@/shared/ui/buttons";
import { AdminReportSummaryRow } from "./AdminReportSummaryRow";
import {
  emptyTextStyle,
  sectionHeaderStyle,
  summaryColumnStyle,
  summaryListHeaderStyle,
} from "./adminReportSummarySettingsStyles";
import type { SummaryUpdateField } from "./adminReportSummarySettingsTypes";

type AdminReportSummarySettingsProps = {
  customer: ReportCustomerConfig;
  areaOptions: string[];
  expandedIds: string[];
  rowsForArea: (area: string) => ReportRow[];
  onAdd: (customerId: string) => void;
  onUpdate: (customerId: string, summaryId: string, field: SummaryUpdateField, value: string) => void;
  onToggleRow: (customerId: string, summaryId: string, rowKey: string) => void;
  onStartEdit: (summaryId: string) => void;
  onFinishEdit: (summaryId: string) => void;
  onRemove: (customerId: string, summaryId: string) => void;
};

export default function AdminReportSummarySettings({
  customer,
  areaOptions,
  expandedIds,
  rowsForArea,
  onAdd,
  onUpdate,
  onToggleRow,
  onStartEdit,
  onFinishEdit,
  onRemove,
}: AdminReportSummarySettingsProps) {
  return (
    <div style={summaryColumnStyle}>
      <div style={sectionHeaderStyle}>
        <IconButton label="Добавить итоговую строку" onClick={() => onAdd(customer.id)}>
          <Plus size={16} aria-hidden />
        </IconButton>
      </div>

      {customer.summaryRows.length === 0 && (
        <div style={emptyTextStyle}>Итоговых строк пока нет.</div>
      )}

      {customer.summaryRows.length > 0 ? <SummaryListHeader /> : null}

      {customer.summaryRows.map((summary) => (
        <AdminReportSummaryRow
          key={summary.id}
          customer={customer}
          summary={summary}
          areaOptions={areaOptions}
          expandedIds={expandedIds}
          rowsForArea={rowsForArea}
          onUpdate={onUpdate}
          onToggleRow={onToggleRow}
          onStartEdit={onStartEdit}
          onFinishEdit={onFinishEdit}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

function SummaryListHeader() {
  return (
    <div style={summaryListHeaderStyle}>
      <span>Участок</span>
      <span>Название итоговой строки</span>
      <span>Ед.</span>
      <span />
      <span />
    </div>
  );
}
