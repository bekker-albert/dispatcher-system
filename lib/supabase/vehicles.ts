import { normalizeVehicleRow } from "../domain/vehicles/defaults";
import type { VehicleRowsPatchItem } from "../domain/vehicles/persistence";
import type { VehicleRow } from "../domain/vehicles/types";
import { databaseRequest } from "../database/rpc";
import { supabase, supabaseConfigured } from "./client";
import { serverDatabaseConfigured } from "./config";

export type SupabaseVehiclesState = {
  updatedAt?: string;
  rows: VehicleRow[];
};

export type VehicleSnapshotWriteOptions = {
  expectedSnapshot?: VehicleRow[] | null;
};

export type VehicleSnapshotReplaceOptions = VehicleSnapshotWriteOptions;

type VehicleRecord = {
  vehicle_id: number | string;
  sort_index: number | null;
  visible: boolean | null;
  category: string | null;
  equipment_type: string | null;
  brand: string | null;
  model: string | null;
  plate_number: string | null;
  garage_number: string | null;
  owner: string | null;
  data: unknown;
  updated_at?: string | null;
};

const vehiclesTable = "vehicles";
const batchSize = 500;

function requireSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured");
  }

  return supabase;
}

type SupabaseVehiclesClient = ReturnType<typeof requireSupabase>;

function vehicleToRecord(vehicle: VehicleRow, sortIndex: number): VehicleRecord {
  return {
    vehicle_id: vehicle.id,
    sort_index: sortIndex,
    visible: vehicle.visible !== false,
    category: vehicle.vehicleType,
    equipment_type: vehicle.equipmentType,
    brand: vehicle.brand,
    model: vehicle.model,
    plate_number: vehicle.plateNumber,
    garage_number: vehicle.garageNumber,
    owner: vehicle.owner,
    data: vehicle,
  };
}

function recordToVehicle(record: VehicleRecord): VehicleRow {
  const data = record.data && typeof record.data === "object" && !Array.isArray(record.data)
    ? record.data
    : {};

  return normalizeVehicleRow({
    ...data,
    id: Number(record.vehicle_id),
    visible: record.visible !== false,
    vehicleType: record.category ?? (data as Partial<VehicleRow>).vehicleType,
    equipmentType: record.equipment_type ?? (data as Partial<VehicleRow>).equipmentType,
    brand: record.brand ?? (data as Partial<VehicleRow>).brand,
    model: record.model ?? (data as Partial<VehicleRow>).model,
    plateNumber: record.plate_number ?? (data as Partial<VehicleRow>).plateNumber,
    garageNumber: record.garage_number ?? (data as Partial<VehicleRow>).garageNumber,
    owner: record.owner ?? (data as Partial<VehicleRow>).owner,
  });
}

function vehicleSnapshotIds(rows: VehicleRow[]) {
  return Array.from(new Set(rows.map((vehicle) => vehicle.id)));
}

function vehicleSnapshotKey(rows: VehicleRow[]) {
  return JSON.stringify(rows.map((vehicle) => normalizeVehicleRow(vehicle)));
}

async function upsertVehiclesToSupabase(client: SupabaseVehiclesClient, records: VehicleRecord[]) {
  if (records.length === 0) return;

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    const { error } = await client
      .from(vehiclesTable)
      .upsert(batch, { onConflict: "vehicle_id" });
    if (error) throw error;
  }
}

async function deleteVehiclesMissingFromSupabaseSnapshot(client: SupabaseVehiclesClient, vehicleIds: number[]) {
  const { error } = vehicleIds.length === 0
    ? await client
      .from(vehiclesTable)
      .delete()
      .not("vehicle_id", "is", null)
    : await client
      .from(vehiclesTable)
      .delete()
      .not("vehicle_id", "in", `(${vehicleIds.join(",")})`);

  if (error) throw error;
}

async function assertSupabaseVehiclesMatchExpectedSnapshot(expectedSnapshot: VehicleRow[] | null | undefined) {
  if (!Array.isArray(expectedSnapshot)) return;

  const current = await loadVehiclesFromSupabase();
  const currentRows = current?.rows ?? [];

  if (vehicleSnapshotKey(currentRows) !== vehicleSnapshotKey(expectedSnapshot)) {
    throw new Error("Vehicle list changed in database. Reload before replacing it.");
  }
}

export async function loadVehiclesFromSupabase(): Promise<SupabaseVehiclesState | null> {
  if (serverDatabaseConfigured) {
    return databaseRequest<SupabaseVehiclesState | null>("vehicles", "load");
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from(vehiclesTable)
    .select("*")
    .order("sort_index", { ascending: true })
    .order("vehicle_id", { ascending: true });

  if (error) throw error;

  const records = (data ?? []) as VehicleRecord[];
  if (records.length === 0) return null;

  return {
    updatedAt: records
      .map((record) => record.updated_at)
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .sort()
      .at(-1),
    rows: records.map(recordToVehicle),
  };
}

export async function saveVehiclesToSupabase(rows: VehicleRow[], options: VehicleSnapshotWriteOptions = {}) {
  if (serverDatabaseConfigured) {
    await databaseRequest("vehicles", "save", { rows, expectedSnapshot: options.expectedSnapshot });
    return;
  }

  await assertSupabaseVehiclesMatchExpectedSnapshot(options.expectedSnapshot);

  const records = rows.map(vehicleToRecord);
  const client = requireSupabase();

  await upsertVehiclesToSupabase(client, records);
}

export async function saveVehicleRowsPatchToSupabase(patchRows: VehicleRowsPatchItem[], options: VehicleSnapshotWriteOptions = {}) {
  if (serverDatabaseConfigured) {
    await databaseRequest("vehicles", "savePatch", { patchRows, expectedSnapshot: options.expectedSnapshot });
    return;
  }

  await assertSupabaseVehiclesMatchExpectedSnapshot(options.expectedSnapshot);

  const records = patchRows.map(({ row, sortIndex }) => vehicleToRecord(row, sortIndex));
  const client = requireSupabase();

  await upsertVehiclesToSupabase(client, records);
}

export async function replaceVehiclesInSupabase(rows: VehicleRow[], options: VehicleSnapshotReplaceOptions = {}) {
  if (serverDatabaseConfigured) {
    await databaseRequest("vehicles", "replace", { rows, expectedSnapshot: options.expectedSnapshot });
    return;
  }

  await assertSupabaseVehiclesMatchExpectedSnapshot(options.expectedSnapshot);

  const records = rows.map(vehicleToRecord);
  const vehicleIds = vehicleSnapshotIds(rows);
  const client = requireSupabase();

  await upsertVehiclesToSupabase(client, records);
  await deleteVehiclesMissingFromSupabaseSnapshot(client, vehicleIds);
}

export async function deleteVehicleFromSupabase(id: number) {
  if (serverDatabaseConfigured) {
    await databaseRequest("vehicles", "delete", { id });
    return;
  }

  const client = requireSupabase();
  const { error } = await client
    .from(vehiclesTable)
    .delete()
    .eq("vehicle_id", id);

  if (error) throw error;
}
