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
    setMessage(`\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435 \u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0442. \u041e\u0431\u044a\u0435\u043a\u0442\u043e\u0432 Wialon: ${body.unitsCount ?? 0}.`);
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
    setMessage(`\u0422\u0435\u0445\u043d\u0438\u043a\u0430 Wialon \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u0430: ${(body.units ?? []).length}.`);
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
    setMessage(`\u041a\u043e\u043e\u0440\u0434\u0438\u043d\u0430\u0442\u044b \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u044b: ${body.result?.insertedPositionsCount ?? 0}.`);
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
    setMessage("\u0421\u043e\u043f\u043e\u0441\u0442\u0430\u0432\u043b\u0435\u043d\u0438\u044f Wialon \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b.");
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
          <div style={subtitleStyle}>Backend-only \u0438\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044f \u0441 Wialon Local. \u0422\u043e\u043a\u0435\u043d \u0438 \u0441\u0435\u0441\u0441\u0438\u044f \u043d\u0435 \u043f\u0435\u0440\u0435\u0434\u0430\u044e\u0442\u0441\u044f \u0432\u043e frontend.</div>
        </div>
        <div style={actionsStyle}>
          <button disabled={loading} onClick={checkConnection} style={buttonStyle} type="button">\u041f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435</button>
          <button disabled={loading} onClick={syncUnits} style={primaryButtonStyle} type="button">\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0442\u0435\u0445\u043d\u0438\u043a\u0443</button>
          <button disabled={loading || units.length === 0} onClick={saveMappings} style={buttonStyle} type="button">\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0441\u043e\u043f\u043e\u0441\u0442\u0430\u0432\u043b\u0435\u043d\u0438\u044f</button>
          <button disabled={loading || units.length === 0} onClick={syncPositions} style={buttonStyle} type="button">\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u043a\u043e\u043e\u0440\u0434\u0438\u043d\u0430\u0442\u044b</button>
        </div>
      </div>

      <div style={statusGridStyle}>
        <div style={statusCardStyle}>
          <div style={labelStyle}>\u0421\u0442\u0430\u0442\u0443\u0441 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u044f</div>
          <div style={valueStyle}>{status === "ok" ? "\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u043e" : status === "error" ? "\u041e\u0448\u0438\u0431\u043a\u0430" : "\u041d\u0435 \u043f\u0440\u043e\u0432\u0435\u0440\u0435\u043d\u043e"}</div>
        </div>
        <div style={statusCardStyle}>
          <div style={labelStyle}>\u041e\u0431\u044a\u0435\u043a\u0442\u044b Wialon</div>
          <div style={valueStyle}>{units.length}</div>
        </div>
        <div style={statusCardStyle}>
          <div style={labelStyle}>\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u044f\u044f \u0441\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0430\u0446\u0438\u044f</div>
          <div style={valueStyle}>{formatDate(latestLog?.finishedAt ?? latestLog?.createdAt ?? null) || "\u041d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445"}</div>
        </div>
      </div>

      {message ? <div style={status === "error" ? errorStyle : statusCardStyle}>{message}</div> : null}

      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Wialon ID</th>
              <th style={thStyle}>\u041e\u0431\u044a\u0435\u043a\u0442</th>
              <th style={thStyle}>UID</th>
              <th style={thStyle}>\u0422\u0435\u0445\u043d\u0438\u043a\u0430 \u0441\u0430\u0439\u0442\u0430</th>
              <th style={thStyle}>\u0421\u043a\u0440\u044b\u0442\u044c</th>
              <th style={thStyle}>\u0421\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0430\u0446\u0438\u044f</th>
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
                    <option value="">\u041d\u0435 \u0441\u043e\u043f\u043e\u0441\u0442\u0430\u0432\u043b\u0435\u043d\u043e</option>
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
                  \u041e\u0431\u044a\u0435\u043a\u0442\u044b Wialon \u0435\u0449\u0435 \u043d\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u044b.
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
              <th style={thStyle}>\u0412\u0440\u0435\u043c\u044f</th>
              <th style={thStyle}>\u0422\u0438\u043f</th>
              <th style={thStyle}>\u0421\u0442\u0430\u0442\u0443\u0441</th>
              <th style={thStyle}>\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435</th>
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
                  \u0416\u0443\u0440\u043d\u0430\u043b Wialon \u043f\u043e\u043a\u0430 \u043f\u0443\u0441\u0442.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
