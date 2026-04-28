import type { AdminLogInput } from "@/lib/domain/admin/logs";
import { buildVehicleDisplayName } from "../../../lib/domain/vehicles/import-export";
import {
  vehicleFilterColumnConfigs,
  type VehicleInlineField,
} from "../../../lib/domain/vehicles/grid";
import type { VehicleRow } from "../../../lib/domain/vehicles/types";

export function vehicleInlineCellValue(rows: VehicleRow[], id: number, field: VehicleInlineField) {
  const vehicle = rows.find((item) => item.id === id);
  return String(vehicle?.[field] ?? "");
}

export function vehicleInlineEditLogEntry(
  rows: VehicleRow[],
  id: number,
  field: VehicleInlineField,
): AdminLogInput {
  const vehicle = rows.find((item) => item.id === id);
  const fieldLabel = vehicleFilterColumnConfigs.find((column) => column.key === field)?.label ?? field;

  return {
    action: "Редактирование",
    section: "Техника",
    details: `Изменено поле "${fieldLabel}"${vehicle ? `: ${buildVehicleDisplayName(vehicle)}` : ""}.`,
  };
}

export function vehicleInlineClearLogEntry(count: number): AdminLogInput {
  return {
    action: "Редактирование",
    section: "Техника",
    details: `Очищены выбранные ячейки: ${count}.`,
  };
}

export function clearVehicleInlineFields(
  rows: VehicleRow[],
  targetFieldsById: Map<number, Set<VehicleInlineField>>,
) {
  return rows.map((vehicle) => {
    const fields = targetFieldsById.get(vehicle.id);
    if (!fields) return vehicle;

    const nextVehicle = { ...vehicle };
    fields.forEach((inlineField) => {
      nextVehicle[inlineField] = "";
      if (inlineField === "owner") nextVehicle.contractor = "";
    });
    nextVehicle.name = buildVehicleDisplayName(nextVehicle);

    return nextVehicle;
  });
}
