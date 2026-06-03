import { createWialonApiError, WialonApiError } from "./errors";
import type { WialonPosition, WialonTelemetry, WialonUnit } from "./types";

const wialonHost = "https://wialon.fleetbook.kz/wialon/ajax.html";
const wialonUnitFlags = 4194303;

const fuelLevelParameterKeys = [
  "can_fuel_vlm",
  "fuel level",
  "fuel_level",
  "fuel_lvl",
  "fuel",
  "fuel1",
  "fuel_1",
  "fuel_l",
  "fuel_liters",
  "fuel_litres",
  "can_fuel_level",
  "can_fuel_liters",
  "can_fuel_litres",
  "can_fuel",
  "rs485fuel_level",
  "rs485fuel_level1",
  "rs485_fuel_level",
  "rs485_fuel_level1",
  "lls",
  "lls1",
  "dut",
  "dut1",
  "ДУТ",
  "ДУТ1",
  "топливо",
  "уровень топлива",
];

const fuelTemperatureTokens = [
  "temp",
  "temperature",
  "temper",
  "thermo",
  "term",
  " t",
  "_t",
  "-t",
  ".t",
  "темп",
  "температура",
];

type WialonLoginResponse = {
  eid?: string;
  error?: number;
};

type WialonSearchItemsResponse = {
  items?: unknown[];
  totalItemsCount?: number;
  error?: number;
};

type WialonSearchItemResponse = {
  item?: unknown;
  error?: number;
};

function getWialonToken() {
  const token = process.env.WIALON_TOKEN?.trim();
  if (!token) {
    throw new WialonApiError("WIALON_TOKEN is not configured");
  }

  return token;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function asBoolean(value: unknown) {
  const numberValue = asNumber(value);
  if (numberValue !== null) return numberValue > 0;
  if (typeof value === "boolean") return value;
  return null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function unixTimeToIso(value: unknown) {
  const seconds = asNumber(value);
  return seconds === null ? null : new Date(seconds * 1000).toISOString();
}

function paramValue(params: Record<string, unknown>, key: string) {
  const param = asRecord(params[key]);
  return Object.prototype.hasOwnProperty.call(param, "v") ? param.v : undefined;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = asNumber(value);
    if (numberValue !== null) return numberValue;
  }
  return null;
}

function normalizeParameterKey(key: string) {
  return key.trim().toLowerCase();
}

function isFuelTemperatureParameter(normalizedKey: string) {
  return fuelTemperatureTokens.some((token) => normalizedKey.includes(token));
}

function isFuelLevelParameter(normalizedKey: string, allowedKeys: Set<string>) {
  if (isFuelTemperatureParameter(normalizedKey)) return false;
  if (allowedKeys.has(normalizedKey)) return true;

  const looksLikeLevel = normalizedKey.includes("level")
    || normalizedKey.includes("lvl")
    || normalizedKey.includes("vlm")
    || normalizedKey.includes("volume")
    || normalizedKey.includes("liter")
    || normalizedKey.includes("litre")
    || normalizedKey.includes("литр")
    || normalizedKey.includes("уров")
    || normalizedKey.includes("остат");

  const looksLikeFuelSensor = normalizedKey.includes("fuel")
    || normalizedKey.includes("топл")
    || normalizedKey.includes("дут")
    || normalizedKey.includes("dut")
    || normalizedKey.includes("lls");

  return looksLikeFuelSensor && looksLikeLevel;
}

function findParamNumber(params: Record<string, unknown>, keys: string[]) {
  const allowedKeys = new Set(keys.map(normalizeParameterKey));

  for (const key of keys) {
    const normalizedKey = normalizeParameterKey(key);
    if (!isFuelLevelParameter(normalizedKey, allowedKeys)) continue;

    const direct = asNumber(params[key]);
    if (direct !== null) return { value: direct, source: key };

    const nested = asNumber(paramValue(params, key));
    if (nested !== null) return { value: nested, source: key };
  }

  for (const [key, rawValue] of Object.entries(params)) {
    const normalizedKey = normalizeParameterKey(key);
    if (!isFuelLevelParameter(normalizedKey, allowedKeys)) continue;

    const direct = asNumber(rawValue);
    if (direct !== null) return { value: direct, source: key };

    const nested = asNumber(paramValue(params, key));
    if (nested !== null) return { value: nested, source: key };
  }

  return { value: null, source: null };
}

function normalizeWialonPosition(rawPosition: unknown): WialonPosition | null {
  const position = asRecord(rawPosition);
  if (!Object.keys(position).length) return null;

  return {
    latitude: asNumber(position.y),
    longitude: asNumber(position.x),
    speed: asNumber(position.s),
    course: asNumber(position.c),
    altitude: asNumber(position.z),
    time: unixTimeToIso(position.t),
    raw: position,
  };
}

function normalizeWialonTelemetry(unit: Record<string, unknown>, position: WialonPosition | null): WialonTelemetry {
  const lastMessage = asRecord(unit.lmsg);
  const lastMessagePosition = asRecord(lastMessage.pos);
  const lastMessageParams = asRecord(lastMessage.p);
  const params = asRecord(unit.prms);
  const fuelFromLastMessage = findParamNumber(lastMessageParams, fuelLevelParameterKeys);
  const fuelFromParams = findParamNumber(params, fuelLevelParameterKeys);
  const fuelLevel = firstNumber(fuelFromLastMessage.value, fuelFromParams.value);
  const fuelLevelSource = fuelFromLastMessage.value !== null
    ? `last message: ${fuelFromLastMessage.source}`
    : fuelFromParams.value !== null
      ? `unit parameter: ${fuelFromParams.source}`
      : null;

  return {
    lastSignalAt: unixTimeToIso(lastMessage.t ?? position?.time),
    latitude: firstNumber(position?.latitude, lastMessagePosition.y),
    longitude: firstNumber(position?.longitude, lastMessagePosition.x),
    speed: firstNumber(position?.speed, lastMessagePosition.s, lastMessageParams.can_speed, paramValue(params, "can_speed")),
    satellites: firstNumber(position?.raw.sc, lastMessagePosition.sc, lastMessageParams.sats, paramValue(params, "sats")),
    mileage: firstNumber(lastMessageParams.mileage, paramValue(params, "mileage"), unit.cnm, unit.cnm_km),
    canMileage: firstNumber(lastMessageParams.can_mileage, paramValue(params, "can_mileage")),
    engineHours: firstNumber(lastMessageParams.engine_hours, paramValue(params, "engine_hours"), unit.cneh),
    engineOn: asBoolean(lastMessageParams["engine operation"] ?? paramValue(params, "engine operation") ?? paramValue(params, "in1")),
    engineRpm: firstNumber(lastMessageParams.engine_rpm, paramValue(params, "engine_rpm")),
    fuelLevel,
    fuelLevelSource,
    externalVoltage: firstNumber(lastMessageParams.pwr_ext, lastMessageParams.voltage, paramValue(params, "pwr_ext"), paramValue(params, "voltage")),
    internalVoltage: firstNumber(lastMessageParams.pwr_int, paramValue(params, "pwr_int")),
    gsmLevel: firstNumber(lastMessageParams.gsm, paramValue(params, "gsm")),
    validNavigation: asBoolean(lastMessageParams.valid_nav ?? paramValue(params, "valid_nav")),
  };
}

function normalizeWialonUnit(rawUnit: unknown): WialonUnit {
  const unit = asRecord(rawUnit);
  const id = asNumber(unit.id);
  if (id === null) {
    throw new WialonApiError("Wialon unit does not contain numeric id", undefined, unit);
  }

  const uniqueId = asString(unit.uid || unit.hw || unit.ph);
  const position = normalizeWialonPosition(unit.pos);

  return {
    id,
    name: asString(unit.nm),
    uniqueId,
    phone: asString(unit.ph),
    position,
    telemetry: normalizeWialonTelemetry(unit, position),
    raw: unit,
  };
}

async function callWialon<T>(service: string, params: unknown, sid?: string): Promise<T> {
  const body = new URLSearchParams();
  body.set("svc", service);
  body.set("params", JSON.stringify(params));
  if (sid) body.set("sid", sid);

  const response = await fetch(wialonHost, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new WialonApiError(`Wialon HTTP ${response.status}`);
  }

  const payload = await response.json() as T & { error?: number };
  if (typeof payload.error === "number") {
    throw createWialonApiError(payload.error, payload);
  }

  return payload;
}

export async function loginWialon() {
  const response = await callWialon<WialonLoginResponse>("token/login", { token: getWialonToken() });
  if (!response.eid) {
    throw new WialonApiError("Wialon login response does not contain eid", undefined, response);
  }

  return response.eid;
}

export async function searchWialonUnits() {
  const sid = await loginWialon();
  const response = await callWialon<WialonSearchItemsResponse>("core/search_items", {
    spec: {
      itemsType: "avl_unit",
      propName: "sys_name",
      propValueMask: "*",
      sortType: "sys_name",
    },
    force: 1,
    flags: wialonUnitFlags,
    from: 0,
    to: 0,
  }, sid);

  return (response.items ?? []).map(normalizeWialonUnit);
}

export async function searchWialonUnit(id: number) {
  const sid = await loginWialon();
  const response = await callWialon<WialonSearchItemResponse>("core/search_item", {
    id,
    flags: wialonUnitFlags,
  }, sid);

  if (!response.item) {
    throw new WialonApiError(`Wialon unit ${id} not found`, undefined, response);
  }

  return normalizeWialonUnit(response.item);
}
