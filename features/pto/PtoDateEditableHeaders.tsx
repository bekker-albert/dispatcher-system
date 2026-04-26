"use client";

import { Fragment, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { PtoPlanTh } from "@/features/pto/PtoDateTableParts";
import type { PtoMonthGroupView } from "@/features/pto/ptoDateTableModel";

type PtoColumnResizeHandler = (event: MouseEvent<HTMLElement>, key: string, width: number) => void;

type PtoDateEditableHeadersProps = {
  showCustomerCode: boolean;
  showLocation: boolean;
  ptoPlanYear: string;
  carryoverHeader: string;
  monthGroups: PtoMonthGroupView[];
  columnWidthByKey: Map<string, number>;
  onResizeStart?: PtoColumnResizeHandler;
  renderHeaderText: (key: string, fallback: string, align?: CSSProperties["textAlign"]) => ReactNode;
  renderMonthHeader: (month: string, fallback: string, expanded: boolean) => ReactNode;
};

export function PtoDateEditableHeaders({
  showCustomerCode,
  showLocation,
  ptoPlanYear,
  carryoverHeader,
  monthGroups,
  columnWidthByKey,
  onResizeStart,
  renderHeaderText,
  renderMonthHeader,
}: PtoDateEditableHeadersProps) {
  return (
    <thead>
      <tr>
        {showCustomerCode ? (
          <PtoPlanTh rowSpan={2} align="center" columnKey="customerCode" width={columnWidthByKey.get("customerCode")} onResizeStart={onResizeStart}>
            {renderHeaderText("customerCode", "Заказчик", "center")}
          </PtoPlanTh>
        ) : null}
        <PtoPlanTh rowSpan={2} columnKey="area" width={columnWidthByKey.get("area")} onResizeStart={onResizeStart}>
          {renderHeaderText("area", "Участок")}
        </PtoPlanTh>
        {showLocation ? (
          <PtoPlanTh rowSpan={2} columnKey="location" width={columnWidthByKey.get("location")} onResizeStart={onResizeStart}>
            {renderHeaderText("location", "Местонахождение")}
          </PtoPlanTh>
        ) : null}
        <PtoPlanTh rowSpan={2} columnKey="structure" width={columnWidthByKey.get("structure")} onResizeStart={onResizeStart}>
          {renderHeaderText("structure", "Структура")}
        </PtoPlanTh>
        <PtoPlanTh rowSpan={2} align="center" columnKey="unit" width={columnWidthByKey.get("unit")} onResizeStart={onResizeStart}>
          {renderHeaderText("unit", "Ед.", "center")}
        </PtoPlanTh>
        <PtoPlanTh rowSpan={2} align="center" columnKey="status" width={columnWidthByKey.get("status")} onResizeStart={onResizeStart}>
          {renderHeaderText("status", "Статус", "center")}
        </PtoPlanTh>
        <PtoPlanTh rowSpan={2} align="center" columnKey={`carryover:${ptoPlanYear}`} width={columnWidthByKey.get(`carryover:${ptoPlanYear}`)} onResizeStart={onResizeStart}>
          {renderHeaderText(`carryover:${ptoPlanYear}`, carryoverHeader, "center")}
        </PtoPlanTh>
        <PtoPlanTh rowSpan={2} align="center" columnKey="year-total" width={columnWidthByKey.get("year-total")} onResizeStart={onResizeStart}>
          {renderHeaderText("year-total", "Итого год", "center")}
        </PtoPlanTh>
        {monthGroups.map((group) => (
          <PtoPlanTh key={group.month} colSpan={1 + (group.expanded ? group.days.length : 0)}>
            {renderMonthHeader(group.month, group.label, group.expanded)}
          </PtoPlanTh>
        ))}
      </tr>
      <tr>
        {monthGroups.map((group) => (
          <Fragment key={`${group.month}-days`}>
            <PtoPlanTh align="center" columnKey={`month-total:${group.month}`} width={columnWidthByKey.get(`month-total:${group.month}`)} onResizeStart={onResizeStart}>
              {renderHeaderText(`month-total:${group.month}`, "Итого", "center")}
            </PtoPlanTh>
            {group.expanded && group.days.map((day) => (
              <PtoPlanTh key={day} align="center" columnKey={`day:${day}`} width={columnWidthByKey.get(`day:${day}`)} onResizeStart={onResizeStart}>
                {renderHeaderText(`day:${day}`, day.slice(8, 10), "center")}
              </PtoPlanTh>
            ))}
          </Fragment>
        ))}
      </tr>
    </thead>
  );
}
