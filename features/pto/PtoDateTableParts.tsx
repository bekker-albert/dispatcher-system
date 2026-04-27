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
          title="РџРѕС‚СЏРЅРё, С‡С‚РѕР±С‹ РёР·РјРµРЅРёС‚СЊ С€РёСЂРёРЅСѓ СЃС‚РѕР»Р±С†Р°"
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
      title="AAM - РўРћРћ AA Mining, AA - РђРћ РђРљ РђР»С‚С‹РЅР°Р»РјР°СЃ, AAE - РўРћРћ AA Engineering"
    >
      <option value="">вЂ”</option>
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
      title="РЎС‚Р°С‚СѓСЃ СЂР°СЃСЃС‡РёС‚С‹РІР°РµС‚СЃСЏ РїРѕ СЂР°Р±РѕС‡РµР№ РґР°С‚Рµ Рё Р·Р°РїРѕР»РЅРµРЅРЅС‹Рј Р·РЅР°С‡РµРЅРёСЏРј РјРµСЃСЏС†Р°"
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
  if (status === "РќРѕРІР°СЏ" || status === "РџСѓСЃС‚Рѕ") {
    return {
      background: "#f1f5f9",
      borderColor: "#cbd5e1",
      color: "#334155",
    };
  }

  if (status === "Р’ СЂР°Р±РѕС‚Рµ") {
    return {
      background: "#dcfce7",
      borderColor: "#86efac",
      color: "#166534",
    };
  }

  if (status === "Р—Р°РІРµСЂС€РµРЅР°") {
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
