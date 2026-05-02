import type { CSSProperties } from "react";

export const sectionStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 12,
  background: "#ffffff",
  marginBottom: 16,
};

export const titleStyle: CSSProperties = {
  fontWeight: 700,
  marginBottom: 12,
};

export const tableHeaderRowStyle: CSSProperties = {
  background: "#f1f5f9",
  textAlign: "left",
};

export const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 1180,
  borderCollapse: "collapse",
  fontSize: 14,
};

export {
  actionButtonsStyle,
  addFormStyle,
  detailCellStyle,
  inlineEditStyle,
  inputStyle,
} from "./AdminStructureSharedStyles";
