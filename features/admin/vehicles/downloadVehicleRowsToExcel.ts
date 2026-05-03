import type { VehicleRow } from "@/lib/domain/vehicles/types";

export async function downloadVehicleRowsToExcel(vehicleRows: VehicleRow[]) {
  const [{ createVehicleExportRows }, { createXlsxBlob }] = await Promise.all([
    import("@/lib/domain/vehicles/import-export"),
    import("@/lib/utils/xlsx"),
  ]);
  const blob = createXlsxBlob(createVehicleExportRows(vehicleRows));
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "spisok-tehniki.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
