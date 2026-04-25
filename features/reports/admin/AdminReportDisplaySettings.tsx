"use client";

import type { CSSProperties } from "react";
import { ptoStatusControlStyle } from "@/features/pto/PtoDateTableParts";
import { reportRowAutoStatus, reportRowKey } from "@/lib/domain/reports/display";
import type { ReportCustomerConfig, ReportRow } from "@/lib/domain/reports/types";
import { ReportFactSourceCell, ReportFactSourceModal } from "./ReportFactSourcePicker";

type AdminReportDisplaySettingsProps = {
  customer: ReportCustomerConfig;
  rows: ReportRow[];
  rowsByKey: Map<string, ReportRow>;
  visibleRowKeys: Set<string>;
  derivedRowsByKey: Map<string, ReportRow>;
  editingFactSourceRow: ReportRow | null;
  editingFactSourceOptions: ReportRow[];
  onToggleRow: (customerId: string, rowKey: string) => void;
  onEditFactSource: (rowKey: string | null) => void;
  onSetFactSourceMode: (customerId: string, targetRowKey: string, enabled: boolean) => void;
  onToggleFactSourceRow: (customerId: string, targetRowKey: string, sourceRowKey: string) => void;
};

export default function AdminReportDisplaySettings({
  customer,
  rows,
  rowsByKey,
  visibleRowKeys,
  derivedRowsByKey,
  editingFactSourceRow,
  editingFactSourceOptions,
  onToggleRow,
  onEditFactSource,
  onSetFactSourceMode,
  onToggleFactSourceRow,
}: AdminReportDisplaySettingsProps) {
  return (
    <div style={rowsColumnStyle}>
      <div style={tableWrapStyle}>
        <table style={rowsTableStyle}>
          <colgroup>
            <col style={{ width: 54 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 720 }} />
            <col style={{ width: 56 }} />
            <col style={{ width: 116 }} />
            <col style={{ width: 142 }} />
          </colgroup>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={thStyle}>Показ</th>
              <th style={thStyle}>Участок</th>
              <th style={thStyle}>Строка из ПТО</th>
              <th style={thStyle}>Ед.</th>
              <th style={thStyle}>Статус</th>
              <th style={thStyle}>Факт/замер</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowKey = reportRowKey(row);
              const rowStatus = reportRowAutoStatus(derivedRowsByKey.get(rowKey) ?? row);
              const factSourceRowKeys = customer.factSourceRowKeys[rowKey] ?? [];

              return (
                <tr key={`${customer.id}-${rowKey}`}>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={visibleRowKeys.has(rowKey)}
                      disabled={customer.autoShowRows}
                      onChange={() => onToggleRow(customer.id, rowKey)}
                      style={customer.autoShowRows ? disabledCheckboxStyle : undefined}
                      title={customer.autoShowRows ? "Автоматический показ включен" : "Показать строку в отчете"}
                    />
                  </td>
                  <td style={tdStyle}>{row.area}</td>
                  <td style={nameTdStyle}>{row.name}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{row.unit}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <span style={{ ...ptoStatusBadgeStyle, ...ptoStatusControlStyle(rowStatus) }}>{rowStatus}</span>
                  </td>
                  <td style={tdStyle}>
                    <ReportFactSourceCell
                      sourceRowKeys={factSourceRowKeys}
                      rowsByKey={rowsByKey}
                      rowLabels={customer.rowLabels}
                      onEdit={() => onEditFactSource(rowKey)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ReportFactSourceModal
        customer={customer}
        targetRow={editingFactSourceRow}
        sourceOptions={editingFactSourceOptions}
        onClose={() => onEditFactSource(null)}
        onSetMode={onSetFactSourceMode}
        onToggleSource={onToggleFactSourceRow}
      />
    </div>
  );
}

const rowsColumnStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

const tableWrapStyle: CSSProperties = {
  maxWidth: "100%",
  overflowX: "auto",
};

const rowsTableStyle: CSSProperties = {
  width: "max-content",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  fontSize: 12,
};

const thStyle: CSSProperties = {
  padding: "7px 8px",
  border: "1px solid #cbd5e1",
  color: "#0f172a",
  fontSize: 12,
  textAlign: "left",
  whiteSpace: "normal",
};

const tdStyle: CSSProperties = {
  padding: "6px 8px",
  border: "1px solid #e2e8f0",
  color: "#0f172a",
  verticalAlign: "middle",
};

const nameTdStyle: CSSProperties = {
  ...tdStyle,
  lineHeight: 1.25,
};

const disabledCheckboxStyle: CSSProperties = {
  cursor: "not-allowed",
  opacity: 0.45,
};

const ptoStatusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 96,
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1.15,
  padding: "4px 8px",
};
