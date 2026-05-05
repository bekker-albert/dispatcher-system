import type { CSSProperties } from "react";

export const appHeaderStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 20,
  boxShadow: "none",
  marginBottom: 20,
};

export const appHeaderRowStyle: CSSProperties = {
  display: "flex",
  gap: 14,
  alignItems: "center",
  flexWrap: "wrap",
};

export const appHeaderLogoCellStyle: CSSProperties = {
  width: 130,
  flex: "0 0 130px",
};

export const headerNavStackStyle: CSSProperties = {
  flex: "1 1 720px",
  display: "grid",
  gap: 6,
  minWidth: 280,
  position: "relative",
};

export const headerNavStackPtoStyle: CSSProperties = {
  paddingBottom: 0,
};

export const headerMainTabsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  alignItems: "center",
};

export const headerActiveTabWithSubtabsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
};

export const headerSubtabsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  alignItems: "center",
  justifyContent: "flex-start",
  boxSizing: "border-box",
  minWidth: 0,
  width: "fit-content",
  maxWidth: "100%",
  borderTop: "1px solid #0f172a",
  paddingTop: 6,
  overflow: "hidden",
};

export const logoImageStyle: CSSProperties = {
  width: 112,
  height: 72,
  objectFit: "contain",
  display: "block",
};

export const workDateStyle: CSSProperties = {
  width: 170,
  flex: "0 0 170px",
};

export const headerActionsStyle: CSSProperties = {
  flex: "0 0 190px",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "center",
  gap: 3,
  marginLeft: "auto",
};

export const dateInputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  outline: "none",
  fontSize: 14,
  background: "#ffffff",
};

export function getHeaderSubtabsPositionStyle(headerSubtabsOffset: number): CSSProperties {
  return {
    marginLeft: headerSubtabsOffset,
    maxWidth: headerSubtabsOffset > 0 ? `max(0px, calc(100% - ${headerSubtabsOffset}px))` : "100%",
  };
}
