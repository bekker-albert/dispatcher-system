import type { RowDataPacket } from "mysql2/promise";
import { normalizeVehicleRow } from "../../domain/vehicles/defaults";
import type { VehicleRowsPatchItem } from "../../domain/vehicles/persistence";
import type { VehicleRow } from "../../domain/vehicles/types";
import { DatabaseConflictError } from "../database/conflicts";
import { dbExecute, dbRows, dbTransaction, type DbExecutor } from "./pool";
import { parseJson, stringifyJson, toIsoLike } from "./json";

export type MysqlVehiclesState = {
  updatedAt?: string;
  rows: VehicleRow[];
};

export type VehicleSnapshotWriteOptions = {
  expectedSnapshot?: VehicleRow[] | null;
};

export type VehicleSnapshotReplaceOptions = VehicleSnapshotWriteOptions;

type VehicleRecord = RowDataPacket & {
  vehicle_id: number | string;
  sort_index: number | null;
  visible: number | boolean | null;
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

const batchSize = 250;

function recordToVehicle(record: VehicleRecord): VehicleRow {
  const data = parseJson<Partial<VehicleRow>>(record.data, {});

  return normalizeVehicleRow({
    ...data,
    id: Number(record.vehicle_id),
    visible: record.visible !== 0 && record.visible !== false,
    vehicleType: record.category ?? data.vehicleType,
    equipmentType: record.equipment_type ?? data.equipmentType,
    brand: record.brand ?? data.brand,
    model: record.model ?? data.model,
    plateNumber: record.plate_number ?? data.plateNumber,
    garageNumber: record.garage_number ?? data.garageNumber,
    owner: record.owner ?? data.owner,
  });
}

function vehicleSnapshotIds(rows: VehicleRow[]) {
  return Array.from(new Set(rows.map((vehicle) => vehicle.id)));
}

function vehicleSnapshotKey(rows: VehicleRow[]) {
  return JSON.stringify(rows.map((vehicle) => normalizeVehicleRow(vehicle)));
}

async function upsertVehiclesToMysql(rows: VehicleRow[], execute: DbExecutor = dbExecute) {
  await upsertVehiclePatchRowsToMysql(rows.map((row, sortIndex) => ({ row, sortIndex })), execute);
}

async function upsertVehiclePatchRowsToMysql(patchRows: VehicleRowsPatchItem[], execute: DbExecutor = dbExecute) {
  const rows = patchRows;
  if (rows.length === 0) return;

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const values = batch.flatMap(({ row: vehicle, sortIndex }) => [
      vehicle.id,
      sortIndex,
      vehicle.visible !== false ? 1 : 0,
      vehicle.vehicleType,
      vehicle.equipmentType,
      vehicle.brand,
      vehicle.model,
      vehicle.plateNumber,
      vehicle.garageNumber,
      vehicle.owner,
      stringifyJson(vehicle),
    ]);

    await execute(
      `INSERT INTO vehicles (
        vehicle_id, sort_index, visible, category, equipment_type, brand, model,
        plate_number, garage_number, owner, data
      ) VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        sort_index = VALUES(sort_index),
        visible = VALUES(visible),
        category = VALUES(category),
        equipment_type = VALUES(equipment_type),
        brand = VALUES(brand),
        model = VALUES(model),
        plate_number = VALUES(plate_number),
        garage_number = VALUES(garage_number),
        owner = VALUES(owner),
        data = VALUES(data),
        updated_at = CURRENT_TIMESTAMP(3)`,
      values,
    );
  }
}

async function deleteVehiclesMissingFromMysqlSnapshot(rows: VehicleRow[], execute: DbExecutor = dbExecute) {
  const vehicleIds = vehicleSnapshotIds(rows);

  if (vehicleIds.length === 0) {
    await execute("DELETE FROM vehicles");
    return;
  }

  const placeholders = vehicleIds.map(() => "?").join(", ");
  await execute(
    `DELETE FROM vehicles
    WHERE vehicle_id NOT IN (${placeholders})`,
    vehicleIds,
  );
}

function createVehiclesConflictError() {
  return new DatabaseConflictError("Список техники уже изменился в базе. Обновите страницу перед повторным сохранением.");
}

async function loadVehicleRecordsFromMysql(execute?: DbExecutor, lockForUpdate = false) {
  const sql = `SELECT * FROM vehicles ORDER BY sort_index ASC, vehicle_id ASC${lockForUpdate ? " FOR UPDATE" : ""}`;
  return execute?.rows
    ? await execute.rows<VehicleRecord>(sql)
    : await dbRows<VehicleRecord>(sql);
}

async function loadVehiclesFromMysqlWithExecutor(execute?: DbExecutor, lockForUpdate = false): Promise<MysqlVehiclesState | null> {
  const records = await loadVehicleRecordsFromMysql(execute, lockForUpdate);

  if (records.length === 0) return null;

  return {
    updatedAt: records
      .map((record) => toIsoLike(record.updated_at))
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1),
    rows: records.map(recordToVehicle),
  };
}

async function assertMysqlVehiclesMatchExpectedSnapshot(
  expectedSnapshot: VehicleRow[] | null | undefined,
  execute?: DbExecutor,
) {
  if (!Array.isArray(expectedSnapshot)) return;

  const current = await loadVehiclesFromMysqlWithExecutor(execute, Boolean(execute));
  const currentRows = current?.rows ?? [];

  if (vehicleSnapshotKey(currentRows) !== vehicleSnapshotKey(expectedSnapshot)) {
    throw createVehiclesConflictError();
  }
}

export async function loadVehiclesFromMysql(): Promise<MysqlVehiclesState | null> {
  return await loadVehiclesFromMysqlWithExecutor();
}

export async function saveVehiclesToMysql(rows: VehicleRow[], options: VehicleSnapshotWriteOptions = {}) {
  await dbTransaction(async (execute) => {
    await assertMysqlVehiclesMatchExpectedSnapshot(options.expectedSnapshot, execute);
    await upsertVehiclesToMysql(rows, execute);
  });
}

export async function saveVehicleRowsPatchToMysql(patchRows: VehicleRowsPatchItem[], options: VehicleSnapshotWriteOptions = {}) {
  await dbTransaction(async (execute) => {
    await assertMysqlVehiclesMatchExpectedSnapshot(options.expectedSnapshot, execute);
    await upsertVehiclePatchRowsToMysql(patchRows, execute);
  });
}

export async function replaceVehiclesInMysql(rows: VehicleRow[], options: VehicleSnapshotReplaceOptions = {}) {
  await dbTransaction(async (execute) => {
    await assertMysqlVehiclesMatchExpectedSnapshot(options.expectedSnapshot, execute);
    await upsertVehiclesToMysql(rows, execute);
    await deleteVehiclesMissingFromMysqlSnapshot(rows, execute);
  });
}

export async function deleteVehicleFromMysql(id: number) {
  await dbExecute("DELETE FROM vehicles WHERE vehicle_id = ?", [id]);
}
