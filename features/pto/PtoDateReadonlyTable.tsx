"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { Fragment } from "react";
import { PtoPlanTd, PtoPlanTh, PtoReadonlyNumberCell, PtoReadonlyTextCell, ptoStatusControlStyle } from "@/features/pto/PtoDateTableParts";
import { monthToggleStyle, ptoDateTableLayoutStyle, ptoDateTableScrollStyle, ptoPlanTableStyle, ptoStatusBadgeStyle } from "@/features/pto/ptoDateTableStyles";
import type { PtoMonthGroupView, PtoRowDateTotals, PtoTableColumn } from "@/features/pto/ptoDateTableModel";
import { normalizePtoCustomerCode, normalizePtoUnit, ptoAutomatedStatus, ptoStatusRowBackground, type PtoPlanRow } from "@/lib/domain/pto/date-table";

type PtoDateReadonlyTableProps = {
  rows: PtoPlanRow[];
  showCustomerCode: boolean;
  showLocation: boolean;
  ptoPlanYear: string;
  ptoTab: string;
  reportDate: string;
  carryoverHeader: string;
  displayMonthGroups: PtoMonthGroupView[];
  tableColumns: PtoTableColumn[];
  tableMinWidth: number;
  columnWidthByKey: Map<string, number>;
  rowHeights: Record<string, number>;
  scrollRef: RefObject<HTMLDivElement | null>;
  getEffectiveCarryover: (row: PtoPlanRow) => number;
  getRowDateTotals: (row: PtoPlanRow) => PtoRowDateTotals;
  headerLabel: (key: string, fallback: string) => string;
  onToggleMonth: (month: string) => void;
  toolbar: ReactNode;
};

export function PtoDateReadonlyTable({
  rows,
  showCustomerCode,
  showLocation,
  ptoPlanYear,
  ptoTab,
  reportDate,
  carryoverHeader,
  displayMonthGroups,
  tableColumns,
  tableMinWidth,
  columnWidthByKey,
  rowHeights,
  scrollRef,
  getEffectiveCarryover,
  getRowDateTotals,
  headerLabel,
  onToggleMonth,
  toolbar,
}: PtoDateReadonlyTableProps) {
  return (
    <div style={ptoDateTableLayoutStyle}>
      {toolbar}

      <div ref={scrollRef} style={ptoDateTableScrollStyle}>
        <table style={{ ...ptoPlanTableStyle, width: tableMinWidth, minWidth: tableMinWidth, marginRight: 40 }}>
          <colgroup>
            {tableColumns.map((column) => (
              <col key={column.key} style={{ width: column.width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {showCustomerCode ? <PtoPlanTh rowSpan={2} align="center" columnKey="customerCode" width={columnWidthByKey.get("customerCode")}>{headerLabel("customerCode", "Заказчик")}</PtoPlanTh> : null}
              <PtoPlanTh rowSpan={2} columnKey="area" width={columnWidthByKey.get("area")}>{headerLabel("area", "Участок")}</PtoPlanTh>
              {showLocation ? <PtoPlanTh rowSpan={2} columnKey="location" width={columnWidthByKey.get("location")}>{headerLabel("location", "Местонахождение")}</PtoPlanTh> : null}
              <PtoPlanTh rowSpan={2} columnKey="structure" width={columnWidthByKey.get("structure")}>{headerLabel("structure", "Структура")}</PtoPlanTh>
              <PtoPlanTh rowSpan={2} align="center" columnKey="unit" width={columnWidthByKey.get("unit")}>{headerLabel("unit", "Ед.")}</PtoPlanTh>
              <PtoPlanTh rowSpan={2} align="center" columnKey="status" width={columnWidthByKey.get("status")}>{headerLabel("status", "Статус")}</PtoPlanTh>
              <PtoPlanTh rowSpan={2} align="center" columnKey={`carryover:${ptoPlanYear}`} width={columnWidthByKey.get(`carryover:${ptoPlanYear}`)}>{headerLabel(`carryover:${ptoPlanYear}`, carryoverHeader)}</PtoPlanTh>
              <PtoPlanTh rowSpan={2} align="center" columnKey="year-total" width={columnWidthByKey.get("year-total")}>{headerLabel("year-total", "Итого год")}</PtoPlanTh>
              {displayMonthGroups.map((group) => (
                <PtoPlanTh key={group.month} colSpan={1 + (group.expanded ? group.days.length : 0)}>
                  <button
                    type="button"
                    onClick={() => onToggleMonth(group.month)}
                    style={monthToggleStyle}
                    title="Клик - свернуть/развернуть"
                  >
                    {group.expanded ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
                    {headerLabel(`month-group:${group.month}`, group.label)}
                  </button>
                </PtoPlanTh>
              ))}
            </tr>
            <tr>
              {displayMonthGroups.map((group) => (
                <Fragment key={`${group.month}-days-readonly`}>
                  <PtoPlanTh align="center" columnKey={`month-total:${group.month}`} width={columnWidthByKey.get(`month-total:${group.month}`)}>Итого</PtoPlanTh>
                  {group.expanded && group.days.map((day) => (
                    <PtoPlanTh key={day} align="center" columnKey={`day:${day}`} width={columnWidthByKey.get(`day:${day}`)}>{day.slice(8, 10)}</PtoPlanTh>
                  ))}
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowStatus = ptoAutomatedStatus(row, reportDate);
              const effectiveCarryover = getEffectiveCarryover(row);
              const rowDateTotals = getRowDateTotals(row);
              const rowHeightKey = `${ptoTab}:${row.id}`;
              const rowHeight = rowHeights[rowHeightKey];
              const rowYearTotalWithCarryover = Math.round(((rowDateTotals.yearDailyTotal ?? 0) + effectiveCarryover) * 1000000) / 1000000;

              return (
                <tr key={row.id} style={{ background: ptoStatusRowBackground(rowStatus), ...(rowHeight ? { height: rowHeight } : null) }}>
                  {showCustomerCode ? <PtoPlanTd align="center"><PtoReadonlyTextCell value={normalizePtoCustomerCode(row.customerCode)} align="center" /></PtoPlanTd> : null}
                  <PtoPlanTd><PtoReadonlyTextCell value={row.area} /></PtoPlanTd>
                  {showLocation ? <PtoPlanTd><PtoReadonlyTextCell value={row.location} /></PtoPlanTd> : null}
                  <PtoPlanTd><PtoReadonlyTextCell value={row.structure} /></PtoPlanTd>
                  <PtoPlanTd align="center"><PtoReadonlyTextCell value={normalizePtoUnit(row.unit)} align="center" /></PtoPlanTd>
                  <PtoPlanTd align="center">
                    <span
                      title="Статус рассчитывается по рабочей дате и заполненным значениям месяца"
                      style={{ ...ptoStatusBadgeStyle, ...ptoStatusControlStyle(rowStatus) }}
                    >
                      {rowStatus}
                    </span>
                  </PtoPlanTd>
                  <PtoPlanTd align="center"><PtoReadonlyNumberCell value={effectiveCarryover} /></PtoPlanTd>
                  <PtoPlanTd align="center"><PtoReadonlyNumberCell value={rowYearTotalWithCarryover} bold /></PtoPlanTd>
                  {displayMonthGroups.map((group) => {
                    const monthValue = rowDateTotals.monthTotals.get(group.month)?.value;
                    return (
                      <Fragment key={`${row.id}-${group.month}-readonly`}>
                        <PtoPlanTd align="center"><PtoReadonlyNumberCell value={monthValue} bold /></PtoPlanTd>
                        {group.expanded && group.days.map((day) => (
                          <PtoPlanTd key={`${row.id}-${day}-readonly`} align="center"><PtoReadonlyNumberCell value={row.dailyPlans[day]} /></PtoPlanTd>
                        ))}
                      </Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
