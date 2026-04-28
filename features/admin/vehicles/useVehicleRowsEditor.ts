import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import { defaultVehicleForm } from "@/lib/domain/vehicles/defaults";
import { buildVehicleDisplayName } from "@/lib/domain/vehicles/import-export";
import type { VehicleInlineField } from "@/lib/domain/vehicles/grid";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { errorToMessage } from "@/lib/utils/normalizers";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

type PendingVehicleFocus = {
  id: number;
  field: VehicleInlineField;
  edit?: boolean;
  selectContents?: boolean;
};

type UseVehicleRowsEditorOptions = {
  vehicleRows: VehicleRow[];
  vehicleRowsRef: RefObject<VehicleRow[]>;
  databaseConfigured: boolean;
  databaseLoadedRef: RefObject<boolean>;
  databaseSaveSnapshotRef: RefObject<string>;
  setVehicleRows: Dispatch<SetStateAction<VehicleRow[]>>;
  setPendingVehicleFocus: Dispatch<SetStateAction<PendingVehicleFocus | null>>;
  pushVehicleUndoSnapshot: () => void;
  clearAllVehicleFilters: () => void;
  showSaveStatus: (kind: SaveStatusState["kind"], message: string) => void;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function useVehicleRowsEditor({
  vehicleRows,
  vehicleRowsRef,
  databaseConfigured,
  databaseLoadedRef,
  databaseSaveSnapshotRef,
  setVehicleRows,
  setPendingVehicleFocus,
  pushVehicleUndoSnapshot,
  clearAllVehicleFilters,
  showSaveStatus,
  addAdminLog,
}: UseVehicleRowsEditorOptions) {
  const addVehicleRow = useCallback(() => {
    const nextId = Math.max(0, ...vehicleRows.map((vehicle) => vehicle.id)) + 1;
    const nextVehicle: VehicleRow = {
      ...defaultVehicleForm,
      id: nextId,
      area: "",
      excavator: "",
      visible: true,
    };
    nextVehicle.name = buildVehicleDisplayName(nextVehicle);

    pushVehicleUndoSnapshot();
    clearAllVehicleFilters();
    setVehicleRows((current) => [nextVehicle, ...current]);
    setPendingVehicleFocus({ id: nextId, field: "vehicleType", edit: true });
    addAdminLog({
      action: "Добавление",
      section: "Техника",
      details: "Добавлена новая строка техники.",
    });
  }, [addAdminLog, clearAllVehicleFilters, pushVehicleUndoSnapshot, setPendingVehicleFocus, setVehicleRows, vehicleRows]);

  const updateVehicleRow = useCallback((id: number, field: VehicleInlineField, value: string) => {
    pushVehicleUndoSnapshot();
    setVehicleRows((current) =>
      current.map((vehicle) => {
        if (vehicle.id !== id) return vehicle;

        const nextVehicle = {
          ...vehicle,
          [field]: value,
        } as VehicleRow;

        if (field === "owner") nextVehicle.contractor = value.trim();
        nextVehicle.name = buildVehicleDisplayName(nextVehicle);

        return nextVehicle;
      }),
    );
  }, [pushVehicleUndoSnapshot, setVehicleRows]);

  const toggleVehicleVisibility = useCallback((id: number) => {
    const vehicle = vehicleRows.find((item) => item.id === id);
    pushVehicleUndoSnapshot();
    setVehicleRows((current) =>
      current.map((vehicle) =>
        vehicle.id === id ? { ...vehicle, visible: vehicle.visible === false } : vehicle,
      ),
    );
    addAdminLog({
      action: "Редактирование",
      section: "Техника",
      details: `Изменен показ техники${vehicle ? `: ${buildVehicleDisplayName(vehicle)}` : ""}.`,
    });
  }, [addAdminLog, pushVehicleUndoSnapshot, setVehicleRows, vehicleRows]);

  const deleteVehicle = useCallback((id: number) => {
    const vehicle = vehicleRows.find((item) => item.id === id);
    pushVehicleUndoSnapshot();
    setVehicleRows((current) => current.filter((vehicle) => vehicle.id !== id));
    if (databaseConfigured && databaseLoadedRef.current) {
      showSaveStatus("saving", "Удаляю технику из базы...");
      void import("@/lib/data/vehicles")
        .then(({ deleteVehicleFromDatabase }) => deleteVehicleFromDatabase(id))
        .then(() => {
          databaseSaveSnapshotRef.current = JSON.stringify(vehicleRowsRef.current.filter((vehicle) => vehicle.id !== id));
          showSaveStatus("saved", "Техника удалена из базы.");
        })
        .catch((error) => {
          console.warn("Database vehicle delete failed:", error);
          showSaveStatus("error", `Техника не удалена из базы: ${errorToMessage(error)}`);
        });
    }
    addAdminLog({
      action: "Удаление",
      section: "Техника",
      details: `Удалена техника${vehicle ? `: ${buildVehicleDisplayName(vehicle)}` : ""}.`,
    });
  }, [
    addAdminLog,
    databaseConfigured,
    databaseLoadedRef,
    databaseSaveSnapshotRef,
    pushVehicleUndoSnapshot,
    setVehicleRows,
    showSaveStatus,
    vehicleRows,
    vehicleRowsRef,
  ]);

  return {
    addVehicleRow,
    updateVehicleRow,
    toggleVehicleVisibility,
    deleteVehicle,
  };
}
