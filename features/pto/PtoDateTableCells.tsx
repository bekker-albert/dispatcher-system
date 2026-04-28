import type { CSSProperties, ReactNode } from "react";
import { normalizePtoCustomerCode, normalizePtoUnit, ptoCustomerCodeOptions, ptoUnitOptions } from "../../lib/domain/pto/date-table";
import { formatPtoCellNumber, formatPtoFormulaNumber } from "../../lib/domain/pto/formatting";
import {
  ptoPlanInputStyle,
  ptoReadonlyCellNumberStyle,
  ptoReadonlyCellTextStyle,
} from "./ptoDateTableStyles";
import {
  ptoActiveFormulaCellStyle,
  ptoEditingFormulaCellStyle,
  ptoPlanTdStyle,
  ptoSelectedFormulaCellStyle,
} from "./PtoDateTablePartStyles";

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
