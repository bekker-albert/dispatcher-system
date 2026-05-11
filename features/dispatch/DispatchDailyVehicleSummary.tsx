import type { CSSProperties } from "react";

import type { DispatchSummaryRow } from "@/lib/domain/dispatch/summary";
import { formatPtoCellNumber } from "@/lib/domain/pto/formatting";

type DispatchDailyVehicleSummaryProps = {
  rows: DispatchSummaryRow[];
};

const wrapStyle: CSSProperties = {
  overflow: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  marginBottom: 10,
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 820,
  borderCollapse: "collapse",
  fontSize: 12,
};

const thStyle: CSSProperties = {
  padding: "8px 9px",
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  color: "#0f172a",
  fontWeight: 800,
  textAlign: "left",
};

const tdStyle: CSSProperties = {
  padding: "7px 9px",
  border: "1px solid #e2e8f0",
  color: "#334155",
};

export function DispatchDailyVehicleSummary({ rows }: DispatchDailyVehicleSummaryProps) {
  return (
    <div style={wrapStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Техника</th>
            <th style={thStyle}>Участок</th>
            <th style={thStyle}>Местонахождение</th>
            <th style={thStyle}>Аренда</th>
            <th style={thStyle}>Работа</th>
            <th style={thStyle}>Простой</th>
            <th style={thStyle}>Ремонт</th>
            <th style={thStyle}>Рейсы</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td style={tdStyle}>{row.vehicleName || "Без техники"}</td>
              <td style={tdStyle}>{row.area}</td>
              <td style={tdStyle}>{row.location}</td>
              <td style={tdStyle}>{formatPtoCellNumber(row.rentHours)}</td>
              <td style={tdStyle}>{formatPtoCellNumber(row.workHours)}</td>
              <td style={tdStyle}>{formatPtoCellNumber(row.downtimeHours)}</td>
              <td style={tdStyle}>{formatPtoCellNumber(row.repairHours)}</td>
              <td style={tdStyle}>{formatPtoCellNumber(row.trips)}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                Нет строк техники за сутки.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
