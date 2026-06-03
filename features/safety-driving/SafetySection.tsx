"use client";

import type { CSSProperties } from "react";

import { AdminWialonSection } from "@/features/admin/wialon/AdminWialonSection";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { SectionCard } from "@/shared/ui/layout";
import type { SubTabConfig } from "../../lib/domain/navigation/tabs";

type SafetySectionProps = {
  tbTab: string;
  subTabs: SubTabConfig[];
  vehicleRows: VehicleRow[];
  onSelectTab: (tab: string) => void;
};

const tableWrapStyle: CSSProperties = {
  overflow: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  maxHeight: "calc(100dvh - 250px)",
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 1180,
  borderCollapse: "collapse",
  fontSize: 12,
};

const thStyle: CSSProperties = {
  padding: "8px 9px",
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  color: "#0f172a",
  fontWeight: 800,
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "7px 9px",
  border: "1px solid #e2e8f0",
  color: "#334155",
  verticalAlign: "top",
};

const noteStyle: CSSProperties = {
  marginBottom: 10,
  border: "1px solid #d8dee8",
  borderRadius: 8,
  background: "#f8fafc",
  color: "#475569",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.35,
  padding: "8px 10px",
};

function statusLabel(vehicle: VehicleRow) {
  if (vehicle.repair > 0) return "Ремонт";
  if (vehicle.downtime > 0) return "Простой";
  if (vehicle.work > 0 || vehicle.trips > 0) return "В работе";
  return vehicle.active ? "Активна" : "Неактивна";
}

export function SafetySection({ tbTab, vehicleRows }: SafetySectionProps) {
  const rows = vehicleRows.filter((vehicle) => vehicle.visible !== false);

  if (tbTab === "wialon" || tbTab === "integrations" || tbTab === "gps-integrations") {
    return <AdminWialonSection vehicleRows={vehicleRows} />;
  }

  return (
    <SectionCard title="">
      <div style={noteStyle}>
        GPS, Wialon и ДУТ объединены в рабочий блок мониторинга техники. Wialon Local доступен в подразделе интеграций GPS/СМТС.
      </div>
      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Участок</th>
              <th style={thStyle}>Вид техники</th>
              <th style={thStyle}>Марка</th>
              <th style={thStyle}>Модель</th>
              <th style={thStyle}>Гос. номер</th>
              <th style={thStyle}>Гар. номер</th>
              <th style={thStyle}>Статус</th>
              <th style={thStyle}>Терминал</th>
              <th style={thStyle}>ДУТ</th>
              <th style={thStyle}>Фары</th>
              <th style={thStyle}>Ремень</th>
              <th style={thStyle}>Экодрайвинг</th>
              <th style={thStyle}>Дата установки</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((vehicle) => (
              <tr key={vehicle.id}>
                <td style={tdStyle}>{vehicle.area}</td>
                <td style={tdStyle}>{vehicle.equipmentType || vehicle.vehicleType}</td>
                <td style={tdStyle}>{vehicle.brand}</td>
                <td style={tdStyle}>{vehicle.model}</td>
                <td style={tdStyle}>{vehicle.plateNumber}</td>
                <td style={tdStyle}>{vehicle.garageNumber}</td>
                <td style={tdStyle}>{statusLabel(vehicle)}</td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={13} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                  Нет видимой техники для GPS / ТБ preview.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
