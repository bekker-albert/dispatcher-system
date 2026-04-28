import type { CSSProperties } from "react";

export const ptoAreaCellStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};

export const ptoRowToolsStyle: CSSProperties = {
  position: "absolute",
  left: -32,
  top: "50%",
  transform: "translateY(-50%)",
  width: 28,
  height: 30,
  display: "grid",
  placeItems: "center",
};

export const dragHandleStyle: CSSProperties = {
  width: 18,
  height: 24,
  border: "none",
  background: "transparent",
  color: "#475569",
  cursor: "grab",
  fontFamily: "inherit",
  display: "inline-grid",
  placeItems: "center",
  padding: 0,
  flex: "0 0 auto",
};

export const ptoRowDeleteButtonStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 24,
  height: 26,
  border: "none",
  background: "transparent",
  color: "#991b1b",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  opacity: 0.72,
  zIndex: 6,
};

export const ptoInlineAddRowButtonStyle: CSSProperties = {
  position: "absolute",
  left: -27,
  bottom: -10,
  width: 18,
  height: 18,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#bfdbfe",
  borderRadius: 4,
  background: "#ffffff",
  color: "#2563eb",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: "16px",
  opacity: 0.28,
  padding: 0,
  transition: "opacity 120ms ease, background 120ms ease, border-color 120ms ease",
  zIndex: 6,
};

export const ptoInlineAddRowButtonHoverStyle: CSSProperties = {
  opacity: 1,
  background: "#dbeafe",
  borderColor: "#60a5fa",
};

export const ptoDropIndicatorStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  height: 3,
  background: "#2563eb",
  borderRadius: 999,
  pointerEvents: "none",
  zIndex: 3,
};

export const ptoRowResizeHandleStyle: CSSProperties = {
  position: "absolute",
  left: -24,
  right: 0,
  bottom: -4,
  height: 8,
  cursor: "row-resize",
  zIndex: 8,
};

export const dragHandleDotsStyle: CSSProperties = {
  width: 6,
  display: "grid",
  gap: 3,
  justifyItems: "center",
};

export const dragHandleDotStyle: CSSProperties = {
  width: 4,
  height: 4,
  borderRadius: 999,
  background: "#64748b",
};

export const ptoDraftRowStyle: CSSProperties = {
  background: "#f8fafc",
  color: "#64748b",
};

export const ptoDraftAddButtonStyle: CSSProperties = {
  position: "absolute",
  left: -28,
  top: "50%",
  transform: "translateY(-50%)",
  width: 20,
  height: 20,
  border: "1px solid #bfdbfe",
  borderRadius: 4,
  background: "#ffffff",
  color: "#2563eb",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: "18px",
  opacity: 0.75,
  padding: 0,
};

export const ptoDraftInputStyle: CSSProperties = {
  background: "transparent",
  borderColor: "transparent",
  color: "#64748b",
  fontStyle: "italic",
};

export const ptoDraftStatusStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 29,
  border: "1px solid transparent",
  borderRadius: 0,
  background: "transparent",
  color: "#64748b",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  padding: "6px 8px",
};

export const ptoDraftCellHintStyle: CSSProperties = {
  display: "block",
  minHeight: 29,
};
