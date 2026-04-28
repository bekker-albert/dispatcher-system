import type { CSSProperties } from "react";

export const adminVehicleFilterHeaderStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 4,
  minWidth: 0,
};

export const adminVehicleHeaderTextStyle: CSSProperties = {
  minWidth: 0,
  overflow: "visible",
  textOverflow: "clip",
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
  hyphens: "none",
  lineHeight: 1.15,
};

export const adminVehicleHeaderIconStyle: CSSProperties = {
  display: "inline-grid",
  placeItems: "center",
  color: "#0f172a",
  minWidth: 14,
};

export const adminVehicleFilterButtonStyle: CSSProperties = {
  width: 20,
  height: 20,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 5,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  display: "inline-grid",
  placeItems: "center",
  flex: "0 0 auto",
  padding: 0,
};

export const adminVehicleFilterButtonActiveStyle: CSSProperties = {
  borderColor: "#0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

export const adminVehicleFilterMenuStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: "calc(100% + 5px)",
  width: 230,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
  color: "#0f172a",
  padding: 8,
  zIndex: 80,
};

export const adminVehicleFilterMenuTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 6,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const adminVehicleFilterSearchStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 6,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  outline: "none",
  padding: "6px 7px",
};

export const adminVehicleFilterActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 7,
};

export const adminVehicleFilterLinkButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#0f172a",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  padding: 0,
};

export const adminVehicleFilterOptionsStyle: CSSProperties = {
  display: "grid",
  gap: 4,
  maxHeight: 220,
  overflowY: "auto",
  marginTop: 8,
  paddingRight: 2,
};

export const adminVehicleFilterOptionStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "16px minmax(0, 1fr)",
  alignItems: "center",
  gap: 6,
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.2,
  minHeight: 23,
  overflow: "hidden",
  padding: "3px 4px",
};

export const adminVehicleFilterEmptyStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  padding: "8px 4px",
};
