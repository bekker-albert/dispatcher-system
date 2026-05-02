import type { CSSProperties } from "react";

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
  minWidth: 1120,
  borderCollapse: "collapse",
  fontSize: 14,
};

export const primaryTextStyle: CSSProperties = {
  fontWeight: 700,
  color: "#0f172a",
};

export {
  actionButtonsStyle,
  addFormStyle,
  detailCellStyle,
  inlineEditStyle,
  inputStyle,
} from "./AdminStructureSharedStyles";
