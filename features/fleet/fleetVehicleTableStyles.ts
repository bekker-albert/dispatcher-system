import type { CSSProperties } from "react";

import type { FleetVehicleStatus } from "@/features/fleet/fleetVehicleModel";

export const sectionStyle: CSSProperties = {
  flex: "1 1 auto",
  height: "calc(100vh - 150px)",
  minHeight: 420,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  overflow: "hidden",
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
  flex: "1 1 auto",
  minHeight: 0,
  overflow: "auto",
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "#0f172a",
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
    margin: 0.5cm;
  }

  html,
  body {
    background: #ffffff !important;
    height: auto !important;
    margin: 0 !important;
    overflow: visible !important;
    padding: 0 !important;
  }

  .app-print-root,
  .app-print-shell {
    background: #ffffff !important;
    height: auto !important;
    margin: 0 !important;
    max-width: none !important;
    min-height: 0 !important;
    overflow: visible !important;
    padding: 0 !important;
    width: 100% !important;
  }

  html.fleet-print-mode body *,
  body:has(.fleet-print-area) * {
    visibility: hidden !important;
  }

  html.fleet-print-mode .fleet-print-area,
  html.fleet-print-mode .fleet-print-area *,
  body:has(.fleet-print-area) .fleet-print-area,
  body:has(.fleet-print-area) .fleet-print-area * {
    visibility: visible !important;
  }

  html.fleet-print-mode .erp-shell,
  html.fleet-print-mode .erp-main,
  html.fleet-print-mode .erp-content,
  body:has(.fleet-print-area) .erp-shell,
  body:has(.fleet-print-area) .erp-main,
  body:has(.fleet-print-area) .erp-content {
    display: block !important;
    gap: 0 !important;
    grid-column: auto !important;
    grid-template-columns: none !important;
    height: auto !important;
    margin: 0 !important;
    max-width: none !important;
    min-height: 0 !important;
    overflow: visible !important;
    padding: 0 !important;
    position: static !important;
    width: 100% !important;
  }

  .app-print-header,
  .app-save-status,
  .ai-floating-dock,
  .erp-sidebar,
  .erp-sidebar__toggle,
  .erp-topbar,
  .erp-mobile-backdrop,
  .no-print {
    display: none !important;
    visibility: hidden !important;
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
    height: auto !important;
    inset: auto !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    min-height: 0 !important;
    overflow: visible !important;
    padding: 0 !important;
    position: static !important;
  }

  .fleet-print-table-scroll {
    border-color: #0f172a !important;
    max-height: none !important;
    overflow: visible !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
  }

  .fleet-print-table {
    border-collapse: collapse !important;
    font-size: 7pt !important;
    table-layout: fixed !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    page-break-inside: auto !important;
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
    box-sizing: border-box !important;
    overflow-wrap: anywhere !important;
    padding: 2px 3px !important;
    line-height: 1.1 !important;
    white-space: normal !important;
  }
}`;
