export type FuelRow = {
  unit: string;
  liters: number;
  mode: string;
  debt: number;
  contractor?: string;
};

export type UserCard = {
  fullName: string;
  role: string;
  department: string;
  access: string;
};

export const defaultContractors: Record<string, string[]> = {
  "AA Mining": ["Komatsu HD785 №12", "Howo №21"],
  "Qaz Trucks": ["Toyota Hilux P128", "Howo №41", "Shacman №17"],
  "Proline Logistic": ["Shacman №8", "Howo №55"],
  "Эко-Сервис": ["Shacman №22", "Howo №61"],
};

export const defaultFuelGeneral: FuelRow[] = [
  { unit: "Howo №21", liters: 320, mode: "Наша по договору", debt: 0 },
  { unit: "Komatsu HD785 №12", liters: 450, mode: "С перевыставлением", debt: 0 },
];

export const defaultFuelContractors: FuelRow[] = [
  { contractor: "Qaz Trucks", unit: "Toyota Hilux P128", liters: 70, mode: "В долг", debt: 210 },
  { contractor: "Proline Logistic", unit: "Howo №55", liters: 180, mode: "В долг", debt: 520 },
];

export const defaultUserCard: UserCard = {
  fullName: "Альберт",
  role: "Начальник диспетчерской службы",
  department: "Диспетчерская служба",
  access: "Полный доступ",
};
