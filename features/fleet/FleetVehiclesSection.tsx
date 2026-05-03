"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import type { VehicleRow } from "@/lib/domain/vehicles/types";
import {
  createFleetVehicleListRows,
  type FleetVehicleListRow,
  type FleetVehicleStatus,
} from "@/features/fleet/fleetVehicleModel";

export type FleetVehiclesSectionProps = {
  vehicleRows: VehicleRow[];
};

export function FleetVehiclesSection({ vehicleRows }: FleetVehiclesSectionProps) {
  const [driversExpanded, setDriversExpanded] = useState(false);
  const rows = useMemo(() => createFleetVehicleListRows(vehicleRows), [vehicleRows]);

  return (
    <div style={sectionStyle}>
      <div style={toolbarStyle}>
        <div style={summaryStyle}>Техника: {rows.length}</div>
        <button
          type="button"
          onClick={() => setDriversExpanded((current) => !current)}
          style={driverToggleStyle}
          aria-expanded={driversExpanded}
        >
          {driversExpanded ? "Скрыть водителей" : "Показать водителей"}
        </button>
      </div>

      <div style={tableScrollStyle}>
        <table style={tableStyle}>
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
            {rows.map((row) => (
              <FleetVehicleTableRow key={row.id} row={row} driversExpanded={driversExpanded} />
            ))}
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

function statusBadgeStyle(status: FleetVehicleStatus): CSSProperties {
  if (status === "В ремонте") {
    return { ...badgeStyle, background: "#fee2e2", color: "#991b1b" };
  }

  if (status === "В простое") {
    return { ...badgeStyle, background: "#fef3c7", color: "#92400e" };
  }

  return { ...badgeStyle, background: "#dcfce7", color: "#166534" };
}

const sectionStyle: CSSProperties = {
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const toolbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
};

const summaryStyle: CSSProperties = {
  color: "#475569",
  fontSize: 13,
  fontWeight: 700,
};

const driverToggleStyle: CSSProperties = {
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "#cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 6,
  padding: "7px 10px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
};

const tableScrollStyle: CSSProperties = {
  overflow: "auto",
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "#0f172a",
  maxHeight: "calc(100vh - 174px)",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "auto",
  fontSize: 12,
};

const thStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  background: "#f8fafc",
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "#94a3b8",
  padding: "7px 8px",
  textAlign: "center",
  verticalAlign: "middle",
  fontWeight: 700,
  whiteSpace: "normal",
  lineHeight: 1.2,
};

const tdBaseStyle: CSSProperties = {
  borderStyle: "solid",
  borderWidth: 1,
  borderColor: "#cbd5e1",
  padding: "6px 8px",
  verticalAlign: "middle",
  lineHeight: 1.2,
  overflowWrap: "break-word",
};

const tdStyle: CSSProperties = {
  ...tdBaseStyle,
  textAlign: "left",
};

const tdCenterStyle: CSSProperties = {
  ...tdBaseStyle,
  textAlign: "center",
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 78,
  borderRadius: 6,
  padding: "3px 7px",
  fontSize: 11,
  fontWeight: 700,
};
