import type { CSSProperties } from "react";

export const ptoPlanInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 0,
  padding: "3px 4px",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.25,
  outline: "none",
  fontVariantNumeric: "tabular-nums",
  background: "transparent",
};

export const ptoCompactNumberInputStyle: CSSProperties = {
  minWidth: 0,
  cursor: "cell",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "visible",
  textOverflow: "clip",
};

export const ptoStatusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 25,
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderRadius: 4,
  padding: "3px 6px",
  fontWeight: 800,
  lineHeight: 1.15,
  textAlign: "center",
  whiteSpace: "normal",
};

export const ptoReadonlyTotalStyle: CSSProperties = {
  width: "100%",
  minWidth: 92,
  border: "1px solid transparent",
  borderRadius: 0,
  background: "transparent",
  color: "#0f172a",
  cursor: "cell",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.25,
  padding: "3px 4px",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "visible",
  textOverflow: "clip",
};

export const ptoReadonlyCellTextStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.25,
  padding: "4px 5px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const ptoReadonlyCellNumberStyle: CSSProperties = {
  ...ptoReadonlyCellTextStyle,
  textAlign: "center",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
  overflow: "visible",
  textOverflow: "clip",
};

export const ptoPlanDayInputStyle: CSSProperties = {
  ...ptoPlanInputStyle,
  minWidth: 82,
  textAlign: "center",
};
