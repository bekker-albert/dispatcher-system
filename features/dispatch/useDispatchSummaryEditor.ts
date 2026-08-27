import { useCallback, type Dispatch, type SetStateAction } from "react";

import type { AdminLogInput } from "@/lib/domain/admin/logs";
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

import {
  dispatchRowExceedsHourLimit,
  dispatchRowHasOperationalValues,
  dispatchShiftHourLimit,
  isDispatchHourField,
  parseDispatchIntegerCell,
} from "./dispatchHoursValidation";
import { buildDispatchVehicleLabel } from "./dispatchVehicleLabel";

type AddAdminLog = (entry: AdminLogInput) => void;

const allAreasLabel = "Все участки";

function resolveNewDispatchRowArea(areaFilter: string) {
  return areaFilter.trim() && areaFilter !== allAreasLabel ? areaFilter : "";
}

type UseDispatchSummaryEditorOptions = {
  isDailyDispatchShift: boolean;
  reportDate: string;
  currentDispatchShift: DispatchShift;
  areaFilter: string;
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
  areaFilter,
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

    const nextRow = {
      ...createDispatchSummaryRow(vehicle, reportDate, currentDispatchShift),
      area: vehicle?.area || resolveNewDispatchRowArea(areaFilter),
    };
    setDispatchSummaryRows((current) => [nextRow, ...current]);
    setDispatchVehicleToAddId("");
    addAdminLog({
      action: "Добавление",
      section: "Диспетчерская сводка",
      details: vehicle
        ? `Добавлена техника в сводку: ${buildVehicleDisplayName(vehicle)}.`
        : "Добавлена пустая строка звена сводки.",
    });
  }, [addAdminLog, areaFilter, currentDispatchShift, isDailyDispatchShift, reportDate, setDispatchSummaryRows, setDispatchVehicleToAddId]);

  const addDispatchSummaryLink = useCallback(() => {
    addDispatchSummaryRow();
  }, [addDispatchSummaryRow]);

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
      details: `Добавлены строки из расстановки техники: ${rowsToAdd.length}.`,
      rowsCount: rowsToAdd.length,
    });
  }, [addAdminLog, currentDispatchShift, currentDispatchSummaryRows, filteredDispatch, isDailyDispatchShift, reportDate, setDispatchSummaryRows]);

  const addDumpTruckToDispatchLink = useCallback((excavator: string, templateRow?: DispatchSummaryRow) => {
    if (isDailyDispatchShift) return;

    const nextRow = {
      ...createDispatchSummaryRow(undefined, reportDate, currentDispatchShift),
      area: templateRow?.area || resolveNewDispatchRowArea(areaFilter),
      location: templateRow?.location ?? "",
      workType: templateRow?.workType ?? "",
      excavator,
    };

    setDispatchSummaryRows((current) => [nextRow, ...current]);
    addAdminLog({
      action: "Добавление",
      section: "Диспетчерская сводка",
      details: `Добавлен самосвал в звено: ${excavator || "без привязки"}.`,
    });
  }, [addAdminLog, areaFilter, currentDispatchShift, isDailyDispatchShift, reportDate, setDispatchSummaryRows]);

  const updateDispatchSummaryText = useCallback((id: string, field: DispatchSummaryTextField, value: string) => {
    if (isDailyDispatchShift) return;

    setDispatchSummaryRows((current) => current.map((row) => (
      row.id === id ? { ...row, [field]: value } : row
    )));
  }, [isDailyDispatchShift, setDispatchSummaryRows]);

  const updateDispatchSummaryNumber = useCallback((id: string, field: DispatchSummaryNumberField, value: string) => {
    if (isDailyDispatchShift) return;

    setDispatchSummaryRows((current) => current.map((row) => {
      if (row.id !== id) return row;

      if (isDispatchHourField(field) || field === "trips") {
        const parsed = parseDispatchIntegerCell(value);
        if (parsed === null) {
          window.alert("Введите целое число не меньше 0.");
          return row;
        }

        const nextRow = { ...row, [field]: parsed };
        if (isDispatchHourField(field) && dispatchRowExceedsHourLimit(nextRow)) {
          window.alert(`Сумма часов Аренда + Работа + Простой + Ремонт не должна превышать ${dispatchShiftHourLimit}.`);
          return row;
        }

        return nextRow;
      }

      return { ...row, [field]: parseDecimalInput(value) ?? 0 };
    }));
  }, [isDailyDispatchShift, setDispatchSummaryRows]);

  const updateDispatchSummaryVehicle = useCallback((id: string, vehicleIdValue: string) => {
    if (isDailyDispatchShift) return;

    const vehicleId = Number(vehicleIdValue);
    const vehicle = dispatchVehicleOptions.find((item) => item.id === vehicleId);

    setDispatchSummaryRows((current) => current.map((row) => {
      if (row.id !== id) return row;
      if (!vehicle) return { ...row, vehicleId: null, vehicleName: "" };

      return {
        ...row,
        vehicleId: vehicle.id,
        vehicleName: buildDispatchVehicleLabel(vehicle),
      };
    }));
  }, [dispatchVehicleOptions, isDailyDispatchShift, setDispatchSummaryRows]);

  const deleteDispatchSummaryRow = useCallback((id: string) => {
    if (isDailyDispatchShift) return;

    const row = dispatchSummaryRows.find((item) => item.id === id);
    const label = row?.vehicleName || row?.workType || "строку";
    const needsConfirm = row ? dispatchRowHasOperationalValues(row) : true;
    if (needsConfirm && !window.confirm(`Удалить ${label} из сводки?`)) return;

    setDispatchSummaryRows((current) => current.filter((item) => item.id !== id));
    addAdminLog({
      action: "Удаление",
      section: "Диспетчерская сводка",
      details: `Удалена строка сводки: ${label}.`,
    });
  }, [addAdminLog, dispatchSummaryRows, isDailyDispatchShift, setDispatchSummaryRows]);

  const deleteDispatchSummaryLink = useCallback((rowIds: string[], label: string) => {
    if (isDailyDispatchShift || rowIds.length === 0) return;

    const rowsToDelete = dispatchSummaryRows.filter((row) => rowIds.includes(row.id));
    const needsConfirm = rowsToDelete.some(dispatchRowHasOperationalValues);
    if (needsConfirm && !window.confirm(`Удалить звено "${label}" вместе со связанными самосвалами?`)) return;

    setDispatchSummaryRows((current) => current.filter((row) => !rowIds.includes(row.id)));
    addAdminLog({
      action: "Удаление",
      section: "Диспетчерская сводка",
      details: `Удалено звено сводки: ${label}.`,
      rowsCount: rowsToDelete.length,
    });
  }, [addAdminLog, dispatchSummaryRows, isDailyDispatchShift, setDispatchSummaryRows]);

  const deleteCurrentDispatchShiftRows = useCallback(() => {
    if (isDailyDispatchShift || currentDispatchSummaryRows.length === 0) return;

    const needsConfirm = currentDispatchSummaryRows.some(dispatchRowHasOperationalValues);
    if (needsConfirm && !window.confirm("Удалить все строки текущей смены?")) return;

    const rowIds = new Set(currentDispatchSummaryRows.map((row) => row.id));
    setDispatchSummaryRows((current) => current.filter((row) => !rowIds.has(row.id)));
    addAdminLog({
      action: "Удаление",
      section: "Диспетчерская сводка",
      details: `Удалены все строки смены ${currentDispatchShift} за ${reportDate}.`,
      rowsCount: currentDispatchSummaryRows.length,
    });
  }, [addAdminLog, currentDispatchShift, currentDispatchSummaryRows, isDailyDispatchShift, reportDate, setDispatchSummaryRows]);

  return {
    addDispatchSummaryRow,
    addDispatchSummaryLink,
    addDumpTruckToDispatchLink,
    addSelectedDispatchVehicle,
    addFilteredVehiclesToDispatchSummary,
    updateDispatchSummaryText,
    updateDispatchSummaryNumber,
    updateDispatchSummaryVehicle,
    deleteDispatchSummaryRow,
    deleteDispatchSummaryLink,
    deleteCurrentDispatchShiftRows,
  };
}
