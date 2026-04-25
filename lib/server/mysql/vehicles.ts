import type { RowDataPacket } from "mysql2/promise";
import { normalizeVehicleRow } from "../../domain/vehicles/defaults";
import type { VehicleRow } from "../../domain/vehicles/types";
import { dbExecute, dbRows } from "./pool";
import { parseJson, stringifyJson, toIsoLike } from "./json";

export type MysqlVehiclesState = {
  updatedAt?: string;
  rows: VehicleRow[];
};

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

export async function loadVehiclesFromMysql(): Promise<MysqlVehiclesState | null> {
  const records = await dbRows<VehicleRecord>(
    `SELECT * FROM vehicles ORDER BY sort_index ASC, vehicle_id ASC`,
  );

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

export async function saveVehiclesToMysql(rows: VehicleRow[]) {
  if (rows.length === 0) return;

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const values = batch.flatMap((vehicle, vehicleIndex) => [
      vehicle.id,
      index + vehicleIndex,
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

    await dbExecute(
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

export async function replaceVehiclesInMysql(rows: VehicleRow[]) {
  await dbExecute("DELETE FROM vehicles");
  await saveVehiclesToMysql(rows);
}

export async function deleteVehicleFromMysql(id: number) {
  await dbExecute("DELETE FROM vehicles WHERE vehicle_id = ?", [id]);
}
