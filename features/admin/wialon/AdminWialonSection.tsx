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

type WialonTelemetry = {
  lastSignalAt: string | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  satellites: number | null;
  mileage: number | null;
  canMileage: number | null;
  engineHours: number | null;
  engineOn: boolean | null;
  engineRpm: number | null;
  fuelLevel: number | null;
  externalVoltage: number | null;
  internalVoltage: number | null;
  gsmLevel: number | null;
  validNavigation: boolean | null;
};

type WialonAdminUnit = {
  id: number;
  name: string;
  uniqueId: string;
  phone: string;
  telemetry?: WialonTelemetry;
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

type DiagnosticStatus = "Норма" | "Предупреждение" | "Ошибка" | "Нет данных";

type DiagnosticRow = {
  id: number;
  unitName: string;
  mapping: string;
  gps: string;
  engineHours: string;
  mileage: string;
  fuel: string;
  sensors: string;
  status: DiagnosticStatus;
  problem: string;
  recommendation: string;
};

type AdminWialonSectionProps = {
  vehicleRows: VehicleRow[];
};

const PAGE_SIZE = 50;

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

function normalizeGarage(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s_\-\/\\]+/g, "")
    .replace(/[^0-9A-ZА-ЯЁ]/g, "");
}

function garageKeysFromWialonName(name: string) {
  const keys = new Set<string>();
  const trimmed = name.trim();
  const withoutBrackets = trimmed.replace(/^\[|\]$/g, "");
  const withoutPrefix = withoutBrackets.replace(/^\([^)]*\)/, "");
  const beforeComment = withoutPrefix.split("(")[0]?.trim() ?? withoutPrefix;
  const firstToken = beforeComment.split(/\s+/)[0] ?? beforeComment;

  for (const value of [trimmed, withoutBrackets, withoutPrefix, beforeComment, firstToken]) {
    const normalized = normalizeGarage(value);
    if (normalized) keys.add(normalized);
  }

  return Array.from(keys);
}

function displayGarageFromWialonName(name: string) {
  return garageKeysFromWialonName(name)[0] ?? name;
}

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ru-RU");
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "нет данных";
  return value.toLocaleString("ru-RU", { maximumFractionDigits: digits });
}

function statusText(status: "unknown" | "ok" | "error") {
  if (status === "ok") return "Успешно";
  if (status === "error") return "Ошибка";
  return "Не проверено";
}

function logStatusText(status: string) {
  if (status === "success") return "Успешно";
  if (status === "error") return "Ошибка";
  return status;
}

function logTypeText(syncType: string) {
  const names: Record<string, string> = {
    "check-connection": "Проверка подключения",
    "unit-sync": "Загрузка техники",
    "unit-mapping": "Сопоставление",
    "position-sync": "Координаты",
  };

  return names[syncType] ?? syncType;
}

function hoursSince(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return (Date.now() - date.getTime()) / 1000 / 60 / 60;
}

function sensorText(unit: WialonAdminUnit) {
  const telemetry = unit.telemetry;
  const parts = [
    unit.uniqueId ? "UID есть" : "UID API не отдает",
    unit.phone ? "SIM есть" : "SIM API не отдает",
    telemetry?.validNavigation === true ? "GPS валиден" : telemetry?.validNavigation === false ? "GPS невалиден" : "GPS н/д",
    typeof telemetry?.satellites === "number" ? `${telemetry.satellites} спутн.` : "спутн. н/д",
    typeof telemetry?.gsmLevel === "number" ? `GSM ${telemetry.gsmLevel}` : "GSM н/д",
  ];

  return parts.join(" / ");
}

function gpsText(unit: WialonAdminUnit) {
  const telemetry = unit.telemetry;
  if (!telemetry?.lastSignalAt) return "нет сигнала";

  const speed = typeof telemetry.speed === "number" ? `${formatNumber(telemetry.speed, 0)} км/ч` : "скорость н/д";
  const satellites = typeof telemetry.satellites === "number" ? `${telemetry.satellites} спутн.` : "спутн. н/д";
  return `${formatDate(telemetry.lastSignalAt)} / ${speed} / ${satellites}`;
}

function engineHoursText(unit: WialonAdminUnit) {
  const telemetry = unit.telemetry;
  if (typeof telemetry?.engineHours !== "number") return unit.vehicleId === null ? "Не проверяется" : "нет моточасов";

  const engineState = telemetry.engineOn === true ? "двигатель вкл" : telemetry.engineOn === false ? "двигатель выкл" : "двигатель н/д";
  const rpm = typeof telemetry.engineRpm === "number" ? ` / ${formatNumber(telemetry.engineRpm, 0)} об/мин` : "";
  return `${formatNumber(telemetry.engineHours, 2)} мч / ${engineState}${rpm}`;
}

function mileageText(unit: WialonAdminUnit) {
  const telemetry = unit.telemetry;
  const values = [];
  if (typeof telemetry?.mileage === "number") values.push(`GPS ${formatNumber(telemetry.mileage, 1)} км`);
  if (typeof telemetry?.canMileage === "number") values.push(`CAN ${formatNumber(telemetry.canMileage, 1)} км`);
  if (!values.length) return unit.vehicleId === null ? "Не проверяется" : "нет пробега";
  return values.join(" / ");
}

function fuelText(unit: WialonAdminUnit) {
  const telemetry = unit.telemetry;
  if (typeof telemetry?.fuelLevel !== "number") return unit.vehicleId === null ? "Не проверяется" : "нет топлива";

  const voltage = typeof telemetry.externalVoltage === "number" ? ` / ${formatNumber(telemetry.externalVoltage, 2)} В` : "";
  return `${formatNumber(telemetry.fuelLevel, 1)} л${voltage}`;
}

function buildDiagnosticRow(unit: WialonAdminUnit): DiagnosticRow {
  const problems: string[] = [];
  const recommendations: string[] = [];
  let status: DiagnosticStatus = "Норма";
  const syncAgeHours = hoursSince(unit.syncedAt);
  const signalAgeHours = hoursSince(unit.telemetry?.lastSignalAt ?? null);

  if (unit.vehicleId === null) {
    status = "Ошибка";
    problems.push("объект Wialon не сопоставлен с техникой сайта");
    recommendations.push("сопоставить по гаражному номеру или выбрать технику вручную");
  }

  if (!unit.syncedAt) {
    status = "Нет данных";
    problems.push("нет даты загрузки объекта из Wialon");
    recommendations.push("нажать “Загрузить технику”");
  } else if (syncAgeHours !== null && syncAgeHours > 24) {
    status = status === "Ошибка" ? "Ошибка" : "Предупреждение";
    problems.push("список Wialon не обновлялся больше суток");
    recommendations.push("обновить список техники из Wialon");
  }

  if (!unit.telemetry?.lastSignalAt) {
    status = status === "Ошибка" || status === "Нет данных" ? status : "Нет данных";
    problems.push("нет последнего сигнала GPS");
    recommendations.push("обновить координаты или проверить терминал GPS");
  } else if (signalAgeHours !== null && signalAgeHours > 2) {
    status = status === "Ошибка" || status === "Нет данных" ? status : "Предупреждение";
    problems.push("последний сигнал GPS старше 2 часов");
    recommendations.push("проверить связь, питание терминала и стоянку техники");
  }

  if (unit.telemetry?.validNavigation === false) {
    status = status === "Ошибка" || status === "Нет данных" ? status : "Предупреждение";
    problems.push("последняя навигация невалидна");
    recommendations.push("проверить GPS-антенну и прием спутников");
  }

  if (!unit.uniqueId && !unit.phone) {
    recommendations.push("UID/SIM Wialon API не отдает; для контроля IMEI/SIM использовать карточку техники или ручные поля");
  }

  if (unit.hidden) {
    status = status === "Ошибка" || status === "Нет данных" ? status : "Предупреждение";
    problems.push("объект скрыт на сайте");
    recommendations.push("оставить скрытым только лишнюю, тестовую или снятую технику");
  }

  return {
    id: unit.id,
    unitName: unit.name,
    mapping: unit.vehicleId === null ? "Нет привязки" : "Привязана",
    gps: gpsText(unit),
    engineHours: engineHoursText(unit),
    mileage: mileageText(unit),
    fuel: fuelText(unit),
    sensors: sensorText(unit),
    status,
    problem: problems.length ? problems.join("; ") : "критичных проблем по связке Wialon не найдено",
    recommendation: recommendations.length
      ? Array.from(new Set(recommendations)).join("; ")
      : "следующий этап — сверить моточасы, пробег и топливо со сводкой и нормами",
  };
}

export function AdminWialonSection({ vehicleRows }: AdminWialonSectionProps) {
  const [units, setUnits] = useState<WialonAdminUnit[]>([]);
  const [logs, setLogs] = useState<WialonSyncLog[]>([]);
  const [status, setStatus] = useState<"unknown" | "ok" | "error">("unknown");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUnits, setShowUnits] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  const [filter, setFilter] = useState<"all" | "mapped" | "unmapped" | "hidden">("all");
  const [page, setPage] = useState(1);
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(() => new Set());

  const vehicleOptions = useMemo(
    () => vehicleRows.filter((vehicle) => vehicle.visible !== false),
    [vehicleRows],
  );

  const vehicleByGarage = useMemo(() => {
    const map = new Map<string, VehicleRow>();
    const duplicates = new Set<string>();

    for (const vehicle of vehicleOptions) {
      const key = normalizeGarage(vehicle.garageNumber);
      if (!key) continue;
      if (map.has(key)) {
        duplicates.add(key);
        continue;
      }
      map.set(key, vehicle);
    }

    for (const key of duplicates) {
      map.delete(key);
    }

    return map;
  }, [vehicleOptions]);

  const assignedVehicleIds = useMemo(() => {
    const ids = new Set<number>();
    for (const unit of units) {
      if (unit.vehicleId !== null) {
        ids.add(unit.vehicleId);
      }
    }
    return ids;
  }, [units]);

  const latestLog = logs[0] ?? null;
  const persistedStatus = latestLog?.status === "success" ? "ok" : latestLog?.status === "error" ? "error" : "unknown";
  const displayStatus = status === "unknown" ? persistedStatus : status;
  const mappedCount = units.filter((unit) => unit.vehicleId !== null).length;
  const hiddenCount = units.filter((unit) => unit.hidden).length;
  const unmappedCount = units.length - mappedCount;
  const diagnostics = useMemo(() => units.map(buildDiagnosticRow), [units]);
  const diagnosticsToReview = diagnostics.filter((row) => row.status !== "Норма");
  const diagnosticErrors = diagnostics.filter((row) => row.status === "Ошибка" || row.status === "Нет данных").length;
  const diagnosticWarnings = diagnostics.filter((row) => row.status === "Предупреждение").length;
  const diagnosticRows = diagnosticsToReview.length ? diagnosticsToReview.slice(0, 50) : diagnostics.slice(0, 50);

  const filteredUnits = useMemo(() => {
    const result = units.filter((unit) => {
      if (filter === "mapped") return unit.vehicleId !== null;
      if (filter === "unmapped") return unit.vehicleId === null;
      if (filter === "hidden") return unit.hidden;
      return true;
    });

    return result;
  }, [filter, units]);

  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / PAGE_SIZE));
  const pageUnits = filteredUnits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getSelectableVehicles = (unit: WialonAdminUnit) => (
    vehicleOptions.filter((vehicle) => vehicle.id === unit.vehicleId || !assignedVehicleIds.has(vehicle.id))
  );

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

  useEffect(() => {
    setPage(1);
  }, [filter, showUnits]);

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
    setMessage(`Подключение работает. Объектов Wialon по API: ${body.unitsCount ?? 0}.`);
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
    setShowUnits(true);
    setDirtyIds(new Set());
    setMessage(`Техника Wialon загружена: ${(body.units ?? []).length}. Если в интерфейсе Wialon видно меньше, значит в Wialon включены фильтры или часть объектов скрыта/служебная.`);
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
    const changedUnits = dirtyIds.size
      ? units.filter((unit) => dirtyIds.has(unit.id))
      : units;

    const response = await fetch("/api/wialon/sync/units", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dispatcher-Request": "same-origin",
      },
      body: JSON.stringify({
        mappingsOnly: true,
        mappings: changedUnits.map((unit) => ({
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
    setDirtyIds(new Set());
    setMessage(`Сопоставления Wialon сохранены: ${changedUnits.length}.`);
  });

  const markDirty = (id: number) => {
    setDirtyIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };

  const updateUnitMapping = (id: number, vehicleId: number | null) => {
    setUnits((current) => current.map((unit) => (
      unit.id === id ? { ...unit, vehicleId } : unit
    )));
    markDirty(id);
  };

  const updateUnitHidden = (id: number, hidden: boolean) => {
    setUnits((current) => current.map((unit) => (
      unit.id === id ? { ...unit, hidden } : unit
    )));
    markDirty(id);
  };

  const autoMatchByGarage = () => {
    let matched = 0;
    const changedIds = new Set<number>();

    setUnits((current) => current.map((unit) => {
      if (unit.vehicleId !== null) return unit;

      const match = garageKeysFromWialonName(unit.name)
        .map((key) => vehicleByGarage.get(key))
        .find(Boolean);

      if (!match) return unit;

      matched += 1;
      changedIds.add(unit.id);
      return { ...unit, vehicleId: match.id };
    }));

    setDirtyIds((current) => {
      const next = new Set(current);
      for (const id of changedIds) next.add(id);
      return next;
    });

    setShowUnits(true);
    setFilter("unmapped");
    setMessage(
      matched
        ? `Автосопоставлено по гаражному номеру: ${matched}. Нажми “Сохранить сопоставления”, чтобы записать изменения в базу.`
        : "Совпадения по гаражному номеру не найдены.",
    );
  };

  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Wialon Local</h2>
          <div style={subtitleStyle}>
            Подключение работает только через backend. При открытии вкладки Wialon не опрашивается — показываются сохраненные данные сайта.
          </div>
        </div>
        <div style={actionsStyle}>
          <button disabled={loading} onClick={checkConnection} style={buttonStyle} type="button">Проверить подключение</button>
          <button disabled={loading} onClick={syncUnits} style={primaryButtonStyle} type="button">Загрузить технику</button>
          <button disabled={loading || units.length === 0} onClick={autoMatchByGarage} style={buttonStyle} type="button">Автосопоставить по гаражному №</button>
          <button disabled={loading || dirtyIds.size === 0} onClick={saveMappings} style={buttonStyle} type="button">Сохранить сопоставления</button>
          <button disabled={loading || units.length === 0} onClick={syncPositions} style={buttonStyle} type="button">Обновить координаты</button>
        </div>
      </div>

      <div style={statusGridStyle}>
        <div style={statusCardStyle}>
          <div style={labelStyle}>Статус подключения</div>
          <div style={valueStyle}>{statusText(displayStatus)}</div>
        </div>
        <div style={statusCardStyle}>
          <div style={labelStyle}>Объекты Wialon в базе сайта</div>
          <div style={valueStyle}>{units.length}</div>
        </div>
        <div style={statusCardStyle}>
          <div style={labelStyle}>Сопоставлено</div>
          <div style={valueStyle}>{mappedCount}</div>
        </div>
        <div style={statusCardStyle}>
          <div style={labelStyle}>Не сопоставлено</div>
          <div style={valueStyle}>{unmappedCount}</div>
        </div>
        <div style={statusCardStyle}>
          <div style={labelStyle}>Скрыто</div>
          <div style={valueStyle}>{hiddenCount}</div>
        </div>
        <div style={statusCardStyle}>
          <div style={labelStyle}>Последняя синхронизация</div>
          <div style={valueStyle}>{formatDate(latestLog?.finishedAt ?? latestLog?.createdAt ?? null) || "Нет данных"}</div>
        </div>
      </div>

      {message ? <div style={displayStatus === "error" ? errorStyle : statusCardStyle}>{message}</div> : null}

      <div style={{ ...statusCardStyle, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button onClick={() => setShowUnits((value) => !value)} style={buttonStyle} type="button">
            {showUnits ? "Скрыть таблицу техники" : `Показать таблицу техники (${units.length})`}
          </button>
          <button onClick={() => setShowLogs((value) => !value)} style={buttonStyle} type="button">
            {showLogs ? "Скрыть технический журнал" : "Показать технический журнал"}
          </button>
          <button onClick={() => setShowDiagnostics((value) => !value)} style={buttonStyle} type="button">
            {showDiagnostics ? "Скрыть диагностику данных" : "Показать диагностику данных"}
          </button>
        </div>
        <div style={{ color: "#64748b", fontSize: 13 }}>
          Несохраненных изменений: {dirtyIds.size}
        </div>
      </div>

      {showDiagnostics ? (
        <div style={tableWrapStyle}>
          <div style={{ ...statusCardStyle, marginBottom: 10 }}>
            <div style={labelStyle}>Диагностика качества данных Wialon / GPS / ДУТ / CAN</div>
            <div style={{ color: "#475569", fontSize: 13, marginTop: 6 }}>
              Ошибки: {diagnosticErrors}. Предупреждения: {diagnosticWarnings}. Сейчас показываются реальные данные Wialon API: последний сигнал, скорость, спутники, моточасы, пробег, CAN-пробег, топливо, напряжение и GSM.
            </div>
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Объект Wialon</th>
                <th style={thStyle}>Связка</th>
                <th style={thStyle}>GPS</th>
                <th style={thStyle}>Моточасы</th>
                <th style={thStyle}>Пробег</th>
                <th style={thStyle}>Топливо</th>
                <th style={thStyle}>Датчики</th>
                <th style={thStyle}>Статус</th>
                <th style={thStyle}>Проблема</th>
                <th style={thStyle}>Рекомендация</th>
              </tr>
            </thead>
            <tbody>
              {diagnosticRows.map((row) => (
                <tr key={row.id}>
                  <td style={tdStyle}>{row.unitName}</td>
                  <td style={tdStyle}>{row.mapping}</td>
                  <td style={tdStyle}>{row.gps}</td>
                  <td style={tdStyle}>{row.engineHours}</td>
                  <td style={tdStyle}>{row.mileage}</td>
                  <td style={tdStyle}>{row.fuel}</td>
                  <td style={tdStyle}>{row.sensors}</td>
                  <td style={tdStyle}>{row.status}</td>
                  <td style={tdStyle}>{row.problem}</td>
                  <td style={tdStyle}>{row.recommendation}</td>
                </tr>
              ))}
              {diagnosticRows.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ ...tdStyle, color: "#64748b", textAlign: "center" }}>
                    Нет данных для диагностики. Сначала загрузите технику из Wialon.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {showUnits ? (
        <>
          <div style={{ ...statusCardStyle, display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button onClick={() => setFilter("all")} style={filter === "all" ? primaryButtonStyle : buttonStyle} type="button">Все</button>
            <button onClick={() => setFilter("unmapped")} style={filter === "unmapped" ? primaryButtonStyle : buttonStyle} type="button">Не сопоставлено</button>
            <button onClick={() => setFilter("mapped")} style={filter === "mapped" ? primaryButtonStyle : buttonStyle} type="button">Сопоставлено</button>
            <button onClick={() => setFilter("hidden")} style={filter === "hidden" ? primaryButtonStyle : buttonStyle} type="button">Скрытые</button>
          </div>

          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Wialon ID</th>
                  <th style={thStyle}>Гаражный № Wialon</th>
                  <th style={thStyle}>Объект Wialon</th>
                  <th style={thStyle}>Техника сайта</th>
                  <th style={thStyle}>Скрыть</th>
                  <th style={thStyle}>Статус</th>
                </tr>
              </thead>
              <tbody>
                {pageUnits.map((unit) => (
                  <tr key={unit.id}>
                    <td style={tdStyle}>{unit.id}</td>
                    <td style={tdStyle}>{displayGarageFromWialonName(unit.name)}</td>
                    <td style={tdStyle}>{unit.name}</td>
                    <td style={tdStyle}>
                      <select
                        style={selectStyle}
                        value={unit.vehicleId ?? ""}
                        onChange={(event) => updateUnitMapping(unit.id, event.target.value ? Number(event.target.value) : null)}
                      >
                        <option value="">Не сопоставлено</option>
                        {getSelectableVehicles(unit).map((vehicle) => (
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
                    <td style={tdStyle}>
                      {dirtyIds.has(unit.id)
                        ? "Не сохранено"
                        : unit.hidden
                          ? "Скрыто"
                          : unit.vehicleId
                            ? "Сопоставлено"
                            : "Не сопоставлено"}
                    </td>
                  </tr>
                ))}
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, color: "#64748b", textAlign: "center" }}>
                      Объекты Wialon по выбранному фильтру не найдены.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div style={{ ...statusCardStyle, display: "flex", gap: 8, justifyContent: "space-between" }}>
            <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} style={buttonStyle} type="button">Назад</button>
            <div style={{ color: "#475569", fontSize: 13 }}>
              Страница {page} из {totalPages}. Показано {pageUnits.length} из {filteredUnits.length}.
            </div>
            <button disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} style={buttonStyle} type="button">Вперед</button>
          </div>
        </>
      ) : null}

      {showLogs ? (
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
                  <td style={tdStyle}>{logTypeText(log.syncType)}</td>
                  <td style={tdStyle}>{logStatusText(log.status)}</td>
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
      ) : null}
    </div>
  );
}
