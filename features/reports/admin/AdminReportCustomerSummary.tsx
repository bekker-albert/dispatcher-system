import type { CSSProperties } from "react";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";
import { repairAdminReportText } from "./adminReportText";

export function AdminReportCustomerSummary({
  activeCustomer,
  selectedCount,
  usesSummaryRows,
  onUpdateCustomer,
}: {
  activeCustomer: ReportCustomerConfig;
  selectedCount: number;
  usesSummaryRows: boolean;
  onUpdateCustomer: (customerId: string, patch: Partial<Pick<ReportCustomerConfig, "label" | "ptoCode" | "visible" | "autoShowRows">>) => void;
}) {
  const customerLabel = repairAdminReportText(activeCustomer.label);
  const ptoCodeLabel = repairAdminReportText(activeCustomer.ptoCode);

  return (
    <div style={customerSummaryStyle}>
      <input
        aria-label="Заказчик"
        value={customerLabel}
        onChange={(event) => onUpdateCustomer(activeCustomer.id, { label: event.target.value })}
        style={customerNameInputStyle}
      />
      <input
        aria-label="Сокращение заказчика для ПТО"
        value={ptoCodeLabel}
        onChange={(event) => onUpdateCustomer(activeCustomer.id, { ptoCode: event.target.value })}
        style={{ ...customerNameInputStyle, textAlign: "center" }}
        title="Этот код используется в столбце Заказчик во вкладке ПТО - План"
      />
      <div style={customerMetaStyle}>
        Код ПТО: {ptoCodeLabel || "не задан"} · {selectedCount} строк{usesSummaryRows ? ` · ${activeCustomer.summaryRows.length} итоговых` : ""}
      </div>
      <label style={visibleToggleStyle}>
        <input type="checkbox" checked={activeCustomer.visible} onChange={(event) => onUpdateCustomer(activeCustomer.id, { visible: event.target.checked })} />
        Показывать вкладку
      </label>
      <label style={visibleToggleStyle}>
        <input type="checkbox" checked={activeCustomer.autoShowRows} onChange={(event) => onUpdateCustomer(activeCustomer.id, { autoShowRows: event.target.checked })} />
        Автоматический показ строк
      </label>
    </div>
  );
}

const customerSummaryStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(180px, 300px) 72px auto auto auto",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  background: "#ffffff",
};

const customerNameInputStyle: CSSProperties = {
  minWidth: 0,
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1.25,
  outline: "none",
  padding: "7px 9px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const customerMetaStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  whiteSpace: "nowrap",
};

const visibleToggleStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap",
};
