import { findTableColumn, parseTableImportFile } from "../../utils/xlsx";
import type { VehicleRow } from "./types";

const vehicleExportHeaders = [
  "Показ",
  "Категория техники",
  "Тип техники",
  "Марка",
  "Модель",
  "Госномер",
  "Гарномер",
  "Год выпуска",
  "VIN",
  "Собственник",
];

export function buildVehicleDisplayName(vehicle: Pick<VehicleRow, "name" | "brand" | "model" | "garageNumber" | "plateNumber">) {
  const title = [vehicle.brand, vehicle.model].map((value) => value.trim()).filter(Boolean).join(" ");
  const garageNumber = vehicle.garageNumber.trim();
  const plateNumber = vehicle.plateNumber.trim();
  const numberBlock = garageNumber && plateNumber
    ? `${garageNumber}(${plateNumber})`
    : garageNumber || (plateNumber ? `(${plateNumber})` : "");

  return [title, numberBlock].filter(Boolean).join(" - ") || vehicle.name.trim() || "Без названия";
}

function vehicleFuelCalcTypeFromCategory(vehicleType: string): VehicleRow["fuelCalcType"] {
  return ["Транспортировочная", "Легковая", "Пассажирская"].includes(vehicleType) ? "Пробег" : "Моточасы";
}

function normalizeVehicleVisibilityValue(value: string) {
  return value.toLowerCase().replace(/[^a-zа-яё0-9]+/g, "");
}

function parseVehicleVisibility(value: string) {
  const normalized = normalizeVehicleVisibilityValue(value);

  return !(normalized.includes("скрыт") || normalized === "нет" || normalized === "false" || normalized === "0");
}

export function createVehiclesFromImportTable(tableRows: string[][], defaultVehicleForm: VehicleRow) {
  const [headers = [], ...rows] = tableRows.filter((row) => row.some((cell) => cell.trim()));
  if (!headers.length) return [];

  const columns = {
    visible: findTableColumn(headers, ["Показ", "Отображение"]),
    vehicleType: findTableColumn(headers, ["Категория техники", "Вид техники"]),
    equipmentType: findTableColumn(headers, ["Тип техники", "Наименование"]),
    brand: findTableColumn(headers, ["Марка"]),
    model: findTableColumn(headers, ["Модель"]),
    plateNumber: findTableColumn(headers, ["Госномер", "Гос.номер", "Гос номер"]),
    garageNumber: findTableColumn(headers, ["Гарномер", "Гаражный номер"]),
    manufactureYear: findTableColumn(headers, ["Год выпуска", "Год", "Выпуск"]),
    vin: findTableColumn(headers, ["VIN"]),
    owner: findTableColumn(headers, ["Собственник"]),
  };

  const cell = (row: string[], column: number) => (column >= 0 ? row[column]?.trim() ?? "" : "");

  return rows
    .map((row, index) => {
      const vehicleType = cell(row, columns.vehicleType);
      const equipmentType = cell(row, columns.equipmentType);
      const brand = cell(row, columns.brand);
      const model = cell(row, columns.model);
      const plateNumber = cell(row, columns.plateNumber);
      const garageNumber = cell(row, columns.garageNumber);
      const owner = cell(row, columns.owner);

      if (![vehicleType, equipmentType, brand, model, plateNumber, garageNumber, owner].some(Boolean)) return null;

      const vehicle: VehicleRow = {
        ...defaultVehicleForm,
        id: index + 1,
        name: "",
        brand,
        model,
        plateNumber,
        garageNumber,
        vehicleType,
        equipmentType,
        manufactureYear: cell(row, columns.manufactureYear),
        fuelNormWinter: 0,
        fuelNormSummer: 0,
        fuelCalcType: vehicleFuelCalcTypeFromCategory(vehicleType),
        vin: cell(row, columns.vin),
        owner,
        contractor: owner,
        area: "",
        location: "",
        workType: "",
        excavator: "",
        active: true,
        visible: columns.visible >= 0 ? parseVehicleVisibility(cell(row, columns.visible)) : true,
      };

      return { ...vehicle, name: buildVehicleDisplayName(vehicle) };
    })
    .filter((vehicle): vehicle is VehicleRow => vehicle !== null)
    .map((vehicle, index) => ({ ...vehicle, id: index + 1 }));
}

export async function parseVehicleImportFile(file: File, defaultVehicleForm: VehicleRow) {
  return createVehiclesFromImportTable(await parseTableImportFile(file), defaultVehicleForm);
}

export function createVehicleExportRows(rows: VehicleRow[]) {
  return [
    vehicleExportHeaders,
    ...rows.map((vehicle) => [
      vehicle.visible === false ? "Скрыта" : "Показана",
      vehicle.vehicleType,
      vehicle.equipmentType,
      vehicle.brand,
      vehicle.model,
      vehicle.plateNumber,
      vehicle.garageNumber,
      vehicle.manufactureYear,
      vehicle.vin,
      vehicle.owner,
    ]),
  ];
}
