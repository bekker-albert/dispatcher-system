import { isRecord } from "../../utils/normalizers";
import { buildVehicleDisplayName } from "./import-export";
import type { VehicleRow } from "./types";

export type VehicleSeedRow = {
  category: string;
  equipmentType: string;
  brand: string;
  model: string;
  plateNumber: string;
  garageNumber: string;
  manufactureYear?: string;
  owner: string;
};

export const defaultVehicleSeedReplaceLimit = 20;

export const defaultVehicleForm: VehicleRow = {
  id: 0,
  name: "",
  brand: "",
  model: "",
  plateNumber: "",
  garageNumber: "",
  vehicleType: "",
  equipmentType: "",
  manufactureYear: "",
  fuelNormWinter: 0,
  fuelNormSummer: 0,
  fuelCalcType: "Моточасы",
  vin: "",
  owner: "",
  area: "Аксу",
  location: "",
  workType: "",
  excavator: "—",
  contractor: "",
  work: 0,
  rent: 0,
  repair: 0,
  downtime: 0,
  trips: 0,
  active: true,
  visible: true,
};

export const defaultVehicleFallbackRows: VehicleRow[] = [
  {
    id: 1,
    name: "Komatsu HD785 №12",
    brand: "Komatsu",
    model: "HD785",
    plateNumber: "",
    garageNumber: "12",
    vehicleType: "Карьерный самосвал",
    equipmentType: "Карьерный самосвал",
    manufactureYear: "",
    fuelNormWinter: 0,
    fuelNormSummer: 0,
    fuelCalcType: "Моточасы",
    vin: "",
    owner: "AA Mining",
    area: "Аксу",
    location: "Карьер №6",
    workType: "Перевозка на Фазу 1",
    excavator: "PC1250 №3",
    contractor: "AA Mining",
    work: 6,
    rent: 0,
    repair: 2,
    downtime: 3,
    trips: 18,
    active: true,
  },
  {
    id: 2,
    name: "Howo №21",
    brand: "Howo",
    model: "",
    plateNumber: "",
    garageNumber: "21",
    vehicleType: "Самосвал",
    equipmentType: "Самосвал",
    manufactureYear: "",
    fuelNormWinter: 0,
    fuelNormSummer: 0,
    fuelCalcType: "Пробег",
    vin: "",
    owner: "AA Mining",
    area: "Аксу",
    location: "Фаза 1",
    workType: "Перевозка с карьера №6",
    excavator: "EX1200 №2",
    contractor: "AA Mining",
    work: 11,
    rent: 0,
    repair: 0,
    downtime: 0,
    trips: 24,
    active: true,
  },
  {
    id: 3,
    name: "Toyota Hilux P128",
    brand: "Toyota",
    model: "Hilux",
    plateNumber: "P128",
    garageNumber: "",
    vehicleType: "Легковой",
    equipmentType: "Пикап",
    manufactureYear: "",
    fuelNormWinter: 0,
    fuelNormSummer: 0,
    fuelCalcType: "Пробег",
    vin: "",
    owner: "Qaz Trucks",
    area: "Акбакай",
    location: "АБК",
    workType: "Служебные перевозки",
    excavator: "—",
    contractor: "Qaz Trucks",
    work: 4,
    rent: 7,
    repair: 0,
    downtime: 0,
    trips: 0,
    active: true,
  },
  {
    id: 4,
    name: "Shacman №8",
    brand: "Shacman",
    model: "",
    plateNumber: "",
    garageNumber: "8",
    vehicleType: "Самосвал",
    equipmentType: "Самосвал",
    manufactureYear: "",
    fuelNormWinter: 0,
    fuelNormSummer: 0,
    fuelCalcType: "Пробег",
    vin: "",
    owner: "Proline Logistic",
    area: "Аксу",
    location: "Ремзона",
    workType: "Резерв",
    excavator: "—",
    contractor: "Proline Logistic",
    work: 0,
    rent: 0,
    repair: 11,
    downtime: 0,
    trips: 0,
    active: true,
  },
  {
    id: 5,
    name: "Shacman №22",
    brand: "Shacman",
    model: "",
    plateNumber: "",
    garageNumber: "22",
    vehicleType: "Самосвал",
    equipmentType: "Самосвал",
    manufactureYear: "",
    fuelNormWinter: 0,
    fuelNormSummer: 0,
    fuelCalcType: "Пробег",
    vin: "",
    owner: "Эко-Сервис",
    area: "Жолымбет",
    location: "Стоянка",
    workType: "Не задействована",
    excavator: "—",
    contractor: "Эко-Сервис",
    work: 0,
    rent: 0,
    repair: 0,
    downtime: 0,
    trips: 0,
    active: false,
  },
];

export function createVehicleSeedVersion(seedRows: VehicleSeedRow[]) {
  return `excel-tech-list-${seedRows.length}-2026-04-18`;
}

export function createDefaultVehicles(seedRows: VehicleSeedRow[], fallbackRows: VehicleRow[] = defaultVehicleFallbackRows) {
  return seedRows.length > 0
    ? seedRows.map((seedVehicle, index) => {
      const fuelCalcType = ["Транспортировочная", "Легковая", "Пассажирская"].includes(seedVehicle.category)
        ? "Пробег"
        : "Моточасы";
      const vehicle: VehicleRow = {
        id: index + 1,
        name: "",
        brand: seedVehicle.brand,
        model: seedVehicle.model,
        plateNumber: seedVehicle.plateNumber,
        garageNumber: seedVehicle.garageNumber,
        vehicleType: seedVehicle.category,
        equipmentType: seedVehicle.equipmentType,
        manufactureYear: seedVehicle.manufactureYear ?? "",
        fuelNormWinter: 0,
        fuelNormSummer: 0,
        fuelCalcType,
        vin: "",
        owner: seedVehicle.owner,
        area: "",
        location: "",
        workType: "",
        excavator: "",
        contractor: seedVehicle.owner,
        work: 0,
        rent: 0,
        repair: 0,
        downtime: 0,
        trips: 0,
        active: true,
        visible: true,
      };

      return { ...vehicle, name: buildVehicleDisplayName(vehicle) };
    })
    : fallbackRows;
}

export function normalizeVehicleRow(vehicle: unknown): VehicleRow {
  const mergedVehicle = {
    ...defaultVehicleForm,
    ...(isRecord(vehicle) ? vehicle : {}),
  } as VehicleRow;

  const normalizedVehicle = {
    ...mergedVehicle,
    equipmentType: mergedVehicle.equipmentType || mergedVehicle.vehicleType,
    visible: mergedVehicle.visible !== false,
  };

  return {
    ...normalizedVehicle,
    name: buildVehicleDisplayName(normalizedVehicle),
  };
}
