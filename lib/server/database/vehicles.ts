import type { VehicleRow } from "../../domain/vehicles/types";
import type { VehicleRowsPatchItem } from "../../domain/vehicles/persistence";
import { payloadRecord } from "./payload";
import type { DatabaseResourceHandler } from "./types";
import { requirePayloadArray, requirePayloadBoolean, requirePayloadNumber, requirePayloadRecord } from "./validation";

function vehicleRowsFromPayload(value: unknown) {
  return requirePayloadArray<VehicleRow>(value, "rows");
}

function expectedVehicleSnapshotFromPayload(value: unknown) {
  return Array.isArray(value) ? value as VehicleRow[] : undefined;
}

function allowLargeSnapshotShrinkFromPayload(value: unknown) {
  return value === null || value === undefined
    ? undefined
    : requirePayloadBoolean(value, "allowLargeSnapshotShrink");
}

function vehiclePatchRowsFromPayload(value: unknown): VehicleRowsPatchItem[] {
  return requirePayloadArray(value, "patchRows").map((item, index) => {
    const record = requirePayloadRecord(item, `patchRows[${index}]`);
    return {
      row: requirePayloadRecord(record.row, `patchRows[${index}].row`) as VehicleRow,
      sortIndex: requirePayloadNumber(record.sortIndex, `patchRows[${index}].sortIndex`),
    };
  });
}

export const handleVehiclesDatabaseAction: DatabaseResourceHandler = async ({
  action,
  payload,
  json,
}) => {
  const vehicles = await import("../mysql/vehicles");
  const record = payloadRecord(payload);

  if (action === "load") return json(await vehicles.loadVehiclesFromMysql());
  if (action === "save") {
    await vehicles.saveVehiclesToMysql(vehicleRowsFromPayload(record.rows), {
      expectedSnapshot: expectedVehicleSnapshotFromPayload(record.expectedSnapshot),
      allowLargeSnapshotShrink: allowLargeSnapshotShrinkFromPayload(record.allowLargeSnapshotShrink),
    });
    return json({ ok: true });
  }
  if (action === "savePatch") {
    await vehicles.saveVehicleRowsPatchToMysql(vehiclePatchRowsFromPayload(record.patchRows), {
      expectedSnapshot: expectedVehicleSnapshotFromPayload(record.expectedSnapshot),
      allowLargeSnapshotShrink: allowLargeSnapshotShrinkFromPayload(record.allowLargeSnapshotShrink),
    });
    return json({ ok: true });
  }
  if (action === "replace") {
    await vehicles.replaceVehiclesInMysql(vehicleRowsFromPayload(record.rows), {
      expectedSnapshot: expectedVehicleSnapshotFromPayload(record.expectedSnapshot),
      allowLargeSnapshotShrink: allowLargeSnapshotShrinkFromPayload(record.allowLargeSnapshotShrink),
    });
    return json({ ok: true });
  }
  if (action === "delete") {
    await vehicles.deleteVehicleFromMysql(requirePayloadNumber(record.id, "id"));
    return json({ ok: true });
  }

  return undefined;
};
