"use client";

import { useEffect, useMemo, useState } from "react";

import type { VehicleRow } from "@/lib/domain/vehicles/types";
import {
  actionsStyle,
  buttonStyle,
  errorStyle,
  headerStyle,
  labelStyle,
  primaryButtonStyle,
  sectionStyle,
  selectStyle,
  statusCardStyle,
  statusGridStyle,
  subtitleStyle,
  tableStyle,
  tableWrapStyle,
  tdStyle,
  thStyle,
  titleStyle,
  valueStyle,
} from "./AdminWialonStyles";

type WialonAdminUnit = {
  id: number;
  name: string;
  uniqueId: string;
  phone: string;
  vehicleId: number | null;
  hidden: boolean;
  syncedAt: string | null;
  updatedAt: string | null;
};

type WialonSyncLog = {
  id: number;
  syncType: string;
  status: string;
  message: string;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
};

type AdminWialonSectionProps = {
  vehicleRows: VehicleRow[];
};

function vehicleLabel(vehicle: VehicleRow) {
  return [
    vehicle.id,
    vehicle.equipmentType || vehicle.vehicleType,
    vehicle.brand,
    vehicle.model,
    vehicle.plateNumber,
    vehicle.garageNumber,
  ].map((part) => String(part ?? "").trim()).filter(Boolean).join(" / ");
}

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ru-RU");
}

export function AdminWialonSection({ vehicleRows }: AdminWialonSectionProps) {
  const [units, setUnits] = useState<WialonAdminUnit[]>([]);
  const [logs, setLogs] = useState<WialonSyncLog[]>([]);
  const [status, setStatus] = useState<"unknown" | "ok" | "error">("unknown");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const vehicleOptions = useMemo(
    () => vehicleRows.filter((vehicle) => vehicle.visible !== false),
    [vehicleRows],
  );

  const latestLog = logs[0] ?? null;

  const loadStoredSnapshot = async () => {
    const response = await fetch("/api/wialon/units?source=database", {
      headers: { "X-Dispatcher-Request": "same-origin" },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "Wialon snapshot load failed");

    setUnits(body.storedUnits ?? []);
    setLogs(body.logs ?? []);
  };

  useEffect(() => {
    void loadStoredSnapshot().catch((error) => {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Wialon snapshot load failed");
    });
  }, []);

  const runAction = async (action: () => Promise<void>) => {
    setLoading(true);
    setMessage("");
    try {
      await action();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Wialon request failed");
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = () => runAction(async () => {
    const response = await fetch("/api/wialon/units?source=check", {
      headers: { "X-Dispatcher-Request": "same-origin" },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "Wialon connection failed");

    setLogs(body.logs ?? []);
    setStatus("ok");
    setMessage(`Подключение работает. Объектов Wialon: ${body.unitsCount ?? 0}.`);
  });

  const syncUnits = () => runAction(async () => {
    const response = await fetch("/api/wialon/sync/units", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dispatcher-Request": "same-origin",
      },
      body: JSON.stringify({}),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "Wialon units sync failed");

    setUnits(body.units ?? []);
    await loadStoredSnapshot();
    setStatus("ok");
    setMessage(`Техника Wialon загружена: ${(body.units ?? []).length}.`);
  });

  const syncPositions = () => runAction(async () => {
    const response = await fetch("/api/wialon/sync/positions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dispatcher-Request": "same-origin",
      },
      body: JSON.stringify({}),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "Wialon positions sync failed");

    await loadStoredSnapshot();
    setStatus("ok");
    setMessage(`Координаты обновлены: ${body.result?.insertedPositionsCount ?? 0}.`);
  });

  const saveMappings = () => runAction(async () => {
    const response = await fetch("/api/wialon/sync/units", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dispatcher-Request": "same-origin",
      },
      body: JSON.stringify({
        mappingsOnly: true,
        mappings: units.map((unit) => ({
          wialonUnitId: unit.id,
          vehicleId: unit.vehicleId,
          hidden: unit.hidden,
        })),
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "Wialon mappings save failed");

    setUnits(body.units ?? []);
    await loadStoredSnapshot();
    setStatus("ok");
    setMessage("Сопоставления Wialon сохранены.");
  });

  const updateUnitMapping = (id: number, vehicleId: number | null) => {
    setUnits((current) => current.map((unit) => (
      unit.id === id ? { ...unit, vehicleId } : unit
    )));
  };

  const updateUnitHidden = (id: number, hidden: boolean) => {
    setUnits((current) => current.map((unit) => (
      unit.id === id ? { ...unit, hidden } : unit
    )));
  };

  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Wialon Local</h2>
          <div style={subtitleStyle}>Backend-only интеграция с Wialon Local. Токен и сессия не передаются во frontend.</div>
        </div>
        <div style={actionsStyle}>
          <button disabled={loading} onClick={checkConnection} style={buttonStyle} type="button">Проверить подключение</button>
          <button disabled={loading} onClick={syncUnits} style={primaryButtonStyle} type="button">Загрузить технику</button>
          <button disabled={loading || units.length === 0} onClick={saveMappings} style={buttonStyle} type="button">Сохранить сопоставления</button>
          <button disabled={loading || units.length === 0} onClick={syncPositions} style={buttonStyle} type="button">Обновить координаты</button>
        </div>
      </div>

      <div style={statusGridStyle}>
        <div style={statusCardStyle}>
          <div style={labelStyle}>Статус подключения</div>
          <div style={valueStyle}>{status === "ok" ? "Успешно" : status === "error" ? "Ошибка" : "Не проверено"}</div>
        </div>
        <div style={statusCardStyle}>
          <div style={labelStyle}>Объекты Wialon</div>
          <div style={valueStyle}>{units.length}</div>
        </div>
        <div style={statusCardStyle}>
          <div style={labelStyle}>Последняя синхронизация</div>
          <div style={valueStyle}>{formatDate(latestLog?.finishedAt ?? latestLog?.createdAt ?? null) || "Нет данных"}</div>
        </div>
      </div>

      {message ? <div style={status === "error" ? errorStyle : statusCardStyle}>{message}</div> : null}

      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Wialon ID</th>
              <th style={thStyle}>Объект</th>
              <th style={thStyle}>UID</th>
              <th style={thStyle}>Техника сайта</th>
              <th style={thStyle}>Скрыть</th>
              <th style={thStyle}>Синхронизация</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id}>
                <td style={tdStyle}>{unit.id}</td>
                <td style={tdStyle}>{unit.name}</td>
                <td style={tdStyle}>{unit.uniqueId}</td>
                <td style={tdStyle}>
                  <select
                    style={selectStyle}
                    value={unit.vehicleId ?? ""}
                    onChange={(event) => updateUnitMapping(unit.id, event.target.value ? Number(event.target.value) : null)}
                  >
                    <option value="">Не сопоставлено</option>
                    {vehicleOptions.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>{vehicleLabel(vehicle)}</option>
                    ))}
                  </select>
                </td>
                <td style={tdStyle}>
                  <input
                    checked={unit.hidden}
                    onChange={(event) => updateUnitHidden(unit.id, event.target.checked)}
                    type="checkbox"
                  />
                </td>
                <td style={tdStyle}>{formatDate(unit.syncedAt)}</td>
              </tr>
            ))}
            {units.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, color: "#64748b", textAlign: "center" }}>
                  Объекты Wialon еще не загружены.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Время</th>
              <th style={thStyle}>Тип</th>
              <th style={thStyle}>Статус</th>
              <th style={thStyle}>Сообщение</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={tdStyle}>{formatDate(log.createdAt)}</td>
                <td style={tdStyle}>{log.syncType}</td>
                <td style={tdStyle}>{log.status}</td>
                <td style={tdStyle}>{log.message}</td>
              </tr>
            ))}
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ ...tdStyle, color: "#64748b", textAlign: "center" }}>
                  Журнал Wialon пока пуст.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
