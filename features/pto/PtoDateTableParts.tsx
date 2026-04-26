import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { PtoStatus } from "../../lib/domain/pto/date-table";
import { formatPtoCellNumber, formatPtoFormulaNumber } from "../../lib/domain/pto/formatting";
import { ptoReadonlyCellNumberStyle, ptoReadonlyCellTextStyle } from "./ptoDateTableStyles";

type PtoPlanThProps = {
  children: ReactNode;
  colSpan?: number;
  rowSpan?: number;
  align?: CSSProperties["textAlign"];
  columnKey?: string;
  width?: number;
  onResizeStart?: (event: MouseEvent<HTMLElement>, key: string, width: number) => void;
};

type PtoPlanTdProps = {
  children: ReactNode;
  colSpan?: number;
  active?: boolean;
  selected?: boolean;
  editing?: boolean;
  align?: CSSProperties["textAlign"];
};

type PtoReadonlyTextCellProps = {
  value: string;
  align?: CSSProperties["textAlign"];
};

type PtoReadonlyNumberCellProps = {
  value: number | undefined;
  bold?: boolean;
};

export function PtoPlanTh({
  children,
  colSpan = 1,
  rowSpan = 1,
  align = "left",
  columnKey,
  width,
  onResizeStart,
}: PtoPlanThProps) {
  const justifyContent = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      style={{
        ...ptoPlanThStyle,
        textAlign: align,
        ...(width ? { width, minWidth: width, maxWidth: width } : null),
      }}
    >
      <div style={{ ...ptoHeaderContentStyle, justifyContent, textAlign: align }}>{children}</div>
      {columnKey && width && onResizeStart ? (
        <span
          onMouseDown={(event) => onResizeStart(event, columnKey, width)}
          style={ptoColumnResizeHandleStyle}
          title="Потяни, чтобы изменить ширину столбца"
          aria-hidden
        />
      ) : null}
    </th>
  );
}

export function PtoPlanTd({
  children,
  colSpan = 1,
  active = false,
  selected = false,
  editing = false,
  align,
}: PtoPlanTdProps) {
  return (
    <td
      colSpan={colSpan}
      style={{
        ...ptoPlanTdStyle,
        ...(align ? { textAlign: align } : null),
        ...(selected ? ptoSelectedFormulaCellStyle : null),
        ...(editing ? ptoEditingFormulaCellStyle : null),
        ...(active ? ptoActiveFormulaCellStyle : null),
      }}
    >
      {children}
    </td>
  );
}

export function PtoReadonlyTextCell({ value, align = "left" }: PtoReadonlyTextCellProps) {
  return (
    <div style={{ ...ptoReadonlyCellTextStyle, textAlign: align }} title={value || undefined}>
      {value || ""}
    </div>
  );
}

export function PtoReadonlyNumberCell({ value, bold = false }: PtoReadonlyNumberCellProps) {
  return (
    <div
      style={{
        ...ptoReadonlyCellNumberStyle,
        ...(bold ? { fontWeight: 800 } : null),
      }}
      title={formatPtoFormulaNumber(value)}
    >
      {formatPtoCellNumber(value)}
    </div>
  );
}

const ptoPlanThStyle: CSSProperties = {
  padding: "8px 9px",
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  color: "#0f172a",
  fontWeight: 800,
  textAlign: "left",
  verticalAlign: "middle",
  whiteSpace: "normal",
  position: "relative",
  overflow: "visible",
};

const ptoHeaderContentStyle: CSSProperties = {
  display: "flex",
  width: "100%",
  alignItems: "center",
  minWidth: 0,
  overflow: "visible",
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
  hyphens: "none",
  lineHeight: 1.15,
  textAlign: "inherit",
};

const ptoColumnResizeHandleStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  right: -3,
  width: 7,
  height: "100%",
  cursor: "col-resize",
  zIndex: 12,
};

const ptoPlanTdStyle: CSSProperties = {
  position: "relative",
  padding: 3,
  border: "1px solid #e2e8f0",
  verticalAlign: "middle",
  background: "inherit",
};

const ptoActiveFormulaCellStyle: CSSProperties = {
  boxShadow: "inset 0 0 0 2px #2563eb",
  zIndex: 3,
};

const ptoSelectedFormulaCellStyle: CSSProperties = {
  boxShadow: "inset 0 0 0 2px #2563eb",
  background: "#eff6ff",
  zIndex: 2,
};

const ptoEditingFormulaCellStyle: CSSProperties = {
  background: "#f1f5f9",
};

export function ptoStatusControlStyle(status: PtoStatus): CSSProperties {
  if (status === "Новая" || status === "Пусто") {
    return {
      background: "#f1f5f9",
      borderColor: "#cbd5e1",
      color: "#334155",
    };
  }

  if (status === "В работе") {
    return {
      background: "#dcfce7",
      borderColor: "#86efac",
      color: "#166534",
    };
  }

  if (status === "Завершена") {
    return {
      background: "#ffe4e6",
      borderColor: "#fda4af",
      color: "#9f1239",
    };
  }

  return {
    background: "#dbeafe",
    borderColor: "#93c5fd",
    color: "#1e40af",
  };
}
