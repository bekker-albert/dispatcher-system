import { useCallback, type ChangeEvent, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import { defaultVehicleForm } from "@/lib/domain/vehicles/defaults";
import type { VehicleFilterKey, VehicleFilters } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { adminStorageKeys } from "@/lib/storage/keys";
import { errorToMessage } from "@/lib/utils/normalizers";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

function parseExpectedVehicleSnapshot(snapshot: string) {
  if (!snapshot) return null;

  try {
    const value = JSON.parse(snapshot);
    return Array.isArray(value) ? value as VehicleRow[] : null;
  } catch {
    return null;
  }
}

type UseVehicleExcelTransferOptions = {
  vehicleRows: VehicleRow[];
  vehicleImportInputRef: RefObject<HTMLInputElement | null>;
  databaseConfigured: boolean;
  databaseLoadedRef: RefObject<boolean>;
  databaseSaveSnapshotRef: RefObject<string>;
  setVehicleRows: Dispatch<SetStateAction<VehicleRow[]>>;
  setVehicleFilters: Dispatch<SetStateAction<VehicleFilters>>;
  setVehicleFilterDrafts: Dispatch<SetStateAction<VehicleFilters>>;
  setOpenVehicleFilter: Dispatch<SetStateAction<VehicleFilterKey | null>>;
  pushVehicleUndoSnapshot: () => void;
  showSaveStatus: (kind: SaveStatusState["kind"], message: string) => void;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function useVehicleExcelTransfer({
  vehicleRows,
  vehicleImportInputRef,
  databaseConfigured,
  databaseLoadedRef,
  databaseSaveSnapshotRef,
  setVehicleRows,
  setVehicleFilters,
  setVehicleFilterDrafts,
  setOpenVehicleFilter,
  pushVehicleUndoSnapshot,
  showSaveStatus,
  addAdminLog,
}: UseVehicleExcelTransferOptions) {
  const openVehicleImportFilePicker = useCallback(() => {
    vehicleImportInputRef.current?.click();
  }, [vehicleImportInputRef]);

  const importVehiclesFromExcel = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const { parseVehicleImportFile } = await import("@/lib/domain/vehicles/import-export");
      const importedVehicles = await parseVehicleImportFile(file, defaultVehicleForm);
      if (!importedVehicles.length) {
        window.alert("В выбранном файле не найден список техники.");
        return;
      }

      if (!window.confirm(`Заменить текущий список техники данными из файла? Будет загружено строк: ${importedVehicles.length}.`)) return;

      pushVehicleUndoSnapshot();
      setVehicleRows(importedVehicles);
      setVehicleFilters({});
      setVehicleFilterDrafts({});
      setOpenVehicleFilter(null);
      const importedVehiclesSnapshot = JSON.stringify(importedVehicles);
      const importedAt = new Date().toISOString();

      window.localStorage.setItem(adminStorageKeys.vehicles, importedVehiclesSnapshot);
      window.localStorage.setItem(adminStorageKeys.vehiclesLocalUpdatedAt, importedAt);
      window.localStorage.setItem(adminStorageKeys.vehiclesSeedVersion, `import:${file.name}:${importedVehicles.length}`);
      if (databaseConfigured && databaseLoadedRef.current) {
        const expectedSnapshot = parseExpectedVehicleSnapshot(databaseSaveSnapshotRef.current);

        showSaveStatus("saving", "Сохраняю загруженную технику...");
        void import("@/lib/data/vehicles")
          .then(({ replaceVehiclesInDatabase }) => replaceVehiclesInDatabase(importedVehicles, { expectedSnapshot }))
          .then(() => {
            databaseSaveSnapshotRef.current = importedVehiclesSnapshot;
            showSaveStatus("saved", "Загруженная техника сохранена.");
          })
          .catch((error) => {
            console.warn("Database vehicles import save failed:", error);
            showSaveStatus("error", `Загруженная техника не сохранена: ${errorToMessage(error)}`);
          });
      }
      addAdminLog({
        action: "Загрузка",
        section: "Техника",
        details: `Загружен список техники: ${importedVehicles.length} строк.`,
        fileName: file.name,
        rowsCount: importedVehicles.length,
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Не удалось прочитать Excel-файл.");
    }
  }, [
    addAdminLog,
    databaseConfigured,
    databaseLoadedRef,
    databaseSaveSnapshotRef,
    pushVehicleUndoSnapshot,
    setOpenVehicleFilter,
    setVehicleFilterDrafts,
    setVehicleFilters,
    setVehicleRows,
    showSaveStatus,
  ]);

  const exportVehiclesToExcel = useCallback(async () => {
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
    addAdminLog({
      action: "Выгрузка",
      section: "Техника",
      details: `Выгружен список техники: ${vehicleRows.length} строк.`,
      fileName: "spisok-tehniki.xlsx",
      rowsCount: vehicleRows.length,
    });
  }, [addAdminLog, vehicleRows]);

  return {
    openVehicleImportFilePicker,
    importVehiclesFromExcel,
    exportVehiclesToExcel,
  };
}
