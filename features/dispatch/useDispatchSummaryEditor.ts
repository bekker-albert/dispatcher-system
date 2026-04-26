import { useCallback, type Dispatch, type SetStateAction } from "react";

import type { AdminLogEntry } from "@/lib/domain/admin/logs";
import {
  createDispatchSummaryRow,
  type DispatchShift,
  type DispatchSummaryNumberField,
  type DispatchSummaryRow,
  type DispatchSummaryTextField,
} from "@/lib/domain/dispatch/summary";
import { parseDecimalInput } from "@/lib/utils/numbers";
import { buildVehicleDisplayName } from "@/lib/domain/vehicles/import-export";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

type AddAdminLog = (entry: Omit<AdminLogEntry, "id" | "at" | "user">) => void;

type UseDispatchSummaryEditorOptions = {
  isDailyDispatchShift: boolean;
  reportDate: string;
  currentDispatchShift: DispatchShift;
  dispatchSummaryRows: DispatchSummaryRow[];
  currentDispatchSummaryRows: DispatchSummaryRow[];
  filteredDispatch: VehicleRow[];
  dispatchVehicleOptions: VehicleRow[];
  dispatchVehicleToAddId: string;
  setDispatchSummaryRows: Dispatch<SetStateAction<DispatchSummaryRow[]>>;
  setDispatchVehicleToAddId: Dispatch<SetStateAction<string>>;
  addAdminLog: AddAdminLog;
};

export function useDispatchSummaryEditor({
  isDailyDispatchShift,
  reportDate,
  currentDispatchShift,
  dispatchSummaryRows,
  currentDispatchSummaryRows,
  filteredDispatch,
  dispatchVehicleOptions,
  dispatchVehicleToAddId,
  setDispatchSummaryRows,
  setDispatchVehicleToAddId,
  addAdminLog,
}: UseDispatchSummaryEditorOptions) {
  const addDispatchSummaryRow = useCallback((vehicle?: VehicleRow) => {
    if (isDailyDispatchShift) return;

    const nextRow = createDispatchSummaryRow(vehicle, reportDate, currentDispatchShift);
    setDispatchSummaryRows((current) => [nextRow, ...current]);
    setDispatchVehicleToAddId("");
    addAdminLog({
      action: "Добавление",
      section: "Диспетчерская сводка",
      details: vehicle
        ? `Добавлена техника в сводку: ${buildVehicleDisplayName(vehicle)}.`
        : "Добавлена пустая строка сводки.",
    });
  }, [addAdminLog, currentDispatchShift, isDailyDispatchShift, reportDate, setDispatchSummaryRows, setDispatchVehicleToAddId]);

  const addSelectedDispatchVehicle = useCallback(() => {
    const selectedVehicleId = Number(dispatchVehicleToAddId);
    const selectedVehicle = dispatchVehicleOptions.find((vehicle) => vehicle.id === selectedVehicleId);
    addDispatchSummaryRow(selectedVehicle);
  }, [addDispatchSummaryRow, dispatchVehicleOptions, dispatchVehicleToAddId]);

  const addFilteredVehiclesToDispatchSummary = useCallback(() => {
    if (isDailyDispatchShift) return;

    const existingVehicleIds = new Set(
      currentDispatchSummaryRows
        .map((row) => row.vehicleId)
        .filter((id): id is number => typeof id === "number"),
    );
    const rowsToAdd = filteredDispatch.filter((vehicle) => !existingVehicleIds.has(vehicle.id));

    if (rowsToAdd.length === 0) {
      window.alert("В выбранной дате и смене уже есть строки по текущему фильтру.");
      return;
    }

    setDispatchSummaryRows((current) => [
      ...rowsToAdd.map((vehicle) => createDispatchSummaryRow(vehicle, reportDate, currentDispatchShift)),
      ...current,
    ]);
    addAdminLog({
      action: "Добавление",
      section: "Диспетчерская сводка",
      details: `Добавлены строки из списка техники: ${rowsToAdd.length}.`,
      rowsCount: rowsToAdd.length,
    });
  }, [addAdminLog, currentDispatchShift, currentDispatchSummaryRows, filteredDispatch, isDailyDispatchShift, reportDate, setDispatchSummaryRows]);

  const updateDispatchSummaryText = useCallback((id: string, field: DispatchSummaryTextField, value: string) => {
    if (isDailyDispatchShift) return;

    setDispatchSummaryRows((current) => current.map((row) => (
      row.id === id ? { ...row, [field]: value } : row
    )));
  }, [isDailyDispatchShift, setDispatchSummaryRows]);

  const updateDispatchSummaryNumber = useCallback((id: string, field: DispatchSummaryNumberField, value: string) => {
    if (isDailyDispatchShift) return;

    setDispatchSummaryRows((current) => current.map((row) => (
      row.id === id ? { ...row, [field]: parseDecimalInput(value) ?? 0 } : row
    )));
  }, [isDailyDispatchShift, setDispatchSummaryRows]);

  const updateDispatchSummaryVehicle = useCallback((id: string, vehicleIdValue: string) => {
    if (isDailyDispatchShift) return;

    const vehicleId = Number(vehicleIdValue);
    const vehicle = dispatchVehicleOptions.find((item) => item.id === vehicleId);

    setDispatchSummaryRows((current) => current.map((row) => {
      if (row.id !== id) return row;
      if (!vehicle) return { ...row, vehicleId: null, vehicleName: "" };

      const nextVehicleRow = createDispatchSummaryRow(vehicle, row.date, row.shift, row.id);
      return {
        ...row,
        vehicleId: vehicle.id,
        vehicleName: nextVehicleRow.vehicleName,
        area: nextVehicleRow.area,
        location: nextVehicleRow.location,
        workType: nextVehicleRow.workType,
        excavator: nextVehicleRow.excavator,
        planVolume: nextVehicleRow.planVolume,
        factVolume: nextVehicleRow.factVolume,
        workHours: nextVehicleRow.workHours,
        rentHours: nextVehicleRow.rentHours,
        repairHours: nextVehicleRow.repairHours,
        downtimeHours: nextVehicleRow.downtimeHours,
        trips: nextVehicleRow.trips,
      };
    }));
  }, [dispatchVehicleOptions, isDailyDispatchShift, setDispatchSummaryRows]);

  const deleteDispatchSummaryRow = useCallback((id: string) => {
    if (isDailyDispatchShift) return;

    const row = dispatchSummaryRows.find((item) => item.id === id);
    const label = row?.vehicleName || row?.workType || "строку";
    if (!window.confirm(`Удалить ${label} из сводки?`)) return;

    setDispatchSummaryRows((current) => current.filter((item) => item.id !== id));
    addAdminLog({
      action: "Удаление",
      section: "Диспетчерская сводка",
      details: `Удалена строка сводки: ${label}.`,
    });
  }, [addAdminLog, dispatchSummaryRows, isDailyDispatchShift, setDispatchSummaryRows]);

  return {
    addDispatchSummaryRow,
    addSelectedDispatchVehicle,
    addFilteredVehiclesToDispatchSummary,
    updateDispatchSummaryText,
    updateDispatchSummaryNumber,
    updateDispatchSummaryVehicle,
    deleteDispatchSummaryRow,
  };
}
