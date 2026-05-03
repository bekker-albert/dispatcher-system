import type { CSSProperties } from "react";

export const ptoBucketsLayoutStyle: CSSProperties = {
  display: "grid",
  gap: 10,
};

export const ptoBucketsHintStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  color: "#475569",
  padding: "8px 10px",
  fontSize: 12,
  fontWeight: 700,
};

export const ptoBucketsScrollStyle: CSSProperties = {
  overflow: "auto",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  maxHeight: "calc(100dvh - 310px)",
  minHeight: 260,
};

export const ptoBucketsTableStyle: CSSProperties = {
  width: "100%",
  minWidth: 760,
  borderCollapse: "collapse",
  tableLayout: "fixed",
  fontSize: 12,
};

export const ptoBucketsThStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  background: "#f8fafc",
  color: "#0f172a",
  padding: "6px 8px",
  textAlign: "left",
  verticalAlign: "middle",
  whiteSpace: "normal",
  overflow: "hidden",
  overflowWrap: "break-word",
  wordBreak: "normal",
  hyphens: "none",
  lineHeight: 1.2,
};

export const ptoBucketDuplicateColumnHeaderStyle: CSSProperties = {
  background: "#fee2e2",
  borderColor: "#fecaca",
};

export const ptoBucketsTdStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  padding: 4,
  verticalAlign: "middle",
  background: "#ffffff",
};

export const ptoBucketDuplicateColumnCellStyle: CSSProperties = {
  background: "#fff1f2",
};

export const ptoBucketSpacerCellStyle: CSSProperties = {
  border: "none",
  padding: 0,
  background: "#ffffff",
};

export const ptoBucketHorizontalSpacerStyle: CSSProperties = {
  border: "none",
  padding: 0,
  background: "#ffffff",
};

export const ptoBucketStructureCellStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

export const ptoBucketManualToolsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  flex: "0 0 auto",
};

export const ptoBucketManualBadgeStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 8,
  color: "#475569",
  background: "#f8fafc",
  padding: "2px 5px",
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1.1,
};

export const ptoBucketDeleteButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  border: "none",
  background: "transparent",
  color: "#991b1b",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 2,
  outline: "none",
};

export const ptoBucketDraftRowStyle: CSSProperties = {
  background: "#f8fafc",
};

export const ptoBucketDraftCellStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 24px",
  gap: 4,
  alignItems: "center",
};

export const ptoBucketTextInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 0,
  background: "transparent",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.25,
  outline: "none",
  padding: "3px 4px",
};

export const ptoBucketAddButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: 22,
  height: 22,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 6,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1,
  padding: 0,
  outline: "none",
};

export const ptoBucketReadonlyValueStyle: CSSProperties = {
  minHeight: 22,
  color: "#0f172a",
  fontVariantNumeric: "tabular-nums",
  lineHeight: "22px",
  overflow: "hidden",
  textAlign: "center",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const ptoBucketControlStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 0,
  background: "transparent",
  color: "#0f172a",
  cursor: "cell",
  display: "block",
  fontFamily: "inherit",
  fontSize: 12,
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.25,
  outline: "none",
  overflow: "hidden",
  padding: "3px 4px",
  textAlign: "center",
  textOverflow: "clip",
  whiteSpace: "nowrap",
};

export const ptoToolbarStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: "8px 10px",
  display: "grid",
  gridTemplateColumns: "minmax(220px, 1fr) auto",
  gap: 8,
  alignItems: "end",
};

export const ptoToolbarBlockStyle: CSSProperties = {
  display: "grid",
  gap: 4,
  alignContent: "start",
};

export const ptoToolbarRowStyle: CSSProperties = {
  display: "flex",
  gap: 4,
  flexWrap: "wrap",
  alignItems: "center",
};

export const ptoToolbarLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 700,
};

export const ptoActiveFormulaCellStyle: CSSProperties = {
  outline: "2px solid #2563eb",
  outlineOffset: "-2px",
  zIndex: 2,
};

export const ptoSelectedFormulaCellStyle: CSSProperties = {
  background: "#f0f7ff",
  outline: "2px solid #2563eb",
  outlineOffset: "-2px",
  zIndex: 1,
};

export const ptoEditingFormulaCellStyle: CSSProperties = {
  background: "#eaf4ff",
};
