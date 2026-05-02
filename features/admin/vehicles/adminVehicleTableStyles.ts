import type { CSSProperties } from "react";

export const adminVehicleColumnWidths = [46, 165, 190, 100, 120, 112, 96, 96, 170, 180, 34];
export const adminVehicleVirtualRowHeight = 30;
export const adminVehicleVirtualOverscanRows = 8;
export const adminVehicleVirtualizationThreshold = 80;

export const adminVehicleTableScrollStyle: CSSProperties = {
  overflow: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  maxHeight: "calc(100vh - 260px)",
};

export const adminVehicleTableStyle: CSSProperties = {
  width: "100%",
  minWidth: 1309,
  borderCollapse: "collapse",
  tableLayout: "fixed",
  fontSize: 12,
};

export const adminVehicleThStyle: CSSProperties = {
  padding: "5px 6px",
  borderBottom: "1px solid #cbd5e1",
  background: "#f1f5f9",
  color: "#0f172a",
  fontWeight: 800,
  textAlign: "left",
  whiteSpace: "normal",
  lineHeight: 1.15,
  position: "relative",
  overflow: "visible",
  verticalAlign: "middle",
  zIndex: 1,
};

export const adminVehicleTdStyle: CSSProperties = {
  padding: "4px 6px",
  borderBottom: "1px solid #e2e8f0",
  color: "#0f172a",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

export const adminVehicleActionTdStyle: CSSProperties = {
  ...adminVehicleTdStyle,
  padding: "4px 1px",
  overflow: "visible",
  textAlign: "center",
};

export const adminVehicleNameTdStyle: CSSProperties = {
  ...adminVehicleTdStyle,
};

export const adminVehicleEmptyRowStyle: CSSProperties = {
  ...adminVehicleTdStyle,
  color: "#64748b",
  padding: "14px 10px",
  textAlign: "center",
};

export const adminVehicleSpacerCellStyle: CSSProperties = {
  padding: 0,
  borderBottom: 0,
  height: 0,
};

export const adminVehicleNumberTdStyle: CSSProperties = {
  ...adminVehicleTdStyle,
  textAlign: "center",
  fontVariantNumeric: "tabular-nums",
};

export const adminVehicleCheckboxStyle: CSSProperties = {
  width: 14,
  height: 14,
  margin: 0,
  verticalAlign: "middle",
};

export const adminVehicleActionsStyle: CSSProperties = {
  display: "flex",
  gap: 4,
  justifyContent: "center",
  alignItems: "center",
};
