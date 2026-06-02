import { createWialonApiError, WialonApiError } from "./errors";
import type { WialonPosition, WialonUnit } from "./types";

const wialonHost = "https://wialon.fleetbook.kz/wialon/ajax.html";
const wialonUnitFlags = 1281;

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

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function unixTimeToIso(value: unknown) {
  const seconds = asNumber(value);
  return seconds === null ? null : new Date(seconds * 1000).toISOString();
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

function normalizeWialonUnit(rawUnit: unknown): WialonUnit {
  const unit = asRecord(rawUnit);
  const id = asNumber(unit.id);
  if (id === null) {
    throw new WialonApiError("Wialon unit does not contain numeric id", undefined, unit);
  }

  const uniqueId = asString(unit.uid || unit.hw || unit.ph);

  return {
    id,
    name: asString(unit.nm),
    uniqueId,
    phone: asString(unit.ph),
    position: normalizeWialonPosition(unit.pos),
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
