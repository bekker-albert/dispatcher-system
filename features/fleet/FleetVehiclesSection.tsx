"use client";

import { Printer } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import type { VehicleRow } from "@/lib/domain/vehicles/types";
import type { FleetDailyState } from "@/lib/domain/fleet/daily-state";
import { IconButton } from "@/shared/ui/buttons";
import {
  createFleetVehicleListRows,
  type FleetVehicleListRow,
} from "@/features/fleet/fleetVehicleModel";
import {
  driverToggleStyle,
  emptyStateCellStyle,
  fleetPrintCss,
  sectionStyle,
  spacerCellStyle,
  statusBadgeStyle,
  summaryStyle,
  tableScrollStyle,
  tableStyle,
  tdCenterStyle,
  tdStyle,
  thStyle,
  toolbarActionsStyle,
  toolbarStyle,
} from "@/features/fleet/fleetVehicleTableStyles";
import { createFleetVehicleVirtualRows } from "@/features/fleet/fleetVehicleVirtualRows";

export type FleetVehiclesSectionProps = {
  vehicleRows: VehicleRow[];
  workDate: string;
  dailyStates?: readonly FleetDailyState[];
};

export function FleetVehiclesSection({
  vehicleRows,
  workDate,
  dailyStates = [],
}: FleetVehiclesSectionProps) {
  const [driversExpanded, setDriversExpanded] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const viewportFrameRef = useRef<number | null>(null);
  const [rowsViewport, setRowsViewport] = useState({ height: 520, scrollTop: 0 });
  const visibleColumnCount = driversExpanded ? 15 : 11;
  const rows = useMemo(
    () => createFleetVehicleListRows(vehicleRows, { workDate, dailyStates }),
    [dailyStates, vehicleRows, workDate],
  );
  const virtualRows = useMemo(
    () => createFleetVehicleVirtualRows(rows, rowsViewport, !isPreparingPrint),
    [isPreparingPrint, rows, rowsViewport],
  );

  const updateRowsViewport = useCallback(() => {
    const element = tableScrollRef.current;
    if (!element) return;

    const nextViewport = {
      height: element.clientHeight || 520,
      scrollTop: element.scrollTop,
    };

    setRowsViewport((current) => (
      current.height === nextViewport.height && current.scrollTop === nextViewport.scrollTop
        ? current
        : nextViewport
    ));
  }, []);

  const scheduleRowsViewportUpdate = useCallback(() => {
    if (viewportFrameRef.current !== null) return;

    viewportFrameRef.current = window.requestAnimationFrame(() => {
      viewportFrameRef.current = null;
      updateRowsViewport();
    });
  }, [updateRowsViewport]);

  useEffect(() => {
    updateRowsViewport();
    window.addEventListener("resize", updateRowsViewport);

    return () => {
      window.removeEventListener("resize", updateRowsViewport);

      if (viewportFrameRef.current !== null) {
        window.cancelAnimationFrame(viewportFrameRef.current);
        viewportFrameRef.current = null;
      }
    };
  }, [driversExpanded, rows.length, updateRowsViewport]);

  useEffect(() => {
    const finishPrint = () => setIsPreparingPrint(false);
    window.addEventListener("afterprint", finishPrint);

    return () => window.removeEventListener("afterprint", finishPrint);
  }, []);

  const printFleetVehicles = useCallback(() => {
    setIsPreparingPrint(true);
    window.requestAnimationFrame(() => window.print());
  }, []);

  return (
    <div className="fleet-print-area" style={sectionStyle}>
      <style>{fleetPrintCss}</style>
      <div className="fleet-print-toolbar" style={toolbarStyle}>
        <div style={summaryStyle}>Техника: {rows.length}</div>
        <div style={toolbarActionsStyle}>
          <button
            type="button"
            onClick={() => setDriversExpanded((current) => !current)}
            style={driverToggleStyle}
            aria-expanded={driversExpanded}
          >
            {driversExpanded ? "Скрыть водителей" : "Показать водителей"}
          </button>
          <IconButton label="Печать списка техники: A3, альбомная ориентация" onClick={printFleetVehicles}>
            <Printer size={16} aria-hidden />
          </IconButton>
        </div>
      </div>

      <div
        ref={tableScrollRef}
        className="fleet-print-table-scroll"
        onScroll={scheduleRowsViewportUpdate}
        style={tableScrollStyle}
      >
        <table className="fleet-print-table" style={tableStyle}>
          <colgroup>
            <col style={{ width: 46 }} />
            <col style={{ minWidth: 118 }} />
            <col style={{ minWidth: 150 }} />
            <col style={{ minWidth: 150 }} />
            <col style={{ minWidth: 112 }} />
            <col style={{ minWidth: 112 }} />
            <col style={{ minWidth: 112 }} />
            <col style={{ minWidth: 94 }} />
            {driversExpanded ? (
              <>
                <col style={{ minWidth: 150 }} />
                <col style={{ minWidth: 150 }} />
                <col style={{ minWidth: 150 }} />
                <col style={{ minWidth: 150 }} />
              </>
            ) : null}
            <col style={{ minWidth: 106 }} />
            <col style={{ minWidth: 132 }} />
            <col style={{ minWidth: 180 }} />
          </colgroup>
          <thead>
            <tr>
              <Th rowSpan={driversExpanded ? 2 : 1}>№</Th>
              <Th rowSpan={driversExpanded ? 2 : 1}>Участок</Th>
              <Th rowSpan={driversExpanded ? 2 : 1}>Местонахождение</Th>
              <Th rowSpan={driversExpanded ? 2 : 1}>Наименование техники</Th>
              <Th rowSpan={driversExpanded ? 2 : 1}>Марка</Th>
              <Th rowSpan={driversExpanded ? 2 : 1}>Модель</Th>
              <Th rowSpan={driversExpanded ? 2 : 1}>Гос. номер</Th>
              <Th rowSpan={driversExpanded ? 2 : 1}>Гар. номер</Th>
              {driversExpanded ? <Th colSpan={4}>Закрепление водителей за техникой</Th> : null}
              <Th rowSpan={driversExpanded ? 2 : 1}>Статус</Th>
              <Th rowSpan={driversExpanded ? 2 : 1}>Дата выхода в ремонт</Th>
              <Th rowSpan={driversExpanded ? 2 : 1}>Примечание</Th>
            </tr>
            {driversExpanded ? (
              <tr>
                <Th>1 вахта / 1 смена</Th>
                <Th>1 вахта / 2 смена</Th>
                <Th>2 вахта / 1 смена</Th>
                <Th>2 вахта / 2 смена</Th>
              </tr>
            ) : null}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnCount} style={emptyStateCellStyle}>
                  Нет техники для отображения на выбранную дату.
                </td>
              </tr>
            ) : (
              <>
                {virtualRows.topSpacerHeight > 0 ? (
                  <tr aria-hidden>
                    <td colSpan={visibleColumnCount} style={{ ...spacerCellStyle, height: virtualRows.topSpacerHeight }} />
                  </tr>
                ) : null}
                {virtualRows.rows.map((row) => (
                  <FleetVehicleTableRow key={row.id} row={row} driversExpanded={driversExpanded} />
                ))}
                {virtualRows.bottomSpacerHeight > 0 ? (
                  <tr aria-hidden>
                    <td colSpan={visibleColumnCount} style={{ ...spacerCellStyle, height: virtualRows.bottomSpacerHeight }} />
                  </tr>
                ) : null}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FleetVehicleTableRow({ row, driversExpanded }: { row: FleetVehicleListRow; driversExpanded: boolean }) {
  return (
    <tr>
      <Td center>{row.index}</Td>
      <Td>{row.area}</Td>
      <Td>{row.location}</Td>
      <Td>{row.equipmentType}</Td>
      <Td>{row.brand}</Td>
      <Td>{row.model}</Td>
      <Td>{row.plateNumber}</Td>
      <Td>{row.garageNumber}</Td>
      {driversExpanded ? (
        <>
          <Td>{row.firstWatchFirstShiftDriver}</Td>
          <Td>{row.firstWatchSecondShiftDriver}</Td>
          <Td>{row.secondWatchFirstShiftDriver}</Td>
          <Td>{row.secondWatchSecondShiftDriver}</Td>
        </>
      ) : null}
      <Td center>
        <span style={statusBadgeStyle(row.status)}>{row.status}</span>
      </Td>
      <Td center>{row.repairStartedAt}</Td>
      <Td>{row.note}</Td>
    </tr>
  );
}

function Th({
  children,
  colSpan,
  rowSpan,
}: {
  children: ReactNode;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <th colSpan={colSpan} rowSpan={rowSpan} style={thStyle}>
      {children}
    </th>
  );
}

function Td({ children, center = false }: { children: ReactNode; center?: boolean }) {
  return <td style={center ? tdCenterStyle : tdStyle}>{children}</td>;
}
