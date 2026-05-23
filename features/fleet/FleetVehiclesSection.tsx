"use client";

import { Download, Pencil, Printer, Upload } from "lucide-react";
import type { ChangeEvent, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import type { VehicleRow } from "@/lib/domain/vehicles/types";
import type { FleetDailyState } from "@/lib/domain/fleet/daily-state";
import { IconButton } from "@/shared/ui/buttons";
import {
  collapsibleFleetVehicleColumns,
  FilterableFleetVehicleTh,
  FleetVehicleColumnToggleButtons,
  type CollapsibleFleetVehicleColumnKey,
  type FleetVehicleFilterControls,
} from "@/features/fleet/fleetVehicleColumnControls";
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
  summaryStyle,
  tableScrollStyle,
  tableStyle,
  tdCenterStyle,
  tdStyle,
  thStyle,
  toolbarActionsStyle,
  toolbarStyle,
} from "@/features/fleet/fleetVehicleTableStyles";
import {
  createFleetVehicleVirtualRows,
  shouldDisableFleetVehicleVirtualizationForRows,
} from "@/features/fleet/fleetVehicleVirtualRows";

export type FleetVehiclesSectionProps = {
  vehicleRows: VehicleRow[];
  workDate: string;
  dailyStates?: readonly FleetDailyState[];
  filterControls?: FleetVehicleFilterControls;
  canManageVehicles?: boolean;
  vehicleImportInputRef?: RefObject<HTMLInputElement | null>;
  onStartEditing?: () => void;
  onOpenVehicleImportFilePicker?: () => void;
  onExportVehiclesToExcel?: (rows: FleetVehicleListRow[]) => void | Promise<void>;
  onImportVehiclesFromExcel?: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function FleetVehiclesSection({
  vehicleRows,
  workDate,
  dailyStates = [],
  filterControls,
  canManageVehicles = false,
  vehicleImportInputRef,
  onStartEditing,
  onOpenVehicleImportFilePicker,
  onExportVehiclesToExcel,
  onImportVehiclesFromExcel,
}: FleetVehiclesSectionProps) {
  const [driversExpanded, setDriversExpanded] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [collapsedColumns, setCollapsedColumns] = useState<Record<CollapsibleFleetVehicleColumnKey, boolean>>({
    fuelCardNumber: true,
    manufactureYear: true,
    vin: true,
    owner: true,
  });
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const viewportFrameRef = useRef<number | null>(null);
  const [rowsViewport, setRowsViewport] = useState({ height: 520, scrollTop: 0 });
  const printExpandedColumns = useMemo<Record<CollapsibleFleetVehicleColumnKey, boolean>>(() => ({
    fuelCardNumber: false,
    manufactureYear: false,
    vin: false,
    owner: false,
  }), []);
  const displayedCollapsedColumns = isPreparingPrint ? printExpandedColumns : collapsedColumns;
  const displayedDriversExpanded = isPreparingPrint || driversExpanded;
  const displayedFilterControls = isPreparingPrint ? undefined : filterControls;
  const visibleOptionalColumnCount = collapsibleFleetVehicleColumns.filter(({ key }) => !displayedCollapsedColumns[key]).length;
  const visibleColumnCount = 7 + visibleOptionalColumnCount + (displayedDriversExpanded ? 4 : 0);
  const activeFilterCount = filterControls?.activeVehicleFilterCount ?? 0;
  const rowTextValueResolver = useCallback(
    (row: FleetVehicleListRow) => getFleetVehicleVirtualRowTextValues(row, displayedCollapsedColumns),
    [displayedCollapsedColumns],
  );
  const rows = useMemo(
    () => createFleetVehicleListRows(vehicleRows, { workDate, dailyStates }),
    [dailyStates, vehicleRows, workDate],
  );
  const hasVariableHeightRows = useMemo(
    () => shouldDisableFleetVehicleVirtualizationForRows(rows, rowTextValueResolver),
    [rows, rowTextValueResolver],
  );
  const virtualRows = useMemo(
    () => createFleetVehicleVirtualRows(rows, rowsViewport, !isPreparingPrint && !hasVariableHeightRows),
    [hasVariableHeightRows, isPreparingPrint, rows, rowsViewport],
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
    const finishPrint = () => {
      document.documentElement.classList.remove("fleet-print-mode");
      setIsPreparingPrint(false);
    };
    window.addEventListener("afterprint", finishPrint);

    return () => window.removeEventListener("afterprint", finishPrint);
  }, []);

  const printFleetVehicles = useCallback(() => {
    document.documentElement.classList.add("fleet-print-mode");
    setIsPreparingPrint(true);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print());
    });
  }, []);
  const exportFleetVehiclesToExcel = useCallback(() => {
    void onExportVehiclesToExcel?.(rows);
  }, [onExportVehiclesToExcel, rows]);
  const toggleColumnCollapsed = useCallback((key: CollapsibleFleetVehicleColumnKey) => {
    setCollapsedColumns((current) => ({ ...current, [key]: !current[key] }));
  }, []);
  const clearAllFilters = useCallback(() => {
    filterControls?.onClearAllVehicleFilters();
  }, [filterControls]);

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
            aria-expanded={displayedDriversExpanded}
          >
            {driversExpanded ? "Скрыть водителей" : "Показать водителей"}
          </button>
          <FleetVehicleColumnToggleButtons collapsedColumns={collapsedColumns} onToggleColumn={toggleColumnCollapsed} />
          <button
            disabled={!activeFilterCount}
            onClick={clearAllFilters}
            style={{
              ...driverToggleStyle,
              opacity: activeFilterCount ? 1 : 0.55,
              cursor: activeFilterCount ? "pointer" : "not-allowed",
            }}
            title={activeFilterCount ? "Снять все фильтры справочника техники" : "Фильтры не применены"}
            type="button"
          >
            {activeFilterCount ? `Снять все фильтры (${activeFilterCount})` : "Снять все фильтры"}
          </button>
          {canManageVehicles && onOpenVehicleImportFilePicker && onImportVehiclesFromExcel ? (
            <>
              <IconButton label="Загрузить справочник техники из Excel" onClick={onOpenVehicleImportFilePicker}>
                <Upload size={16} aria-hidden />
              </IconButton>
              <input
                ref={vehicleImportInputRef}
                accept=".xlsx,.csv"
                onChange={onImportVehiclesFromExcel}
                style={{ display: "none" }}
                type="file"
              />
            </>
          ) : null}
          {onExportVehiclesToExcel ? (
            <IconButton label="Выгрузить справочник техники в Excel" onClick={exportFleetVehiclesToExcel}>
              <Download size={16} aria-hidden />
            </IconButton>
          ) : null}
          {canManageVehicles && onStartEditing ? (
            <IconButton label="Редактировать справочник техники" onClick={onStartEditing}>
              <Pencil size={16} aria-hidden />
            </IconButton>
          ) : null}
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
            <col style={{ minWidth: 132 }} />
            <col style={{ minWidth: 150 }} />
            <col style={{ minWidth: 112 }} />
            <col style={{ minWidth: 112 }} />
            <col style={{ minWidth: 112 }} />
            <col style={{ minWidth: 94 }} />
            {!displayedCollapsedColumns.fuelCardNumber ? <col style={{ minWidth: 116 }} /> : null}
            {!displayedCollapsedColumns.manufactureYear ? <col style={{ minWidth: 96 }} /> : null}
            {!displayedCollapsedColumns.vin ? <col style={{ minWidth: 150 }} /> : null}
            {!displayedCollapsedColumns.owner ? <col style={{ minWidth: 170 }} /> : null}
            {displayedDriversExpanded ? (
              <>
                <col style={{ minWidth: 150 }} />
                <col style={{ minWidth: 150 }} />
                <col style={{ minWidth: 150 }} />
                <col style={{ minWidth: 150 }} />
              </>
            ) : null}
          </colgroup>
          <thead>
            <tr>
              <Th rowSpan={displayedDriversExpanded ? 2 : 1}>№</Th>
              <FilterableFleetVehicleTh filterControls={displayedFilterControls} filterKey="vehicleType" rowSpan={displayedDriversExpanded ? 2 : 1}>Вид техники</FilterableFleetVehicleTh>
              <FilterableFleetVehicleTh filterControls={displayedFilterControls} filterKey="equipmentType" rowSpan={displayedDriversExpanded ? 2 : 1}>Наименование техники</FilterableFleetVehicleTh>
              <FilterableFleetVehicleTh filterControls={displayedFilterControls} filterKey="brand" rowSpan={displayedDriversExpanded ? 2 : 1}>Марка</FilterableFleetVehicleTh>
              <FilterableFleetVehicleTh filterControls={displayedFilterControls} filterKey="model" rowSpan={displayedDriversExpanded ? 2 : 1}>Модель</FilterableFleetVehicleTh>
              <FilterableFleetVehicleTh filterControls={displayedFilterControls} filterKey="plateNumber" rowSpan={displayedDriversExpanded ? 2 : 1}>Гос. номер</FilterableFleetVehicleTh>
              <FilterableFleetVehicleTh filterControls={displayedFilterControls} filterKey="garageNumber" rowSpan={displayedDriversExpanded ? 2 : 1}>Гар. номер</FilterableFleetVehicleTh>
              {!displayedCollapsedColumns.fuelCardNumber ? (
                <FilterableFleetVehicleTh filterControls={displayedFilterControls} filterKey="fuelCardNumber" rowSpan={displayedDriversExpanded ? 2 : 1}>№ топл.карты</FilterableFleetVehicleTh>
              ) : null}
              {!displayedCollapsedColumns.manufactureYear ? (
                <FilterableFleetVehicleTh filterControls={displayedFilterControls} filterKey="manufactureYear" rowSpan={displayedDriversExpanded ? 2 : 1}>Год выпуска</FilterableFleetVehicleTh>
              ) : null}
              {!displayedCollapsedColumns.vin ? (
                <FilterableFleetVehicleTh filterControls={displayedFilterControls} filterKey="vin" rowSpan={displayedDriversExpanded ? 2 : 1}>VIN</FilterableFleetVehicleTh>
              ) : null}
              {!displayedCollapsedColumns.owner ? (
                <FilterableFleetVehicleTh filterControls={displayedFilterControls} filterKey="owner" rowSpan={displayedDriversExpanded ? 2 : 1}>Собственник</FilterableFleetVehicleTh>
              ) : null}
            {displayedDriversExpanded ? <Th colSpan={4}>Закрепление водителей за техникой</Th> : null}
            </tr>
            {displayedDriversExpanded ? (
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
                  <FleetVehicleTableRow
                    key={row.id}
                    collapsedColumns={displayedCollapsedColumns}
                    row={row}
                    driversExpanded={displayedDriversExpanded}
                  />
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

function getFleetVehicleVirtualRowTextValues(
  row: FleetVehicleListRow,
  collapsedColumns: Record<CollapsibleFleetVehicleColumnKey, boolean>,
) {
  return [
    row.vehicleType,
    row.equipmentType,
    row.brand,
    row.model,
    row.plateNumber,
    row.garageNumber,
    collapsedColumns.fuelCardNumber ? "" : row.fuelCardNumber,
    collapsedColumns.manufactureYear ? "" : row.manufactureYear,
    collapsedColumns.vin ? "" : row.vin,
    collapsedColumns.owner ? "" : row.owner,
    row.firstWatchFirstShiftDriver,
    row.firstWatchSecondShiftDriver,
    row.secondWatchFirstShiftDriver,
    row.secondWatchSecondShiftDriver,
  ];
}

function FleetVehicleTableRow({
  collapsedColumns,
  row,
  driversExpanded,
}: {
  collapsedColumns: Record<CollapsibleFleetVehicleColumnKey, boolean>;
  row: FleetVehicleListRow;
  driversExpanded: boolean;
}) {
  return (
    <tr>
      <Td center>{row.index}</Td>
      <Td>{row.vehicleType}</Td>
      <Td>{row.equipmentType}</Td>
      <Td>{row.brand}</Td>
      <Td>{row.model}</Td>
      <Td>{row.plateNumber}</Td>
      <Td>{row.garageNumber}</Td>
      {!collapsedColumns.fuelCardNumber ? <Td>{row.fuelCardNumber}</Td> : null}
      {!collapsedColumns.manufactureYear ? <Td center>{row.manufactureYear}</Td> : null}
      {!collapsedColumns.vin ? <Td>{row.vin}</Td> : null}
      {!collapsedColumns.owner ? <Td>{row.owner}</Td> : null}
      {driversExpanded ? (
        <>
          <Td>{row.firstWatchFirstShiftDriver}</Td>
          <Td>{row.firstWatchSecondShiftDriver}</Td>
          <Td>{row.secondWatchFirstShiftDriver}</Td>
          <Td>{row.secondWatchSecondShiftDriver}</Td>
        </>
      ) : null}
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
