"use client";

import { Fragment, type KeyboardEvent } from "react";
import { PtoPlanTd } from "@/features/pto/PtoDateTableParts";
import {
  ptoAreaCellStyle,
  ptoDraftAddButtonStyle,
  ptoDraftCellHintStyle,
  ptoDraftInputStyle,
  ptoDraftRowStyle,
  ptoDraftStatusStyle,
  ptoPlanInputStyle,
} from "@/features/pto/ptoDateTableStyles";
import type { PtoMonthGroupView } from "@/features/pto/ptoDateTableModel";
import { ptoCustomerCodeOptions, ptoUnitOptions } from "@/lib/domain/pto/date-table";

export type PtoDraftRowFields = {
  area: string;
  location: string;
  customerCode: string;
  structure: string;
  unit: string;
};

type PtoDraftField = keyof PtoDraftRowFields;
type PtoDraftFocusField = "area" | "location" | "structure";

type PtoDateDraftRowProps = {
  showCustomerCode: boolean;
  showLocation: boolean;
  fields: PtoDraftRowFields;
  monthGroups: PtoMonthGroupView[];
  onUpdateField: (field: PtoDraftField, value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>, focusField?: PtoDraftFocusField) => void;
  onAddRow: () => void;
};

export function PtoDateDraftRow({
  showCustomerCode,
  showLocation,
  fields,
  monthGroups,
  onUpdateField,
  onKeyDown,
  onAddRow,
}: PtoDateDraftRowProps) {
  return (
    <tr style={ptoDraftRowStyle}>
      {showCustomerCode ? (
        <PtoPlanTd align="center">
          <select
            value={fields.customerCode}
            onChange={(event) => onUpdateField("customerCode", event.target.value)}
            onKeyDown={(event) => onKeyDown(event, "area")}
            style={{ ...ptoPlanInputStyle, ...ptoDraftInputStyle, textAlign: "center" }}
          >
            <option value="">Заказчик</option>
            {ptoCustomerCodeOptions.map((option) => (
              <option key={option.code} value={option.code}>{option.code}</option>
            ))}
          </select>
        </PtoPlanTd>
      ) : null}
      <PtoPlanTd>
        <div style={ptoAreaCellStyle}>
          <button
            type="button"
            onClick={onAddRow}
            style={ptoDraftAddButtonStyle}
            title="Добавить строку"
            aria-label="Добавить строку"
          >
            +
          </button>
          <input
            value={fields.area}
            onChange={(event) => onUpdateField("area", event.target.value)}
            onKeyDown={(event) => onKeyDown(event, "structure")}
            placeholder="Новая строка"
            style={{ ...ptoPlanInputStyle, ...ptoDraftInputStyle }}
          />
        </div>
      </PtoPlanTd>
      {showLocation ? (
        <PtoPlanTd>
          <input
            value={fields.location}
            onChange={(event) => onUpdateField("location", event.target.value)}
            onKeyDown={(event) => onKeyDown(event, "structure")}
            placeholder="Местонахождение"
            style={{ ...ptoPlanInputStyle, ...ptoDraftInputStyle }}
          />
        </PtoPlanTd>
      ) : null}
      <PtoPlanTd>
        <input
          value={fields.structure}
          onChange={(event) => onUpdateField("structure", event.target.value)}
          onKeyDown={(event) => onKeyDown(event, "structure")}
          placeholder="Структура"
          style={{ ...ptoPlanInputStyle, ...ptoDraftInputStyle }}
        />
      </PtoPlanTd>
      <PtoPlanTd align="center">
        <select
          value={fields.unit}
          onChange={(event) => onUpdateField("unit", event.target.value)}
          onKeyDown={(event) => onKeyDown(event, "structure")}
          style={{ ...ptoPlanInputStyle, ...ptoDraftInputStyle, textAlign: "center" }}
        >
          <option value="">Ед.</option>
          {ptoUnitOptions.map((unit) => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
      </PtoPlanTd>
      <PtoPlanTd align="center">
        <span style={ptoDraftStatusStyle}>Новая</span>
      </PtoPlanTd>
      <PtoPlanTd align="center"><span style={ptoDraftCellHintStyle} /></PtoPlanTd>
      <PtoPlanTd align="center"><span style={ptoDraftCellHintStyle} /></PtoPlanTd>
      {monthGroups.map((group) => (
        <Fragment key={`draft-${group.month}`}>
          <PtoPlanTd align="center"><span style={ptoDraftCellHintStyle} /></PtoPlanTd>
          {group.expanded && group.days.map((day) => (
            <PtoPlanTd key={`draft-${day}`} align="center"><span style={ptoDraftCellHintStyle} /></PtoPlanTd>
          ))}
        </Fragment>
      ))}
    </tr>
  );
}
