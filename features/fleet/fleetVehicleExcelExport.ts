import type { AdminLogInput } from "@/lib/domain/admin/logs";
import type { FleetVehicleListRow } from "@/features/fleet/fleetVehicleModel";

type AddAdminLog = (entry: AdminLogInput) => void;

const fleetVehicleExportHeaders = [
  "№",
  "Вид техники",
  "Наименование техники",
  "Марка",
  "Модель",
  "Гос. номер",
  "Гар. номер",
  "№ топл.карты",
  "Год выпуска",
  "VIN",
  "Собственник",
  "1 вахта / 1 смена",
  "1 вахта / 2 смена",
  "2 вахта / 1 смена",
  "2 вахта / 2 смена",
];

export function createFleetVehicleExportRows(rows: FleetVehicleListRow[]) {
  return [
    fleetVehicleExportHeaders,
    ...rows.map((row) => [
      row.index,
      row.vehicleType,
      row.equipmentType,
      row.brand,
      row.model,
      row.plateNumber,
      row.garageNumber,
      row.fuelCardNumber,
      row.manufactureYear,
      row.vin,
      row.owner,
      row.firstWatchFirstShiftDriver,
      row.firstWatchSecondShiftDriver,
      row.secondWatchFirstShiftDriver,
      row.secondWatchSecondShiftDriver,
    ]),
  ];
}

export async function downloadFleetVehicleRowsToExcel(rows: FleetVehicleListRow[]) {
  const { createXlsxBlob } = await import("@/lib/utils/xlsx");
  const blob = createXlsxBlob(createFleetVehicleExportRows(rows), "Техника");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "spisok-tehniki.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportFleetVehicleRowsToExcel(rows: FleetVehicleListRow[], addAdminLog: AddAdminLog) {
  await downloadFleetVehicleRowsToExcel(rows);
  addAdminLog({
    action: "Выгрузка",
    section: "Техника",
    details: `Выгружен справочник техники: ${rows.length} строк.`,
    fileName: "spisok-tehniki.xlsx",
    rowsCount: rows.length,
  });
}
