import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { PtoStatus } from "../../lib/domain/pto/date-table";
import { formatPtoCellNumber, formatPtoFormulaNumber } from "../../lib/domain/pto/formatting";
import {
  ptoPlanInputStyle,
  ptoReadonlyCellNumberStyle,
  ptoReadonlyCellTextStyle,
  ptoStatusBadgeStyle,
} from "./ptoDateTableStyles";
import { normalizePtoCustomerCode, normalizePtoUnit, ptoCustomerCodeOptions, ptoUnitOptions } from "../../lib/domain/pto/date-table";

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

type PtoVirtualSpacerRowProps = {
  height: number;
  colSpan: number;
};

type PtoReadonlyTextCellProps = {
  value: string;
  align?: CSSProperties["textAlign"];
};

type PtoReadonlyNumberCellProps = {
  value: number | undefined;
  bold?: boolean;
};

type PtoUnitCellProps = {
  editing: boolean;
  value: string;
  dataFieldKey: string;
  onChange: (value: string) => void;
};

type PtoCustomerCodeCellProps = {
  editing: boolean;
  value: string | undefined;
  dataFieldKey: string;
  onChange: (value: string) => void;
};

type PtoStatusCellProps = {
  status: PtoStatus;
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
          title="\u041f\u043e\u0442\u044f\u043d\u0438, \u0447\u0442\u043e\u0431\u044b \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0448\u0438\u0440\u0438\u043d\u0443 \u0441\u0442\u043e\u043b\u0431\u0446\u0430"
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

export function PtoVirtualSpacerRow({ height, colSpan }: PtoVirtualSpacerRowProps) {
  if (height <= 0) return null;

  return (
    <tr aria-hidden>
      <td colSpan={colSpan} style={{ height, padding: 0, border: "none", background: "transparent" }} />
    </tr>
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

export function PtoCustomerCodeCell({ editing, value, dataFieldKey, onChange }: PtoCustomerCodeCellProps) {
  const customerCode = normalizePtoCustomerCode(value);

  if (!editing) return <PtoReadonlyTextCell value={customerCode} align="center" />;

  return (
    <select
      data-pto-row-field={dataFieldKey}
      value={customerCode}
      onChange={(event) => onChange(event.target.value)}
      style={{ ...ptoPlanInputStyle, textAlign: "center" }}
      title="AAM - \u0422\u041e\u041e AA Mining, AA - \u0410\u041e \u0410\u041a \u0410\u043b\u0442\u044b\u043d\u0430\u043b\u043c\u0430\u0441, AAE - \u0422\u041e\u041e AA Engineering"
    >
      <option value="">-</option>
      {ptoCustomerCodeOptions.map((option) => (
        <option key={option.code} value={option.code}>{option.code}</option>
      ))}
    </select>
  );
}

export function PtoUnitCell({ editing, value, dataFieldKey, onChange }: PtoUnitCellProps) {
  const unit = normalizePtoUnit(value);

  if (!editing) return <PtoReadonlyTextCell value={unit} align="center" />;

  return (
    <select
      data-pto-row-field={dataFieldKey}
      value={unit}
      onChange={(event) => onChange(event.target.value)}
      style={{ ...ptoPlanInputStyle, textAlign: "center" }}
    >
      {ptoUnitOptions.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

export function PtoStatusCell({ status }: PtoStatusCellProps) {
  return (
    <span
      title="\u0421\u0442\u0430\u0442\u0443\u0441 \u0440\u0430\u0441\u0441\u0447\u0438\u0442\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u043f\u043e \u0440\u0430\u0431\u043e\u0447\u0435\u0439 \u0434\u0430\u0442\u0435 \u0438 \u0437\u0430\u043f\u043e\u043b\u043d\u0435\u043d\u043d\u044b\u043c \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u044f\u043c \u043c\u0435\u0441\u044f\u0446\u0430"
      style={{ ...ptoStatusBadgeStyle, ...ptoStatusControlStyle(status) }}
    >
      {status}
    </span>
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
  if (status === "\u041d\u043e\u0432\u0430\u044f" || status === "\u041f\u0443\u0441\u0442\u043e") {
    return {
      background: "#f1f5f9",
      borderColor: "#cbd5e1",
      color: "#334155",
    };
  }

  if (status === "\u0412 \u0440\u0430\u0431\u043e\u0442\u0435") {
    return {
      background: "#dcfce7",
      borderColor: "#86efac",
      color: "#166534",
    };
  }

  if (status === "\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430") {
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
