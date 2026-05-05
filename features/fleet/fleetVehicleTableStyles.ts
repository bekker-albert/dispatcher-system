import type { CSSProperties } from "react";

import type { FleetVehicleStatus } from "@/features/fleet/fleetVehicleModel";

export const sectionStyle: CSSProperties = {
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

export const toolbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
};

export const toolbarActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

export const summaryStyle: CSSProperties = {
  color: "#475569",
  fontSize: 13,
  fontWeight: 700,
};

export const driverToggleStyle: CSSProperties = {
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "#cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 6,
  padding: "7px 10px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
};

export const tableScrollStyle: CSSProperties = {
  overflow: "auto",
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "#0f172a",
  maxHeight: "calc(100vh - 174px)",
};

export const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "auto",
  fontSize: 12,
};

export const thStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  background: "#f8fafc",
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "#94a3b8",
  padding: "7px 8px",
  textAlign: "center",
  verticalAlign: "middle",
  fontWeight: 700,
  whiteSpace: "normal",
  lineHeight: 1.2,
};

export const tdBaseStyle: CSSProperties = {
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "#cbd5e1",
  padding: "6px 8px",
  verticalAlign: "middle",
  lineHeight: 1.2,
  overflowWrap: "break-word",
};

export const tdStyle: CSSProperties = {
  ...tdBaseStyle,
  textAlign: "left",
};

export const tdCenterStyle: CSSProperties = {
  ...tdBaseStyle,
  textAlign: "center",
};

export const emptyStateCellStyle: CSSProperties = {
  ...tdBaseStyle,
  padding: "18px 12px",
  textAlign: "center",
  color: "#64748b",
  fontStyle: "italic",
};

export const spacerCellStyle: CSSProperties = {
  padding: 0,
  borderWidth: 0,
  height: 0,
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 78,
  borderRadius: 6,
  padding: "3px 7px",
  fontSize: 11,
  fontWeight: 700,
};

export function statusBadgeStyle(status: FleetVehicleStatus): CSSProperties {
  if (status === "В ремонте") {
    return { ...badgeStyle, background: "#fee2e2", color: "#991b1b" };
  }

  if (status === "В простое") {
    return { ...badgeStyle, background: "#fef3c7", color: "#92400e" };
  }

  return { ...badgeStyle, background: "#dcfce7", color: "#166534" };
}

export const fleetPrintCss = `@media print {
  @page {
    size: A3 landscape;
    margin: 5mm;
  }

  .fleet-print-area,
  .fleet-print-area * {
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }

  .fleet-print-toolbar {
    display: none !important;
  }

  .fleet-print-area {
    display: block !important;
    gap: 0 !important;
    width: 100% !important;
  }

  .fleet-print-table-scroll {
    border-color: #0f172a !important;
    max-height: none !important;
    overflow: visible !important;
  }

  .fleet-print-table {
    font-size: 8pt !important;
    width: 100% !important;
  }

  .fleet-print-table th {
    background: #f1f5f9 !important;
    position: static !important;
  }

  .fleet-print-table thead {
    display: table-header-group !important;
  }

  .fleet-print-table tr {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .fleet-print-table th,
  .fleet-print-table td {
    border-color: #64748b !important;
    padding: 3px 4px !important;
    line-height: 1.1 !important;
  }
}`;
