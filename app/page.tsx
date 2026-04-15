"use client";

import { Check, ChevronDown, ChevronRight, Download, Eye, EyeOff, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import Image from "next/image";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabaseConfigured } from "@/lib/supabase/client";
import { loadPtoStateFromSupabase, savePtoStateToSupabase } from "@/lib/supabase/pto";

type VehicleRow = {
  id: number;
  name: string;
  brand: string;
  model: string;
  plateNumber: string;
  garageNumber: string;
  vehicleType: string;
  fuelNormWinter: number;
  fuelNormSummer: number;
  fuelCalcType: "Моточасы" | "Пробег";
  vin: string;
  owner: string;
  area: string;
  location: string;
  workType: string;
  excavator: string;
  contractor?: string;
  work: number;
  rent: number;
  repair: number;
  downtime: number;
  trips: number;
  active: boolean;
  visible?: boolean;
};

type FuelRow = {
  unit: string;
  liters: number;
  mode: string;
  debt: number;
  contractor?: string;
};

type ReportRow = {
  area: string;
  name: string;
  unit: string;
  dayPlan: number;
  dayFact: number;
  dayProductivity: number;
  dayReason: string;
  monthTotalPlan: number;
  monthPlan: number;
  monthFact: number;
  monthSurveyFact: number;
  monthOperFact: number;
  monthProductivity: number;
  yearPlan: number;
  yearFact: number;
  yearSurveyFact: number;
  yearOperFact: number;
  yearReason: string;
  annualPlan: number;
  annualFact: number;
};

type PtoPlanRow = {
  id: string;
  area: string;
  location: string;
  structure: string;
  unit: string;
  coefficient: number;
  status: string;
  carryover: number;
  carryovers?: Record<string, number>;
  carryoverManualYears?: string[];
  dailyPlans: Record<string, number>;
  years?: string[];
};

type PtoStatus = "Новая" | "В работе" | "Завершена" | "Запланировано";

type PtoDropPosition = "before" | "after";

type PtoDropTarget = {
  rowId: string;
  position: PtoDropPosition;
};

type PtoFormulaCell = {
  table: string;
  year: string;
  rowId: string;
  kind: "coefficient" | "carryover" | "month" | "day";
  label: string;
  day?: string;
  month?: string;
  days?: string[];
  editable?: boolean;
};

type PtoResizeState =
  | { type: "column"; key: string; startX: number; startWidth: number }
  | { type: "row"; key: string; startY: number; startHeight: number };

type PtoTableColumn = {
  key: string;
  width: number;
};

type CustomTab = {
  id: string;
  title: string;
  description: string;
  items: string[];
  visible?: boolean;
};

type BaseTopTab =
  | "reports"
  | "dispatch"
  | "fleet"
  | "contractors"
  | "fuel"
  | "pto"
  | "tb"
  | "user"
  | "admin";

type TopTab = BaseTopTab | `custom:${string}`;

type TopTabDefinition = {
  id: BaseTopTab;
  label: string;
  visible: boolean;
  locked?: boolean;
};

type EditableSubtabGroup = "reports" | "dispatch" | "fleet" | "contractors" | "fuel" | "pto" | "tb";

type SubTabConfig = {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  builtIn?: boolean;
  content?: string;
};

type NewSubTabForm = {
  group: EditableSubtabGroup;
  label: string;
  content: string;
};

type OrgMember = {
  id: string;
  name: string;
  position: string;
  department: string;
  area: string;
  linearManagerId: string;
  functionalManagerId: string;
  active: boolean;
};

type DependencyLinkType = "Линейная" | "Функциональная";

type DependencyNode = {
  id: string;
  name: string;
  kind: string;
  owner: string;
  visible: boolean;
};

type DependencyLink = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  linkType: DependencyLinkType;
  rule: string;
  owner: string;
  visible: boolean;
};

type StructureSection = "scheme" | "elements" | "links" | "roles";

type AdminSection = "menu" | "subtabs" | "structure" | "vehicles" | "reports" | "content";

const defaultVehicles: VehicleRow[] = [
  {
    id: 1,
    name: "Komatsu HD785 №12",
    brand: "Komatsu",
    model: "HD785",
    plateNumber: "",
    garageNumber: "12",
    vehicleType: "Карьерный самосвал",
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

const defaultVehicleForm: VehicleRow = {
  id: 0,
  name: "",
  brand: "",
  model: "",
  plateNumber: "",
  garageNumber: "",
  vehicleType: "",
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

const contractors: Record<string, string[]> = {
  "AA Mining": ["Komatsu HD785 №12", "Howo №21"],
  "Qaz Trucks": ["Toyota Hilux P128", "Howo №41", "Shacman №17"],
  "Proline Logistic": ["Shacman №8", "Howo №55"],
  "Эко-Сервис": ["Shacman №22", "Howo №61"],
};

const defaultTopTabs: TopTabDefinition[] = [
  { id: "reports", label: "Отчетность", visible: true },
  { id: "dispatch", label: "Сводка", visible: true },
  { id: "fleet", label: "Техника", visible: true },
  { id: "contractors", label: "Подрядчики", visible: true },
  { id: "fuel", label: "Топливо", visible: true },
  { id: "pto", label: "ПТО", visible: true },
  { id: "tb", label: "ТБ", visible: true },
  { id: "user", label: "Профиль", visible: true },
  { id: "admin", label: "Админка", visible: true, locked: true },
];

const defaultSubTabs: Record<EditableSubtabGroup, SubTabConfig[]> = {
  reports: [
    { id: "reports-all", label: "Все участки", value: "Все участки", visible: true, builtIn: true },
    { id: "reports-aksu", label: "Аксу", value: "Аксу", visible: true, builtIn: true },
    { id: "reports-akbakai", label: "Акбакай", value: "Акбакай", visible: true, builtIn: true },
    { id: "reports-zholymbet", label: "Жолымбет", value: "Жолымбет", visible: true, builtIn: true },
  ],
  dispatch: [
    { id: "dispatch-daily", label: "Сутки", value: "daily", visible: true, builtIn: true },
    { id: "dispatch-night", label: "Ночь", value: "night", visible: true, builtIn: true },
    { id: "dispatch-day", label: "День", value: "day", visible: true, builtIn: true },
  ],
  fleet: [
    { id: "fleet-all", label: "Все", value: "all", visible: true, builtIn: true },
    { id: "fleet-rent", label: "Аренда", value: "rent", visible: true, builtIn: true },
    { id: "fleet-work", label: "Работа", value: "work", visible: true, builtIn: true },
    { id: "fleet-idle", label: "Простой", value: "idle", visible: true, builtIn: true },
    { id: "fleet-repair", label: "Ремонт", value: "repair", visible: true, builtIn: true },
    { id: "fleet-free", label: "Свободна", value: "free", visible: true, builtIn: true },
  ],
  contractors: Object.keys(contractors).map((name) => ({
    id: `contractors-${name}`,
    label: name,
    value: name,
    visible: true,
    builtIn: true,
  })),
  fuel: [
    { id: "fuel-general", label: "Общая", value: "general", visible: true, builtIn: true },
    { id: "fuel-contractors", label: "Подрядчики", value: "contractors", visible: true, builtIn: true },
  ],
  pto: [
    { id: "pto-bodies", label: "Кузова", value: "bodies", visible: true, builtIn: true },
    { id: "pto-performance", label: "Произв.", value: "performance", visible: true, builtIn: true },
    { id: "pto-cycle", label: "Цикл", value: "cycle", visible: true, builtIn: true },
    { id: "pto-buckets", label: "Ковши", value: "buckets", visible: true, builtIn: true },
    { id: "pto-plan", label: "План", value: "plan", visible: true, builtIn: true },
    { id: "pto-oper", label: "Оперучет", value: "oper", visible: true, builtIn: true },
    { id: "pto-survey", label: "Замер", value: "survey", visible: true, builtIn: true },
  ],
  tb: [
    { id: "tb-list", label: "Техника", value: "list", visible: true, builtIn: true },
    { id: "tb-driving", label: "Вождение", value: "driving", visible: true, builtIn: true },
    { id: "tb-contractors", label: "Подрядчики", value: "contractors", visible: true, builtIn: true },
  ],
};

const subtabGroupLabels: Record<EditableSubtabGroup, string> = {
  reports: "Отчетность",
  dispatch: "Диспетчерская сводка",
  fleet: "Список техники",
  contractors: "Подрядчики",
  fuel: "Топливо",
  pto: "ПТО",
  tb: "ТБ",
};

const defaultReportRows: ReportRow[] = [
  {
    area: "Аксу",
    name: "Подача руды в бункер ЗИФ КАТех",
    unit: "тн",
    dayPlan: 2064,
    dayFact: 2102,
    dayProductivity: 2102,
    dayReason: "",
    monthTotalPlan: 62892,
    monthPlan: 23988,
    monthFact: 25100,
    monthSurveyFact: 22998,
    monthOperFact: 2102,
    monthProductivity: 25100,
    yearPlan: 208500,
    yearFact: 216698,
    yearSurveyFact: 214596,
    yearOperFact: 2102,
    yearReason: "",
    annualPlan: 734781,
    annualFact: 216698,
  },
  {
    area: "Аксу",
    name: "Перевозка руды с карьера Котенко на ЗИФ КАТех",
    unit: "тн",
    dayPlan: 500,
    dayFact: 665,
    dayProductivity: 665,
    dayReason: "",
    monthTotalPlan: 53200,
    monthPlan: 10600,
    monthFact: 6721,
    monthSurveyFact: 6056,
    monthOperFact: 665,
    monthProductivity: 6721,
    yearPlan: 194793,
    yearFact: 109050,
    yearSurveyFact: 108385,
    yearOperFact: 665,
    yearReason: "Ремонт транспортировочной техники; перевозка приостановлена по инициативе ТОО \"Казахалтын Technology\"; погодные условия; перенаправление на перевозку дробленной руды.",
    annualPlan: 629956,
    annualFact: 109050,
  },
  {
    area: "Аксу",
    name: "Отсыпка тела дамбы 2 секция ААМ",
    unit: "м3",
    dayPlan: 4624,
    dayFact: 7780,
    dayProductivity: 7780,
    dayReason: "",
    monthTotalPlan: 134720,
    monthPlan: 51488,
    monthFact: 63727,
    monthSurveyFact: 55947,
    monthOperFact: 7780,
    monthProductivity: 63727,
    yearPlan: 51488,
    yearFact: 76138,
    yearSurveyFact: 68358,
    yearOperFact: 7780,
    yearReason: "",
    annualPlan: 240107,
    annualFact: 76138,
  },
  {
    area: "Акбакай",
    name: "Перевозка горной массы с карьера",
    unit: "м3",
    dayPlan: 10352,
    dayFact: 11171,
    dayProductivity: 11171,
    dayReason: "",
    monthTotalPlan: 314239,
    monthPlan: 123630,
    monthFact: 125674,
    monthSurveyFact: 114503,
    monthOperFact: 11171,
    monthProductivity: 125674,
    yearPlan: 980026,
    yearFact: 965596,
    yearSurveyFact: 954425,
    yearOperFact: 11171,
    yearReason: "Ожидание сортового плана; ожидание ВР; ремонт погрузочной техники; ремонт транспортировочной техники; погодные условия.",
    annualPlan: 3827026,
    annualFact: 965596,
  },
  {
    area: "Акбакай",
    name: "Подача руды на ЗИФ",
    unit: "тн",
    dayPlan: 3331,
    dayFact: 1227,
    dayProductivity: 1227,
    dayReason: "Простой ДСК.",
    monthTotalPlan: 91102,
    monthPlan: 31145,
    monthFact: 38224,
    monthSurveyFact: 36997,
    monthOperFact: 1227,
    monthProductivity: 38224,
    yearPlan: 338528,
    yearFact: 350767,
    yearSurveyFact: 349540,
    yearOperFact: 1227,
    yearReason: "",
    annualPlan: 1200000,
    annualFact: 350767,
  },
];

const defaultReportForm: ReportRow = {
  area: "Аксу",
  name: "",
  unit: "м3",
  dayPlan: 0,
  dayFact: 0,
  dayProductivity: 0,
  dayReason: "",
  monthTotalPlan: 0,
  monthPlan: 0,
  monthFact: 0,
  monthSurveyFact: 0,
  monthOperFact: 0,
  monthProductivity: 0,
  yearPlan: 0,
  yearFact: 0,
  yearSurveyFact: 0,
  yearOperFact: 0,
  yearReason: "",
  annualPlan: 0,
  annualFact: 0,
};

const defaultReportDate = "2026-04-12";

const defaultPtoPlanMonth = "2026-04";
const ptoUnitOptions = ["м2", "м3", "тн"] as const;

function dateRange(start: string, end: string) {
  const result: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);

  while (current <= last) {
    result.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return result;
}

function distributeTotal(target: Record<string, number>, days: string[], total: number) {
  if (!days.length || !total) return;
  const dailyValue = total / days.length;

  days.forEach((day) => {
    target[day] = Number(dailyValue.toFixed(6));
  });
}

function buildPlanDailyValues(dayPlan: number, monthPlan: number, monthTotalPlan: number, yearPlan: number, annualPlan: number) {
  const values: Record<string, number> = {};
  const currentDate = defaultReportDate;
  const remainingMonthPlan = monthTotalPlan - monthPlan;

  distributeTotal(values, dateRange("2026-01-01", "2026-03-31"), yearPlan - monthPlan);
  distributeTotal(values, dateRange("2026-04-01", "2026-04-11"), monthPlan - dayPlan);
  values[currentDate] = dayPlan;
  distributeTotal(values, dateRange("2026-04-13", "2026-04-30"), remainingMonthPlan);
  distributeTotal(values, dateRange("2026-05-01", "2026-12-31"), annualPlan - yearPlan - remainingMonthPlan);

  return values;
}

function buildFactDailyValues(monthSurveyFact: number, monthOperFact: number, yearSurveyFact: number, yearOperFact: number) {
  const survey: Record<string, number> = {};
  const oper: Record<string, number> = {};

  survey["2026-03-31"] = yearSurveyFact - monthSurveyFact;
  survey["2026-04-10"] = monthSurveyFact;
  oper[defaultReportDate] = yearOperFact || monthOperFact;

  return { survey, oper };
}

const defaultPtoPlanRows: PtoPlanRow[] = [
  {
    id: "pto-plan-aksu-feed",
    area: "Уч_Аксу",
    location: "Котенко_Подача",
    structure: "Подача руды в бункер ЗИФ КАТех",
    unit: "Тонна",
    coefficient: 2.01,
    status: "В работе",
    carryover: 0,
    dailyPlans: buildPlanDailyValues(2064, 23988, 62892, 208500, 734781),
  },
  {
    id: "pto-plan-aksu-kotenko",
    area: "Уч_Аксу",
    location: "Котенко_Перевозка",
    structure: "Перевозка руды с карьера Котенко на ЗИФ КАТех",
    unit: "Тонна",
    coefficient: 2.01,
    status: "В работе",
    carryover: 0,
    dailyPlans: buildPlanDailyValues(500, 10600, 53200, 194793, 629956),
  },
  {
    id: "pto-plan-aksu-dam-aam",
    area: "Уч_Аксу",
    location: "Дамба",
    structure: "Отсыпка тела дамбы 2 секция ААМ",
    unit: "Куб",
    coefficient: 0,
    status: "В работе",
    carryover: 0,
    dailyPlans: buildPlanDailyValues(4624, 51488, 134720, 51488, 240107),
  },
  {
    id: "pto-plan-akbakai-ogr",
    area: "Уч_Акбакай",
    location: "Карьер_ОГР",
    structure: "Перевозка горной массы с карьера",
    unit: "Куб",
    coefficient: 2.68,
    status: "В работе",
    carryover: 0,
    dailyPlans: buildPlanDailyValues(10352, 123630, 314239, 980026, 3827026),
  },
  {
    id: "pto-plan-akbakai-zif",
    area: "Уч_Акбакай",
    location: "Перевозка_Подача_руды",
    structure: "Подача руды на ЗИФ",
    unit: "Тонна",
    coefficient: 2.68,
    status: "В работе",
    carryover: 0,
    dailyPlans: buildPlanDailyValues(3331, 31145, 91102, 338528, 1200000),
  },
];

const defaultPtoSurveyRows: PtoPlanRow[] = [
  {
    id: "pto-survey-aksu-feed",
    area: "Уч_Аксу",
    location: "Котенко_Подача",
    structure: "Подача руды в бункер ЗИФ КАТех",
    unit: "Тонна",
    coefficient: 2.01,
    status: "Маркзамер",
    carryover: 0,
    dailyPlans: buildFactDailyValues(22998, 2102, 214596, 2102).survey,
  },
  {
    id: "pto-survey-aksu-kotenko",
    area: "Уч_Аксу",
    location: "Котенко_Перевозка",
    structure: "Перевозка руды с карьера Котенко на ЗИФ КАТех",
    unit: "Тонна",
    coefficient: 2.01,
    status: "Маркзамер",
    carryover: 0,
    dailyPlans: buildFactDailyValues(6056, 665, 108385, 665).survey,
  },
  {
    id: "pto-survey-aksu-dam-aam",
    area: "Уч_Аксу",
    location: "Дамба",
    structure: "Отсыпка тела дамбы 2 секция ААМ",
    unit: "Куб",
    coefficient: 0,
    status: "Маркзамер",
    carryover: 0,
    dailyPlans: buildFactDailyValues(55947, 7780, 68358, 7780).survey,
  },
  {
    id: "pto-survey-akbakai-ogr",
    area: "Уч_Акбакай",
    location: "Карьер_ОГР",
    structure: "Перевозка горной массы с карьера",
    unit: "Куб",
    coefficient: 2.68,
    status: "Маркзамер",
    carryover: 0,
    dailyPlans: buildFactDailyValues(114503, 11171, 954425, 11171).survey,
  },
  {
    id: "pto-survey-akbakai-zif",
    area: "Уч_Акбакай",
    location: "Перевозка_Подача_руды",
    structure: "Подача руды на ЗИФ",
    unit: "Тонна",
    coefficient: 2.68,
    status: "Маркзамер",
    carryover: 0,
    dailyPlans: buildFactDailyValues(36997, 1227, 349540, 1227).survey,
  },
];

const defaultPtoOperRows: PtoPlanRow[] = [
  {
    id: "pto-oper-aksu-feed",
    area: "Уч_Аксу",
    location: "Котенко_Подача",
    structure: "Подача руды в бункер ЗИФ КАТех",
    unit: "Тонна",
    coefficient: 2.01,
    status: "Оперучет",
    carryover: 0,
    dailyPlans: buildFactDailyValues(22998, 2102, 214596, 2102).oper,
  },
  {
    id: "pto-oper-aksu-kotenko",
    area: "Уч_Аксу",
    location: "Котенко_Перевозка",
    structure: "Перевозка руды с карьера Котенко на ЗИФ КАТех",
    unit: "Тонна",
    coefficient: 2.01,
    status: "Оперучет",
    carryover: 0,
    dailyPlans: buildFactDailyValues(6056, 665, 108385, 665).oper,
  },
  {
    id: "pto-oper-aksu-dam-aam",
    area: "Уч_Аксу",
    location: "Дамба",
    structure: "Отсыпка тела дамбы 2 секция ААМ",
    unit: "Куб",
    coefficient: 0,
    status: "Оперучет",
    carryover: 0,
    dailyPlans: buildFactDailyValues(55947, 7780, 68358, 7780).oper,
  },
  {
    id: "pto-oper-akbakai-ogr",
    area: "Уч_Акбакай",
    location: "Карьер_ОГР",
    structure: "Перевозка горной массы с карьера",
    unit: "Куб",
    coefficient: 2.68,
    status: "Оперучет",
    carryover: 0,
    dailyPlans: buildFactDailyValues(114503, 11171, 954425, 11171).oper,
  },
  {
    id: "pto-oper-akbakai-zif",
    area: "Уч_Акбакай",
    location: "Перевозка_Подача_руды",
    structure: "Подача руды на ЗИФ",
    unit: "Тонна",
    coefficient: 2.68,
    status: "Оперучет",
    carryover: 0,
    dailyPlans: buildFactDailyValues(36997, 1227, 349540, 1227).oper,
  },
];

const defaultCustomTabForm = {
  title: "",
  description: "",
};

const defaultOrgMembers: OrgMember[] = [
  {
    id: "director-dispatch",
    name: "Альберт",
    position: "Начальник диспетчерской службы",
    department: "Диспетчерская служба",
    area: "Все участки",
    linearManagerId: "",
    functionalManagerId: "",
    active: true,
  },
  {
    id: "pto-engineer",
    name: "ПТО",
    position: "Инженер ПТО",
    department: "ПТО",
    area: "Все участки",
    linearManagerId: "director-dispatch",
    functionalManagerId: "",
    active: true,
  },
  {
    id: "shift-dispatcher",
    name: "Диспетчер смены",
    position: "Диспетчер",
    department: "Диспетчерская служба",
    area: "Аксу",
    linearManagerId: "director-dispatch",
    functionalManagerId: "pto-engineer",
    active: true,
  },
];

const defaultOrgMemberForm: OrgMember = {
  id: "",
  name: "",
  position: "",
  department: "",
  area: "",
  linearManagerId: "",
  functionalManagerId: "",
  active: true,
};

const defaultDependencyNodes: DependencyNode[] = [
  { id: "sites", name: "Участки", kind: "Справочник", owner: "Админка", visible: true },
  { id: "vehicles", name: "Техника / СводТехники", kind: "Справочник", owner: "Админка / Диспетчер", visible: true },
  { id: "body-measurements", name: "Замеры кузовов", kind: "ПТО", owner: "ПТО", visible: true },
  { id: "volumes", name: "Объемы кузова", kind: "Расчет", owner: "ПТО", visible: true },
  { id: "pto-plan", name: "План / ПланС / График", kind: "План", owner: "ПТО", visible: true },
  { id: "shift-summary", name: "БД сменных записей", kind: "Факт смены", owner: "Диспетчер", visible: true },
  { id: "oper-accounting", name: "Оперативный учет", kind: "Агрегатор факта", owner: "ПТО", visible: true },
  { id: "survey-measurements", name: "Маркзамер", kind: "Корректировка каждые 5 дней", owner: "Маркшейдер", visible: true },
  { id: "performance", name: "Производительность", kind: "Рейсы / объемы / часы", owner: "ПТО", visible: true },
  { id: "reasons", name: "Причины: ремонт, простой, аренда", kind: "Объяснение отклонений", owner: "Диспетчер / Механик", visible: true },
  { id: "reports", name: "Отчетность AAM", kind: "Итог", owner: "Руководитель / ПТО", visible: true },
];

const defaultDependencyLinks: DependencyLink[] = [
  { id: "sites-vehicles", fromNodeId: "sites", toNodeId: "vehicles", linkType: "Линейная", rule: "Техника закрепляется за участком.", owner: "Админка", visible: true },
  { id: "vehicles-body-measurements", fromNodeId: "vehicles", toNodeId: "body-measurements", linkType: "Функциональная", rule: "Для техники выбирается замер кузова по модели, материалу и актуальности.", owner: "ПТО", visible: true },
  { id: "body-measurements-volumes", fromNodeId: "body-measurements", toNodeId: "volumes", linkType: "Функциональная", rule: "Объем подтягивается из замеров кузовов и используется в расчетах.", owner: "ПТО", visible: true },
  { id: "vehicles-shift-summary", fromNodeId: "vehicles", toNodeId: "shift-summary", linkType: "Линейная", rule: "По технике заполняются рейсы, часы, статус, ремонт, простой и аренда.", owner: "Диспетчер", visible: true },
  { id: "shift-summary-oper-accounting", fromNodeId: "shift-summary", toNodeId: "oper-accounting", linkType: "Линейная", rule: "БД сменных записей агрегируется по участку, структуре работ и дате.", owner: "Диспетчер / ПТО", visible: true },
  { id: "volumes-oper-accounting", fromNodeId: "volumes", toNodeId: "oper-accounting", linkType: "Функциональная", rule: "Рейсы умножаются на объем и коэффициенты материала.", owner: "ПТО", visible: true },
  { id: "oper-accounting-survey", fromNodeId: "oper-accounting", toNodeId: "survey-measurements", linkType: "Функциональная", rule: "Маркзамер берет оперучет для дней после последнего замера.", owner: "Маркшейдер / ПТО", visible: true },
  { id: "shift-summary-performance", fromNodeId: "shift-summary", toNodeId: "performance", linkType: "Функциональная", rule: "Рейсы, часы и объемы техники собираются в производительность.", owner: "ПТО", visible: true },
  { id: "shift-summary-reasons", fromNodeId: "shift-summary", toNodeId: "reasons", linkType: "Линейная", rule: "Ремонт, простой и аренда превращаются в причины отклонения.", owner: "Диспетчер / Механик", visible: true },
  { id: "pto-plan-reports", fromNodeId: "pto-plan", toNodeId: "reports", linkType: "Функциональная", rule: "План дает суточный план, план месяца, план с начала года и годовой план.", owner: "ПТО", visible: true },
  { id: "survey-measurements-reports", fromNodeId: "survey-measurements", toNodeId: "reports", linkType: "Функциональная", rule: "Факт отчетности = маркзамер + оперучет недостающих дней до выбранной даты.", owner: "Маркшейдер / ПТО", visible: true },
  { id: "performance-reports", fromNodeId: "performance", toNodeId: "reports", linkType: "Функциональная", rule: "Производительность техники попадает в отдельные колонки отчета.", owner: "ПТО", visible: true },
  { id: "reasons-reports", fromNodeId: "reasons", toNodeId: "reports", linkType: "Функциональная", rule: "Причины показываются за сутки и накоплением с начала года.", owner: "Диспетчер / ПТО", visible: true },
];

const dependencyStages = [
  { title: "1. База", nodeIds: ["sites", "vehicles"] },
  { title: "2. ПТО", nodeIds: ["body-measurements", "volumes", "pto-plan"] },
  { title: "3. Факт смены", nodeIds: ["shift-summary"] },
  { title: "4. Расчеты", nodeIds: ["oper-accounting", "survey-measurements", "performance", "reasons"] },
  { title: "5. Итог", nodeIds: ["reports"] },
];

const defaultDependencyNodeForm: DependencyNode = {
  id: "",
  name: "",
  kind: "",
  owner: "",
  visible: true,
};

const defaultDependencyLinkForm: DependencyLink = {
  id: "",
  fromNodeId: "sites",
  toNodeId: "vehicles",
  linkType: "Линейная",
  rule: "",
  owner: "",
  visible: true,
};

const adminStorageKeys = {
  reports: "dispatcher:reports",
  customTabs: "dispatcher:custom-tabs",
  topTabs: "dispatcher:top-tabs",
  subTabs: "dispatcher:sub-tabs",
  vehicles: "dispatcher:vehicles",
  ptoYears: "dispatcher:pto-years",
  ptoPlanRows: "dispatcher:pto-plan-rows",
  ptoSurveyRows: "dispatcher:pto-survey-rows",
  ptoOperRows: "dispatcher:pto-oper-rows",
  ptoColumnWidths: "dispatcher:pto-column-widths",
  ptoRowHeights: "dispatcher:pto-row-heights",
  ptoHeaderLabels: "dispatcher:pto-header-labels",
  orgMembers: "dispatcher:org-members",
  dependencyNodes: "dispatcher:dependency-nodes",
  dependencyLinks: "dispatcher:dependency-links",
};

const ptoColumnDefaults = {
  area: 138,
  location: 150,
  structure: 250,
  unit: 58,
  coefficient: 72,
  status: 118,
  carryover: 92,
  yearTotal: 92,
  monthTotal: 76,
  day: 54,
  actions: 54,
};

const fuelGeneral: FuelRow[] = [
  { unit: "Howo №21", liters: 320, mode: "Наша по договору", debt: 0 },
  { unit: "Komatsu HD785 №12", liters: 450, mode: "С перевыставлением", debt: 0 },
];

const fuelContractors: FuelRow[] = [
  { contractor: "Qaz Trucks", unit: "Toyota Hilux P128", liters: 70, mode: "В долг", debt: 210 },
  { contractor: "Proline Logistic", unit: "Howo №55", liters: 180, mode: "В долг", debt: 520 },
];

const userCard = {
  fullName: "Альберт",
  role: "Начальник диспетчерской службы",
  department: "Диспетчерская служба",
  access: "Полный доступ",
};

function totalHours(v: VehicleRow) {
  return v.work + v.rent + v.repair + v.downtime;
}

function ktg(v: VehicleRow) {
  return Math.round(((v.work + v.rent) / 11) * 100);
}

function escapeExcelCell(value: string | number | boolean | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusColor(value: number) {
  if (value >= 80) return "#dcfce7";
  if (value >= 50) return "#fef3c7";
  return "#fee2e2";
}

function statusTextColor(value: number) {
  if (value >= 80) return "#166534";
  if (value >= 50) return "#92400e";
  return "#991b1b";
}

function delta(plan: number, fact: number) {
  return fact - plan;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}

function parseDecimalInput(value: string | number) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDecimalValue(value: string | number) {
  return parseDecimalInput(value) ?? 0;
}

function formatPtoCellNumber(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";

  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPtoFormulaNumber(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";

  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 6,
    useGrouping: false,
  }).format(value);
}

function formatPercent(fact: number, plan: number) {
  if (!plan) return fact ? "100%" : "0%";

  return `${Math.round((fact / plan) * 100)}%`;
}

function formatReportDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(new Date(`${value}T00:00:00`));
}

function reportReason(fact: number, plan: number, reason: string) {
  if (fact >= plan) return "План выполнен";
  return reason || "Причина не заполнена";
}

function reportMonthFact(row: ReportRow) {
  const combined = row.monthSurveyFact + row.monthOperFact;
  return combined || row.monthFact;
}

function reportYearFact(row: ReportRow) {
  const combined = row.yearSurveyFact + row.yearOperFact;
  return combined || row.yearFact;
}

function reportAnnualFact(row: ReportRow) {
  return row.annualFact || reportYearFact(row);
}

function reportSurveyCheckpoint(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const checkpointDay = Math.floor(day / 5) * 5 || day;

  return `${year}-${String(month).padStart(2, "0")}-${String(checkpointDay).padStart(2, "0")}`;
}

function monthDays(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const daysCount = new Date(year, monthNumber, 0).getDate();

  return Array.from({ length: daysCount }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
}

function yearMonths(year: string) {
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);
}

function normalizePtoYearValue(value: string | number) {
  const year = Number(value);

  if (!Number.isInteger(year) || year < 1900 || year > 2100) return "";
  return String(year);
}

function ptoYearOptions(rows: PtoPlanRow[], selectedYear: string, manualYears: string[]) {
  const years = new Set<string>([
    selectedYear,
    ...manualYears,
  ].map(normalizePtoYearValue).filter(Boolean));

  rows.forEach((row) => {
    Object.keys(row.dailyPlans).forEach((date) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        years.add(date.slice(0, 4));
      }
    });
  });

  return Array.from(years).sort((a, b) => Number(a) - Number(b));
}

function normalizeStoredPtoYears(value: unknown) {
  if (!Array.isArray(value)) return [defaultPtoPlanMonth.slice(0, 4)];

  const years = value
    .map((year) => normalizePtoYearValue(typeof year === "string" || typeof year === "number" ? year : ""))
    .filter(Boolean);

  const normalizedYears = uniqueSorted(years);
  return normalizedYears.length ? normalizedYears : [defaultPtoPlanMonth.slice(0, 4)];
}

function removeYearFromPtoRows(rows: PtoPlanRow[], year: string) {
  return rows.map((row) => {
    const dailyPlans = Object.fromEntries(
      Object.entries(row.dailyPlans).filter(([date]) => !date.startsWith(`${year}-`)),
    );
    const carryovers = { ...(row.carryovers ?? {}) };
    delete carryovers[year];

    return {
      ...row,
      dailyPlans,
      carryovers,
      carryoverManualYears: (row.carryoverManualYears ?? []).filter((rowYear) => rowYear !== year),
      years: (row.years ?? []).filter((rowYear) => rowYear !== year),
    };
  });
}

function ptoRowHasYear(row: PtoPlanRow, year: string) {
  return (row.years ?? []).includes(year) || Object.keys(row.dailyPlans).some((date) => date.startsWith(`${year}-`)) || row.carryoverManualYears?.includes(year) || row.carryovers?.[year] !== undefined;
}

function formatMonthName(month: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
  }).format(new Date(`${month}-01T00:00:00`));
}

function ptoMonthTotal(row: PtoPlanRow, month: string) {
  const total = Object.entries(row.dailyPlans).reduce((sum, [date, value]) => (
    date.startsWith(month) ? sum + value : sum
  ), 0);

  return Math.round(total * 1000000) / 1000000;
}

function ptoYearTotal(row: PtoPlanRow, year: string) {
  const total = Object.entries(row.dailyPlans).reduce((sum, [date, value]) => (
    date.startsWith(year) ? sum + value : sum
  ), 0);

  return Math.round(total * 1000000) / 1000000;
}

function normalizePtoUnit(value: string | undefined) {
  const text = (value ?? "").trim().toLowerCase().replace(/\s+/g, "");

  if (text === "м2" || text === "м²" || text.includes("кв")) return "м2";
  if (text === "м3" || text === "м³" || text.includes("куб")) return "м3";
  if (text === "т" || text === "тн" || text.includes("тон")) return "тн";
  if ((ptoUnitOptions as readonly string[]).includes(text)) return text;
  return "м3";
}

function ptoAutomatedStatus(row: PtoPlanRow, selectedDate: string): PtoStatus {
  const month = selectedDate.slice(0, 7);
  const filledDates = Object.entries(row.dailyPlans)
    .filter(([, value]) => Number.isFinite(value))
    .map(([date]) => date)
    .sort();

  if (filledDates.length === 0) return "Новая";
  if (filledDates.some((date) => date.startsWith(month) && date <= selectedDate)) return "В работе";
  if (filledDates.some((date) => date > selectedDate)) return "Запланировано";
  return "Завершена";
}

function ptoStatusRowBackground(status: PtoStatus) {
  if (status === "Новая") return "#f8fafc";
  if (status === "В работе") return "#f0fdf4";
  if (status === "Завершена") return "#fff1f2";
  return "#eff6ff";
}

function ptoStatusControlStyle(status: PtoStatus): React.CSSProperties {
  if (status === "Новая") {
    return {
      background: "#f1f5f9",
      borderColor: "#cbd5e1",
      color: "#334155",
    };
  }

  if (status === "В работе") {
    return {
      background: "#dcfce7",
      borderColor: "#86efac",
      color: "#166534",
    };
  }

  if (status === "Завершена") {
    return {
      background: "#ffe4e6",
      borderColor: "#fda4af",
      color: "#9f1239",
    };
  }

  return {
    background: "#dbeafe",
    borderColor: "#93c5fd",
    color: "#1e40af",
  };
}

function previousPtoYearLabel(year: string) {
  const numericYear = Number(year);
  return Number.isFinite(numericYear) ? String(numericYear - 1) : "прошлого года";
}

function ptoStoredCarryover(row: PtoPlanRow, year: string) {
  return row.carryovers?.[year] ?? (year === defaultPtoPlanMonth.slice(0, 4) ? row.carryover : 0);
}

function ptoCarryoverIsManual(row: PtoPlanRow, year: string) {
  if (row.carryoverManualYears?.includes(year)) return true;
  return !row.carryovers && year === defaultPtoPlanMonth.slice(0, 4) && row.carryover !== 0;
}

function ptoAutoCarryover(row: PtoPlanRow, year: string, rows: PtoPlanRow[], visited = new Set<string>()): number {
  const numericYear = Number(year);
  if (!Number.isFinite(numericYear)) return 0;

  const previousYear = String(numericYear - 1);
  const signature = ptoLinkedRowSignature(row);
  if (!signature) return 0;

  return rows
    .filter((item) => ptoLinkedRowSignature(item) === signature && ptoRowHasYear(item, previousYear))
    .reduce((sum, item) => sum + ptoYearTotalWithCarryover(item, previousYear, rows, visited), 0);
}

function ptoEffectiveCarryover(row: PtoPlanRow, year: string, rows: PtoPlanRow[], visited = new Set<string>()): number {
  if (ptoCarryoverIsManual(row, year)) return ptoStoredCarryover(row, year);
  return ptoAutoCarryover(row, year, rows, visited);
}

function ptoYearTotalWithCarryover(row: PtoPlanRow, year: string, rows: PtoPlanRow[] = [row], visited = new Set<string>()): number {
  const key = `${row.id}:${year}`;
  if (visited.has(key)) return ptoYearTotal(row, year);

  const nextVisited = new Set(visited);
  nextVisited.add(key);

  return Math.round((ptoEffectiveCarryover(row, year, rows, nextVisited) + ptoYearTotal(row, year)) * 1000000) / 1000000;
}

function normalizeLookupValue(value: string) {
  return value
    .toLowerCase()
    .replace(/^уч[._\s-]*/, "")
    .replace(/[^a-zа-яё0-9]+/g, "");
}

function cleanAreaName(value: string) {
  return value.replace(/^Уч[._\s-]*/i, "").replace(/^уч[._\s-]*/i, "");
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "ru"));
}

function ptoAreaMatches(rowArea: string, filterArea: string) {
  return filterArea === "Все участки" || normalizeLookupValue(rowArea) === normalizeLookupValue(filterArea);
}

function ptoLinkedRowSignature(row: PtoPlanRow) {
  const signature = [
    cleanAreaName(row.area),
    row.structure,
    row.unit,
  ].map(normalizeLookupValue).join(":");

  return signature === "::" ? "" : signature;
}

function ptoLinkedRowMatches(row: PtoPlanRow, id: string, signature: string) {
  return row.id === id || (signature !== "" && ptoLinkedRowSignature(row) === signature);
}

function reorderPtoRows(rows: PtoPlanRow[], sourceId: string, sourceSignature: string, targetId: string, targetSignature: string, position: PtoDropPosition) {
  const sourceIndex = rows.findIndex((row) => ptoLinkedRowMatches(row, sourceId, sourceSignature));
  const targetIndex = rows.findIndex((row) => ptoLinkedRowMatches(row, targetId, targetSignature));

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return rows;

  const nextRows = [...rows];
  const [movedRow] = nextRows.splice(sourceIndex, 1);
  const nextTargetIndex = nextRows.findIndex((row) => ptoLinkedRowMatches(row, targetId, targetSignature));
  if (nextTargetIndex < 0) return rows;

  nextRows.splice(position === "after" ? nextTargetIndex + 1 : nextTargetIndex, 0, movedRow);

  return nextRows;
}

function ptoRowMatchesReport(row: PtoPlanRow, report: ReportRow) {
  return normalizeLookupValue(row.area) === normalizeLookupValue(report.area)
    && normalizeLookupValue(row.structure) === normalizeLookupValue(report.name);
}

function ptoRowsForReport(rows: PtoPlanRow[], report: ReportRow) {
  return rows.filter((row) => ptoRowMatchesReport(row, report));
}

function sumPtoRows(rows: PtoPlanRow[], report: ReportRow, includeDate: (date: string) => boolean, options: { includeCarryover?: boolean; carryoverYear?: string } = {}) {
  const matchedRows = ptoRowsForReport(rows, report);

  return {
    matched: matchedRows.length > 0,
    value: matchedRows.reduce((sum, row) => (
      sum + (options.includeCarryover && options.carryoverYear ? ptoEffectiveCarryover(row, options.carryoverYear, rows) : 0) + Object.entries(row.dailyPlans).reduce((rowSum, [date, value]) => (
        includeDate(date) ? rowSum + value : rowSum
      ), 0)
    ), 0),
  };
}

function sourceValue(source: { matched: boolean; value: number }, fallback: number) {
  return source.matched ? source.value : fallback;
}

function normalizePtoPlanRow(row: Partial<PtoPlanRow>): PtoPlanRow {
  const dailyPlans = row.dailyPlans ?? {};
  const storedCarryovers = isRecord(row.carryovers)
    ? Object.fromEntries(
        Object.entries(row.carryovers)
          .map(([year, value]) => [normalizePtoYearValue(year), typeof value === "number" ? value : Number(value)])
          .filter(([year, value]) => year && Number.isFinite(value)),
      )
    : {};
  const carryoverManualYears = uniqueSorted(
    Array.isArray(row.carryoverManualYears)
      ? row.carryoverManualYears
          .map((year) => normalizePtoYearValue(year))
          .filter(Boolean)
      : [],
  );
  const legacyCarryover = Number(row.carryover ?? 0);
  const legacyYear = defaultPtoPlanMonth.slice(0, 4);
  if (!Object.keys(storedCarryovers).length && legacyCarryover !== 0) {
    storedCarryovers[legacyYear] = legacyCarryover;
    carryoverManualYears.push(legacyYear);
  }
  const years = uniqueSorted([
    ...(row.years ?? []),
    ...Object.keys(dailyPlans)
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .map((date) => date.slice(0, 4)),
    ...Object.keys(storedCarryovers),
  ]);

  return {
    id: row.id || createId(),
    area: row.area ?? "",
    location: row.location ?? "",
    structure: row.structure ?? "",
    unit: normalizePtoUnit(row.unit),
    coefficient: Number(row.coefficient ?? 0),
    status: row.status ?? "В работе",
    carryover: legacyCarryover,
    carryovers: storedCarryovers,
    carryoverManualYears: uniqueSorted(carryoverManualYears),
    dailyPlans,
    years: years.length ? years : [defaultPtoPlanMonth.slice(0, 4)],
  };
}

function normalizeReportRow(row: Partial<ReportRow>): ReportRow {
  const normalized = {
    ...defaultReportForm,
    ...row,
  };

  return {
    ...normalized,
    dayProductivity: row.dayProductivity ?? normalized.dayFact,
    dayReason: normalized.dayReason ?? "",
    monthTotalPlan: normalized.monthTotalPlan || normalized.monthPlan,
    monthSurveyFact: row.monthSurveyFact ?? normalized.monthFact,
    monthOperFact: row.monthOperFact ?? 0,
    monthProductivity: row.monthProductivity ?? normalized.monthFact,
    yearSurveyFact: row.yearSurveyFact ?? normalized.yearFact,
    yearOperFact: row.yearOperFact ?? 0,
    yearReason: normalized.yearReason ?? "",
    annualPlan: normalized.annualPlan || normalized.yearPlan,
    annualFact: row.annualFact ?? normalized.yearFact,
  };
}

function createReportRowFromPtoPlan(row: PtoPlanRow): ReportRow {
  return normalizeReportRow({
    area: cleanAreaName(row.area),
    name: row.structure,
    unit: row.unit === "Тонна" ? "тн" : row.unit === "Куб" ? "м3" : row.unit,
    dayReason: "",
    yearReason: "",
  });
}

function deriveReportRowFromPto(row: ReportRow, reportDateValue: string, planRows: PtoPlanRow[], surveyRows: PtoPlanRow[], operRows: PtoPlanRow[]): ReportRow {
  const year = reportDateValue.slice(0, 4);
  const month = reportDateValue.slice(0, 7);
  const cutoffDate = reportSurveyCheckpoint(reportDateValue);

  const dayPlan = sourceValue(
    sumPtoRows(planRows, row, (date) => date === reportDateValue),
    row.dayPlan,
  );
  const monthTotalPlan = sourceValue(
    sumPtoRows(planRows, row, (date) => date.startsWith(month)),
    row.monthTotalPlan,
  );
  const monthPlan = sourceValue(
    sumPtoRows(planRows, row, (date) => date.startsWith(month) && date <= reportDateValue),
    row.monthPlan,
  );
  const yearPlan = sourceValue(
    sumPtoRows(planRows, row, (date) => date.startsWith(year) && date <= reportDateValue, { includeCarryover: true, carryoverYear: year }),
    row.yearPlan,
  );
  const annualPlan = sourceValue(
    sumPtoRows(planRows, row, (date) => date.startsWith(year), { includeCarryover: true, carryoverYear: year }),
    row.annualPlan,
  );

  const dayOperFact = sumPtoRows(operRows, row, (date) => date === reportDateValue);
  const daySurveyFact = sumPtoRows(surveyRows, row, (date) => date === reportDateValue);
  const dayFact = dayOperFact.value || daySurveyFact.value || (dayOperFact.matched || daySurveyFact.matched ? 0 : row.dayFact);

  const monthSurveyFact = sourceValue(
    sumPtoRows(surveyRows, row, (date) => date.startsWith(month) && date <= cutoffDate),
    row.monthSurveyFact,
  );
  const monthOperFact = sourceValue(
    sumPtoRows(operRows, row, (date) => date.startsWith(month) && date > cutoffDate && date <= reportDateValue),
    row.monthOperFact,
  );
  const yearSurveyFact = sourceValue(
    sumPtoRows(surveyRows, row, (date) => date.startsWith(year) && date <= cutoffDate, { includeCarryover: true, carryoverYear: year }),
    row.yearSurveyFact,
  );
  const yearOperFact = sourceValue(
    sumPtoRows(operRows, row, (date) => date.startsWith(year) && date > cutoffDate && date <= reportDateValue, { includeCarryover: true, carryoverYear: year }),
    row.yearOperFact,
  );

  const monthFact = monthSurveyFact + monthOperFact || row.monthFact;
  const yearFact = yearSurveyFact + yearOperFact || row.yearFact;

  return {
    ...row,
    dayPlan,
    dayFact,
    dayProductivity: row.dayProductivity || dayFact,
    monthTotalPlan,
    monthPlan,
    monthSurveyFact,
    monthOperFact,
    monthFact,
    monthProductivity: row.monthProductivity || monthFact,
    yearPlan,
    yearSurveyFact,
    yearOperFact,
    yearFact,
    annualPlan,
    annualFact: yearFact,
  };
}

function mergeDefaultsById<T extends { id: string }>(items: T[], defaults: T[]) {
  const existingIds = new Set(items.map((item) => item.id));
  return [...items, ...defaults.filter((item) => !existingIds.has(item.id))];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeNumberRecord(value: unknown, minValue: number, maxValue: number) {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key, Number(item)] as const)
      .filter(([key, item]) => key.trim() && Number.isFinite(item))
      .map(([key, item]) => [key, Math.min(maxValue, Math.max(minValue, Math.round(item)))])
  ) as Record<string, number>;
}

function normalizeStringRecord(value: unknown) {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => entry[0].trim() !== "" && typeof entry[1] === "string")
      .map(([key, item]) => [key, item.trim()])
      .filter(([, item]) => item !== ""),
  ) as Record<string, string>;
}

function errorToMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function normalizeStoredTopTabs(value: unknown) {
  if (!Array.isArray(value)) return defaultTopTabs;

  const defaultById = new Map(defaultTopTabs.map((tab) => [tab.id, tab]));
  const normalized = value.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== "string") return [];

    const defaultTab = defaultById.get(item.id as BaseTopTab);
    if (!defaultTab) return [];

    return [{
      ...defaultTab,
      label: typeof item.label === "string" && item.label.trim() ? item.label : defaultTab.label,
      visible: defaultTab.locked ? true : item.visible !== false,
    }];
  });

  return mergeDefaultsById(normalized, defaultTopTabs);
}

function normalizeStoredSubTabs(value: unknown): Record<EditableSubtabGroup, SubTabConfig[]> {
  const stored = isRecord(value) ? value : {};
  const groups = Object.keys(defaultSubTabs) as EditableSubtabGroup[];

  return groups.reduce((result, group) => {
    const storedGroup = stored[group];
    const normalizedGroup = Array.isArray(storedGroup)
      ? storedGroup.flatMap((item) => {
        if (!isRecord(item) || typeof item.id !== "string") return [];

        return [{
          id: item.id,
          label: typeof item.label === "string" && item.label.trim() ? item.label : "Подвкладка",
          value: typeof item.value === "string" && item.value.trim() ? item.value : item.id,
          visible: item.visible !== false,
          builtIn: item.builtIn === true,
          content: typeof item.content === "string" ? item.content : undefined,
        }];
      })
      : [];

    return {
      ...result,
      [group]: mergeDefaultsById(normalizedGroup, defaultSubTabs[group]),
    };
  }, {} as Record<EditableSubtabGroup, SubTabConfig[]>);
}

function distributeMonthlyTotal(total: number, days: string[]) {
  if (!Number.isFinite(total) || days.length === 0) return {};

  const totalThousands = Math.round(total * 1000);
  const sign = totalThousands < 0 ? -1 : 1;
  const absoluteThousands = Math.abs(totalThousands);
  const baseThousands = Math.floor(absoluteThousands / days.length);
  const remainderThousands = absoluteThousands % days.length;

  return days.reduce<Record<string, number>>((values, day, index) => {
    values[day] = (sign * (baseThousands + (index < remainderThousands ? 1 : 0))) / 1000;
    return values;
  }, {});
}

function customTabKey(id: string): TopTab {
  return `custom:${id}`;
}

function compactTopTabLabel(tab: TopTabDefinition) {
  const labels: Partial<Record<BaseTopTab, Record<string, string>>> = {
    dispatch: { "Диспетчерская сводка": "Сводка" },
    fleet: { "Список техники по участкам": "Техника" },
    contractors: { "Действующие подрядчики": "Подрядчики" },
    user: { "Пользователь": "Профиль" },
  };

  return labels[tab.id]?.[tab.label] ?? tab.label;
}

function compactSubTabLabel(group: EditableSubtabGroup, tab: SubTabConfig) {
  const labels: Partial<Record<EditableSubtabGroup, Record<string, string>>> = {
    dispatch: {
      "Суточная сводка (Общее)": "Сутки",
      "Ночная сводка - 1 смена": "Ночь",
      "Дневная сводка - 2 смена": "День",
    },
    fleet: {
      "Общий список": "Все",
      "В аренде": "Аренда",
      "В работе": "Работа",
      "В простое": "Простой",
      "В ремонте": "Ремонт",
      "Не задействована": "Свободна",
    },
    pto: {
      "Замеры кузовов": "Кузова",
      "Расчет производительности": "Произв.",
      "Цикл погрузки": "Цикл",
      "Объемы ковшей": "Ковши",
      "Маркшейдерский замер": "Замер",
    },
    tb: {
      "Список техники": "Техника",
      "Качество вождения": "Вождение",
    },
  };

  return labels[group]?.[tab.label] ?? tab.label;
}

function buildVehicleDisplayName(vehicle: Pick<VehicleRow, "name" | "brand" | "model" | "garageNumber" | "plateNumber">) {
  const title = [vehicle.brand, vehicle.model].map((value) => value.trim()).filter(Boolean).join(" ");
  const garageNumber = vehicle.garageNumber.trim();
  const plateNumber = vehicle.plateNumber.trim();
  const numberBlock = garageNumber && plateNumber
    ? `${garageNumber}(${plateNumber})`
    : garageNumber || (plateNumber ? `(${plateNumber})` : "");

  return [title, numberBlock].filter(Boolean).join(" - ") || vehicle.name.trim() || "Без названия";
}

function orgMemberLabel(member?: OrgMember) {
  if (!member) return "Не назначен";

  return [member.name, member.position ? `(${member.position})` : ""].filter(Boolean).join(" ");
}

function dependencyNodeLabel(nodes: DependencyNode[], id: string) {
  return nodes.find((node) => node.id === id)?.name ?? "Не выбрано";
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ptoRowFieldDomKey(rowId: string, field: string) {
  return `${rowId}:${field}`;
}

export default function App() {
  const [topTab, setTopTab] = useState<TopTab>("dispatch");

  const [dispatchTab, setDispatchTab] = useState("daily");
  const [fleetTab, setFleetTab] = useState("all");
  const [contractorTab, setContractorTab] = useState("AA Mining");
  const [fuelTab, setFuelTab] = useState("general");
  const [ptoTab, setPtoTab] = useState("bodies");
  const [tbTab, setTbTab] = useState("list");
  const [vehicleRows, setVehicleRows] = useState<VehicleRow[]>(defaultVehicles);
  const [vehicleCard, setVehicleCard] = useState<VehicleRow | null>(null);
  const [draggedPtoRowId, setDraggedPtoRowId] = useState<string | null>(null);
  const [ptoDropTarget, setPtoDropTarget] = useState<PtoDropTarget | null>(null);
  const [ptoFormulaCell, setPtoFormulaCell] = useState<PtoFormulaCell | null>(null);
  const [ptoFormulaDraft, setPtoFormulaDraft] = useState("");
  const [ptoInlineEditCell, setPtoInlineEditCell] = useState<PtoFormulaCell | null>(null);
  const [ptoInlineEditInitialDraft, setPtoInlineEditInitialDraft] = useState("");
  const [ptoSelectionAnchorCell, setPtoSelectionAnchorCell] = useState<PtoFormulaCell | null>(null);
  const [ptoSelectedCellKeys, setPtoSelectedCellKeys] = useState<string[]>([]);
  const [hoveredPtoAddRowId, setHoveredPtoAddRowId] = useState<string | null>(null);
  const [ptoPendingFieldFocus, setPtoPendingFieldFocus] = useState<{ rowId: string; field: string } | null>(null);
  const ptoSelectionDraggingRef = useRef(false);
  const ptoResizeStateRef = useRef<PtoResizeState | null>(null);
  const ptoDatabaseLoadedRef = useRef(false);
  const ptoDatabaseSavingRef = useRef(false);
  const ptoDatabaseSaveQueuedRef = useRef(false);
  const ptoDatabaseSaveSnapshotRef = useRef("");
  const [topTabs, setTopTabs] = useState<TopTabDefinition[]>(defaultTopTabs);
  const [subTabs, setSubTabs] = useState<Record<EditableSubtabGroup, SubTabConfig[]>>(defaultSubTabs);
  const [reportArea, setReportArea] = useState("Все участки");
  const [reportDate, setReportDate] = useState(defaultReportDate);
  const [reportRows, setReportRows] = useState<ReportRow[]>(defaultReportRows);
  const [reportForm, setReportForm] = useState<ReportRow>(defaultReportForm);
  const [ptoPlanYear, setPtoPlanYear] = useState(defaultPtoPlanMonth.slice(0, 4));
  const [ptoYearInput, setPtoYearInput] = useState("");
  const [ptoYearDialogOpen, setPtoYearDialogOpen] = useState(false);
  const [ptoManualYears, setPtoManualYears] = useState<string[]>([defaultPtoPlanMonth.slice(0, 4)]);
  const [ptoAreaFilter, setPtoAreaFilter] = useState("Все участки");
  const [expandedPtoMonths, setExpandedPtoMonths] = useState<Record<string, boolean>>({ [defaultPtoPlanMonth]: true });
  const [ptoPlanRows, setPtoPlanRows] = useState<PtoPlanRow[]>(() => defaultPtoPlanRows.map(normalizePtoPlanRow));
  const [ptoSurveyRows, setPtoSurveyRows] = useState<PtoPlanRow[]>(() => defaultPtoSurveyRows.map(normalizePtoPlanRow));
  const [ptoOperRows, setPtoOperRows] = useState<PtoPlanRow[]>(() => defaultPtoOperRows.map(normalizePtoPlanRow));
  const [ptoColumnWidths, setPtoColumnWidths] = useState<Record<string, number>>({});
  const [ptoRowHeights, setPtoRowHeights] = useState<Record<string, number>>({});
  const [ptoHeaderLabels, setPtoHeaderLabels] = useState<Record<string, string>>({});
  const [editingPtoHeaderKey, setEditingPtoHeaderKey] = useState<string | null>(null);
  const [ptoHeaderDraft, setPtoHeaderDraft] = useState("");
  const [customTabs, setCustomTabs] = useState<CustomTab[]>([]);
  const [customTabForm, setCustomTabForm] = useState(defaultCustomTabForm);
  const [customInfoForm, setCustomInfoForm] = useState("");
  const [customInfoTabId, setCustomInfoTabId] = useState("");
  const [newSubTabForm, setNewSubTabForm] = useState<NewSubTabForm>({ group: "reports", label: "", content: "" });
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>(defaultOrgMembers);
  const [orgMemberForm, setOrgMemberForm] = useState<OrgMember>(defaultOrgMemberForm);
  const [editingOrgMemberId, setEditingOrgMemberId] = useState<string | null>(null);
  const [dependencyNodes, setDependencyNodes] = useState<DependencyNode[]>(defaultDependencyNodes);
  const [dependencyLinks, setDependencyLinks] = useState<DependencyLink[]>(defaultDependencyLinks);
  const [dependencyNodeForm, setDependencyNodeForm] = useState<DependencyNode>(defaultDependencyNodeForm);
  const [dependencyLinkForm, setDependencyLinkForm] = useState<DependencyLink>(defaultDependencyLinkForm);
  const [editingDependencyNodeId, setEditingDependencyNodeId] = useState<string | null>(null);
  const [editingDependencyLinkId, setEditingDependencyLinkId] = useState<string | null>(null);
  const [structureSection, setStructureSection] = useState<StructureSection>("scheme");
  const [adminSection, setAdminSection] = useState<AdminSection>("menu");
  const [expandedAdminTab, setExpandedAdminTab] = useState<string | null>("reports");
  const [editingTopTabId, setEditingTopTabId] = useState<string | null>(null);
  const [editingSubTabId, setEditingSubTabId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("Изменения сохраняются в этом браузере.");
  const [ptoDatabaseMessage, setPtoDatabaseMessage] = useState(supabaseConfigured ? "База Supabase подключается..." : "База Supabase не настроена.");
  const [ptoDatabaseSaving, setPtoDatabaseSaving] = useState(false);
  const [ptoSaveRevision, setPtoSaveRevision] = useState(0);
  const [adminDataLoaded, setAdminDataLoaded] = useState(false);
  const [areaFilter, setAreaFilter] = useState("Все участки");
  const [search, setSearch] = useState("");
  const ptoDatabaseState = useMemo(() => ({
    manualYears: ptoManualYears,
    planRows: ptoPlanRows,
    operRows: ptoOperRows,
    surveyRows: ptoSurveyRows,
    uiState: {
      reportDate,
      topTab,
      ptoTab,
      ptoPlanYear,
      ptoAreaFilter,
      expandedPtoMonths,
      ptoColumnWidths,
      ptoRowHeights,
      ptoHeaderLabels,
    },
  }), [expandedPtoMonths, ptoAreaFilter, ptoColumnWidths, ptoHeaderLabels, ptoManualYears, ptoOperRows, ptoPlanRows, ptoPlanYear, ptoRowHeights, ptoSurveyRows, ptoTab, reportDate, topTab]);
  const ptoDatabaseSnapshot = useMemo(() => JSON.stringify(ptoDatabaseState), [ptoDatabaseState]);
  const ptoDatabaseStateRef = useRef(ptoDatabaseState);
  const ptoDatabaseSnapshotRef = useRef(ptoDatabaseSnapshot);

  useEffect(() => {
    ptoDatabaseStateRef.current = ptoDatabaseState;
    ptoDatabaseSnapshotRef.current = ptoDatabaseSnapshot;
  }, [ptoDatabaseSnapshot, ptoDatabaseState]);

  useEffect(() => {
    queueMicrotask(() => {
      const readStoredValue = (key: string) => {
        const storedValue = window.localStorage.getItem(key);
        if (!storedValue) return null;

        try {
          return JSON.parse(storedValue) as unknown;
        } catch {
          window.localStorage.removeItem(key);
          return null;
        }
      };

      try {
        const savedReports = readStoredValue(adminStorageKeys.reports);
        const savedCustomTabs = readStoredValue(adminStorageKeys.customTabs);
        const savedTopTabs = readStoredValue(adminStorageKeys.topTabs);
        const savedSubTabs = readStoredValue(adminStorageKeys.subTabs);
        const savedVehicles = readStoredValue(adminStorageKeys.vehicles);
        const savedPtoYears = readStoredValue(adminStorageKeys.ptoYears);
        const savedPtoPlanRows = readStoredValue(adminStorageKeys.ptoPlanRows);
        const savedPtoSurveyRows = readStoredValue(adminStorageKeys.ptoSurveyRows);
        const savedPtoOperRows = readStoredValue(adminStorageKeys.ptoOperRows);
        const savedPtoColumnWidths = readStoredValue(adminStorageKeys.ptoColumnWidths);
        const savedPtoRowHeights = readStoredValue(adminStorageKeys.ptoRowHeights);
        const savedPtoHeaderLabels = readStoredValue(adminStorageKeys.ptoHeaderLabels);
        const savedOrgMembers = readStoredValue(adminStorageKeys.orgMembers);
        const savedDependencyNodes = readStoredValue(adminStorageKeys.dependencyNodes);
        const savedDependencyLinks = readStoredValue(adminStorageKeys.dependencyLinks);

        if (Array.isArray(savedReports)) {
          setReportRows(savedReports.map((row) => normalizeReportRow(isRecord(row) ? row : {})));
        }

        if (Array.isArray(savedCustomTabs)) {
          const parsedTabs = savedCustomTabs.flatMap((tab): CustomTab[] => {
            if (!isRecord(tab) || typeof tab.id !== "string" || typeof tab.title !== "string") return [];

            return [{
              id: tab.id,
              title: tab.title,
              description: typeof tab.description === "string" ? tab.description : "",
              items: Array.isArray(tab.items) ? tab.items.filter((item): item is string => typeof item === "string") : [],
              visible: tab.visible !== false,
            }];
          });

          setCustomTabs(parsedTabs);
          setCustomInfoTabId(parsedTabs[0]?.id ?? "");
        }

        if (savedTopTabs) {
          setTopTabs(normalizeStoredTopTabs(savedTopTabs));
        }

        if (savedSubTabs) {
          setSubTabs(normalizeStoredSubTabs(savedSubTabs));
        }

        if (Array.isArray(savedVehicles)) {
          setVehicleRows(
            savedVehicles.map((vehicle) => {
              const mergedVehicle = {
                ...defaultVehicleForm,
                ...(isRecord(vehicle) ? vehicle : {}),
              } as VehicleRow;

              return {
                ...mergedVehicle,
                name: buildVehicleDisplayName(mergedVehicle),
              };
            }),
          );
        }

        if (savedPtoYears) {
          setPtoManualYears(normalizeStoredPtoYears(savedPtoYears));
        }

        if (Array.isArray(savedPtoPlanRows)) {
          setPtoPlanRows(savedPtoPlanRows.map((row) => normalizePtoPlanRow(isRecord(row) ? row : {})));
        }

        if (Array.isArray(savedPtoSurveyRows)) {
          setPtoSurveyRows(savedPtoSurveyRows.map((row) => normalizePtoPlanRow(isRecord(row) ? row : {})));
        }

        if (Array.isArray(savedPtoOperRows)) {
          setPtoOperRows(savedPtoOperRows.map((row) => normalizePtoPlanRow(isRecord(row) ? row : {})));
        }

        setPtoColumnWidths(normalizeNumberRecord(savedPtoColumnWidths, 44, 800));
        setPtoRowHeights(normalizeNumberRecord(savedPtoRowHeights, 28, 180));
        setPtoHeaderLabels(normalizeStringRecord(savedPtoHeaderLabels));

        if (Array.isArray(savedOrgMembers)) {
          setOrgMembers(
            savedOrgMembers.map((member) => ({
              ...defaultOrgMemberForm,
              ...(isRecord(member) ? member : {}),
              active: !isRecord(member) || member.active !== false,
            } as OrgMember)),
          );
        }

        if (Array.isArray(savedDependencyNodes)) {
          const parsedNodes = savedDependencyNodes.map((node) => ({
            ...defaultDependencyNodeForm,
            ...(isRecord(node) ? node : {}),
            visible: !isRecord(node) || node.visible !== false,
          } as DependencyNode));
          const mergedNodes = mergeDefaultsById(parsedNodes, defaultDependencyNodes);

          setDependencyNodes(mergedNodes);

          if (mergedNodes[0]) {
            setDependencyLinkForm((current) => ({
              ...current,
              fromNodeId: mergedNodes[0].id,
              toNodeId: mergedNodes[1]?.id ?? mergedNodes[0].id,
            }));
          }
        }

        if (Array.isArray(savedDependencyLinks)) {
          setDependencyLinks(
            mergeDefaultsById(
              savedDependencyLinks.map((link) => ({
                ...defaultDependencyLinkForm,
                ...(isRecord(link) ? link : {}),
                visible: !isRecord(link) || link.visible !== false,
              } as DependencyLink)),
              defaultDependencyLinks,
            ),
          );
        }
      } finally {
        setAdminDataLoaded(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!adminDataLoaded) return;

    let cancelled = false;

    async function loadPtoDatabase() {
      if (!supabaseConfigured) {
        setPtoDatabaseMessage("База Supabase не настроена.");
        return;
      }

      setPtoDatabaseMessage("Загружаю ПТО из Supabase...");

      try {
        const databaseState = await loadPtoStateFromSupabase();
        if (cancelled) return;

        if (!databaseState) {
          ptoDatabaseLoadedRef.current = true;
          ptoDatabaseSaveSnapshotRef.current = "";
          setPtoDatabaseMessage("База подключена. Данных ПТО пока нет — внеси изменение, оно сохранится автоматически.");
          return;
        }

        const nextManualYears = normalizeStoredPtoYears(databaseState.manualYears);
        const nextPlanRows = databaseState.planRows.map((row) => normalizePtoPlanRow(row));
        const nextOperRows = databaseState.operRows.map((row) => normalizePtoPlanRow(row));
        const nextSurveyRows = databaseState.surveyRows.map((row) => normalizePtoPlanRow(row));
        const nextUiState = databaseState.uiState ?? {};
        const fallbackUiState = ptoDatabaseStateRef.current.uiState;

        ptoDatabaseLoadedRef.current = true;
        ptoDatabaseSaveSnapshotRef.current = JSON.stringify({
          manualYears: nextManualYears,
          planRows: nextPlanRows,
          operRows: nextOperRows,
          surveyRows: nextSurveyRows,
          uiState: {
            reportDate: nextUiState.reportDate ?? fallbackUiState.reportDate,
            topTab: nextUiState.topTab ?? fallbackUiState.topTab,
            ptoTab: nextUiState.ptoTab ?? fallbackUiState.ptoTab,
            ptoPlanYear: nextUiState.ptoPlanYear ?? fallbackUiState.ptoPlanYear,
            ptoAreaFilter: nextUiState.ptoAreaFilter ?? fallbackUiState.ptoAreaFilter,
            expandedPtoMonths: nextUiState.expandedPtoMonths ?? fallbackUiState.expandedPtoMonths,
            ptoColumnWidths: nextUiState.ptoColumnWidths ?? fallbackUiState.ptoColumnWidths,
            ptoRowHeights: nextUiState.ptoRowHeights ?? fallbackUiState.ptoRowHeights,
            ptoHeaderLabels: nextUiState.ptoHeaderLabels ?? fallbackUiState.ptoHeaderLabels,
          },
        });
        setPtoManualYears(nextManualYears);
        setPtoPlanRows(nextPlanRows);
        setPtoOperRows(nextOperRows);
        setPtoSurveyRows(nextSurveyRows);
        if (typeof nextUiState.reportDate === "string") setReportDate(nextUiState.reportDate);
        if (typeof nextUiState.topTab === "string") setTopTab(nextUiState.topTab as TopTab);
        if (typeof nextUiState.ptoTab === "string") setPtoTab(nextUiState.ptoTab);
        if (typeof nextUiState.ptoPlanYear === "string") setPtoPlanYear(nextUiState.ptoPlanYear);
        if (typeof nextUiState.ptoAreaFilter === "string") setPtoAreaFilter(nextUiState.ptoAreaFilter);
        if (isRecord(nextUiState.expandedPtoMonths)) {
          setExpandedPtoMonths(Object.fromEntries(
            Object.entries(nextUiState.expandedPtoMonths).filter((entry): entry is [string, boolean] => typeof entry[0] === "string" && typeof entry[1] === "boolean"),
          ));
        }
        setPtoColumnWidths(normalizeNumberRecord(nextUiState.ptoColumnWidths ?? fallbackUiState.ptoColumnWidths, 44, 800));
        setPtoRowHeights(normalizeNumberRecord(nextUiState.ptoRowHeights ?? fallbackUiState.ptoRowHeights, 28, 180));
        setPtoHeaderLabels(normalizeStringRecord(nextUiState.ptoHeaderLabels ?? fallbackUiState.ptoHeaderLabels));
        setPtoDatabaseMessage("ПТО загружено из Supabase.");
      } catch (error) {
        if (!cancelled) setPtoDatabaseMessage(`Supabase пока не готов: ${errorToMessage(error)}`);
      }
    }

    void loadPtoDatabase();

    return () => {
      cancelled = true;
    };
  }, [adminDataLoaded]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    window.localStorage.setItem(adminStorageKeys.reports, JSON.stringify(reportRows));
  }, [adminDataLoaded, reportRows]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    window.localStorage.setItem(adminStorageKeys.customTabs, JSON.stringify(customTabs));
  }, [adminDataLoaded, customTabs]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    window.localStorage.setItem(adminStorageKeys.topTabs, JSON.stringify(topTabs));
  }, [adminDataLoaded, topTabs]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    window.localStorage.setItem(adminStorageKeys.subTabs, JSON.stringify(subTabs));
  }, [adminDataLoaded, subTabs]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(vehicleRows));
  }, [adminDataLoaded, vehicleRows]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    window.localStorage.setItem(adminStorageKeys.ptoYears, JSON.stringify(ptoManualYears));
  }, [adminDataLoaded, ptoManualYears]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    window.localStorage.setItem(adminStorageKeys.ptoPlanRows, JSON.stringify(ptoPlanRows));
  }, [adminDataLoaded, ptoPlanRows]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    window.localStorage.setItem(adminStorageKeys.ptoSurveyRows, JSON.stringify(ptoSurveyRows));
  }, [adminDataLoaded, ptoSurveyRows]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    window.localStorage.setItem(adminStorageKeys.ptoOperRows, JSON.stringify(ptoOperRows));
  }, [adminDataLoaded, ptoOperRows]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    window.localStorage.setItem(adminStorageKeys.ptoColumnWidths, JSON.stringify(ptoColumnWidths));
  }, [adminDataLoaded, ptoColumnWidths]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    window.localStorage.setItem(adminStorageKeys.ptoRowHeights, JSON.stringify(ptoRowHeights));
  }, [adminDataLoaded, ptoRowHeights]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    window.localStorage.setItem(adminStorageKeys.ptoHeaderLabels, JSON.stringify(ptoHeaderLabels));
  }, [adminDataLoaded, ptoHeaderLabels]);

  const savePtoDatabaseChanges = useCallback(async (mode: "auto" | "manual" = "manual") => {
    if (!supabaseConfigured) {
      setPtoDatabaseMessage("База Supabase не настроена.");
      return;
    }

    if (!ptoDatabaseLoadedRef.current) return;

    const snapshotToSave = ptoDatabaseSnapshotRef.current;
    if (mode === "auto" && snapshotToSave === ptoDatabaseSaveSnapshotRef.current) {
      setPtoDatabaseMessage("ПТО сохранено в Supabase.");
      return;
    }

    if (ptoDatabaseSavingRef.current) {
      ptoDatabaseSaveQueuedRef.current = true;
      return;
    }

    ptoDatabaseSavingRef.current = true;
    setPtoDatabaseSaving(true);
    setPtoDatabaseMessage(mode === "auto" ? "Автосохраняю ПТО в Supabase..." : "Сохраняю ПТО в Supabase...");

    try {
      await savePtoStateToSupabase(ptoDatabaseStateRef.current);
      ptoDatabaseSaveSnapshotRef.current = snapshotToSave;
      setPtoDatabaseMessage(mode === "auto" ? "ПТО автосохранено в Supabase." : "ПТО сохранено в Supabase.");
    } catch (error) {
      setPtoDatabaseMessage(`Не удалось сохранить в Supabase: ${errorToMessage(error)}`);
    } finally {
      ptoDatabaseSavingRef.current = false;
      setPtoDatabaseSaving(false);
      if (ptoDatabaseSaveQueuedRef.current) {
        ptoDatabaseSaveQueuedRef.current = false;
        if (ptoDatabaseSnapshotRef.current !== ptoDatabaseSaveSnapshotRef.current) {
          setPtoSaveRevision((current) => current + 1);
        }
      }
    }
  }, []);

  const requestPtoDatabaseSave = useCallback(() => {
    if (!supabaseConfigured || !ptoDatabaseLoadedRef.current) return;
    setPtoDatabaseMessage("Есть изменения. Автосохраняю после завершенного действия...");
    setPtoSaveRevision((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!adminDataLoaded || !supabaseConfigured || !ptoDatabaseLoadedRef.current || ptoSaveRevision === 0) return;
    void savePtoDatabaseChanges("auto");
  }, [adminDataLoaded, ptoSaveRevision, savePtoDatabaseChanges]);

  useEffect(() => {
    const clearResizeCursor = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    const handleResizeMove = (event: MouseEvent) => {
      const resizeState = ptoResizeStateRef.current;
      if (!resizeState) return;

      if (resizeState.type === "column") {
        const nextWidth = Math.min(800, Math.max(44, Math.round(resizeState.startWidth + event.clientX - resizeState.startX)));
        setPtoColumnWidths((current) => (current[resizeState.key] === nextWidth ? current : { ...current, [resizeState.key]: nextWidth }));
        return;
      }

      const nextHeight = Math.min(180, Math.max(28, Math.round(resizeState.startHeight + event.clientY - resizeState.startY)));
      setPtoRowHeights((current) => (current[resizeState.key] === nextHeight ? current : { ...current, [resizeState.key]: nextHeight }));
    };

    const handleResizeEnd = () => {
      if (!ptoResizeStateRef.current) return;

      ptoResizeStateRef.current = null;
      clearResizeCursor();
      requestPtoDatabaseSave();
    };

    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", handleResizeEnd);

    return () => {
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeEnd);
      clearResizeCursor();
    };
  }, [requestPtoDatabaseSave]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    window.localStorage.setItem(adminStorageKeys.orgMembers, JSON.stringify(orgMembers));
  }, [adminDataLoaded, orgMembers]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    window.localStorage.setItem(adminStorageKeys.dependencyNodes, JSON.stringify(dependencyNodes));
  }, [adminDataLoaded, dependencyNodes]);

  useEffect(() => {
    if (!adminDataLoaded) return;
    window.localStorage.setItem(adminStorageKeys.dependencyLinks, JSON.stringify(dependencyLinks));
  }, [adminDataLoaded, dependencyLinks]);

  useEffect(() => {
    const stopPtoSelectionDrag = () => {
      ptoSelectionDraggingRef.current = false;
    };

    window.addEventListener("mouseup", stopPtoSelectionDrag);
    return () => window.removeEventListener("mouseup", stopPtoSelectionDrag);
  }, []);

  useEffect(() => {
    if (!ptoPendingFieldFocus) return;

    const frame = window.requestAnimationFrame(() => {
      const element = document.querySelector<HTMLInputElement | HTMLSelectElement>(
        `[data-pto-row-field="${ptoRowFieldDomKey(ptoPendingFieldFocus.rowId, ptoPendingFieldFocus.field)}"]`,
      );

      if (!element) return;
      element.focus();
      if (element instanceof HTMLInputElement) {
        const valueLength = element.value.length;
        element.setSelectionRange(valueLength, valueLength);
      }
      setPtoPendingFieldFocus(null);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [ptoPendingFieldFocus, ptoOperRows, ptoPlanRows, ptoSurveyRows]);

  function saveAdminChanges() {
    window.localStorage.setItem(adminStorageKeys.reports, JSON.stringify(reportRows));
    window.localStorage.setItem(adminStorageKeys.customTabs, JSON.stringify(customTabs));
    window.localStorage.setItem(adminStorageKeys.topTabs, JSON.stringify(topTabs));
    window.localStorage.setItem(adminStorageKeys.subTabs, JSON.stringify(subTabs));
    window.localStorage.setItem(adminStorageKeys.vehicles, JSON.stringify(vehicleRows));
    window.localStorage.setItem(adminStorageKeys.ptoYears, JSON.stringify(ptoManualYears));
    window.localStorage.setItem(adminStorageKeys.ptoPlanRows, JSON.stringify(ptoPlanRows));
    window.localStorage.setItem(adminStorageKeys.ptoSurveyRows, JSON.stringify(ptoSurveyRows));
    window.localStorage.setItem(adminStorageKeys.ptoOperRows, JSON.stringify(ptoOperRows));
    window.localStorage.setItem(adminStorageKeys.ptoColumnWidths, JSON.stringify(ptoColumnWidths));
    window.localStorage.setItem(adminStorageKeys.ptoRowHeights, JSON.stringify(ptoRowHeights));
    window.localStorage.setItem(adminStorageKeys.ptoHeaderLabels, JSON.stringify(ptoHeaderLabels));
    window.localStorage.setItem(adminStorageKeys.orgMembers, JSON.stringify(orgMembers));
    window.localStorage.setItem(adminStorageKeys.dependencyNodes, JSON.stringify(dependencyNodes));
    window.localStorage.setItem(adminStorageKeys.dependencyLinks, JSON.stringify(dependencyLinks));
    void savePtoDatabaseChanges();
    setSaveMessage("Сохранено. Редактирование можно завершить.");
  }

  const reportAreas = useMemo(() => {
    return subTabs.reports
      .filter((tab) => tab.visible && tab.value !== "Все участки")
      .map((tab) => tab.value);
  }, [subTabs.reports]);

  const reportBaseRows = useMemo(() => {
    const existingKeys = new Set(reportRows.map((row) => `${normalizeLookupValue(row.area)}:${normalizeLookupValue(row.name)}`));
    const rowsFromPlan = ptoPlanRows
      .filter((row) => row.structure.trim())
      .filter((row) => !existingKeys.has(`${normalizeLookupValue(cleanAreaName(row.area))}:${normalizeLookupValue(row.structure)}`))
      .map(createReportRowFromPtoPlan);

    return [...reportRows, ...rowsFromPlan];
  }, [ptoPlanRows, reportRows]);

  const filteredReports = useMemo(() => {
    return reportBaseRows
      .map((row) => deriveReportRowFromPto(row, reportDate, ptoPlanRows, ptoSurveyRows, ptoOperRows))
      .filter((row) => reportArea === "Все участки" || normalizeLookupValue(row.area) === normalizeLookupValue(reportArea));
  }, [ptoOperRows, ptoPlanRows, ptoSurveyRows, reportArea, reportBaseRows, reportDate]);
  const reportMonthStart = `${reportDate.slice(0, 8)}01`;
  const reportMonthEnd = `${reportDate.slice(0, 8)}${new Date(Number(reportDate.slice(0, 4)), Number(reportDate.slice(5, 7)), 0).getDate()}`;
  const reportCompletionCards = useMemo(() => {
    const areaNames = reportArea === "Все участки"
      ? uniqueSorted([...reportAreas, ...filteredReports.map((row) => row.area)])
      : [reportArea];

    return areaNames.map((areaName) => {
      const areaRows = filteredReports.filter((row) => normalizeLookupValue(row.area) === normalizeLookupValue(areaName));
      const plan = areaRows.reduce((sum, row) => sum + row.monthPlan, 0);
      const monthPlan = areaRows.reduce((sum, row) => sum + row.monthTotalPlan, 0);
      const fact = areaRows.reduce((sum, row) => sum + reportMonthFact(row), 0);
      const percent = plan ? Math.round((fact / plan) * 100) : fact ? 100 : 0;
      const lag = Math.max(plan - fact, 0);
      const remainingDays = Math.max(Number(reportMonthEnd.slice(8, 10)) - Number(reportDate.slice(8, 10)), 0);
      const overPlanPerDay = remainingDays ? Math.ceil(lag / remainingDays) : lag;

      return {
        fact,
        lag,
        monthPlan,
        overPlanPerDay,
        percent,
        plan,
        remainingDays,
        title: areaName,
      };
    });
  }, [filteredReports, reportArea, reportAreas, reportDate, reportMonthEnd]);
  const allPtoDateRows = useMemo(() => [...ptoPlanRows, ...ptoSurveyRows, ...ptoOperRows], [ptoOperRows, ptoPlanRows, ptoSurveyRows]);
  const ptoYearTabs = useMemo(() => ptoYearOptions(allPtoDateRows, ptoPlanYear, ptoManualYears), [allPtoDateRows, ptoManualYears, ptoPlanYear]);
  const ptoYearMonths = useMemo(() => yearMonths(ptoPlanYear), [ptoPlanYear]);
  const ptoMonthGroups = useMemo(() => (
    ptoYearMonths.map((month) => ({
      month,
      label: formatMonthName(month),
      days: monthDays(month),
      expanded: expandedPtoMonths[month] === true,
    }))
  ), [expandedPtoMonths, ptoYearMonths]);
  const ptoAreaTabs = useMemo(() => ["Все участки", ...uniqueSorted(allPtoDateRows.map((row) => cleanAreaName(row.area)))], [allPtoDateRows]);

  const filteredDispatch = useMemo(() => {
    return vehicleRows.filter((v) => {
      if (v.visible === false) return false;
      const areaOk = areaFilter === "Все участки" || v.area === areaFilter;
      const q = search.trim().toLowerCase();
      const textOk = q === "" || [buildVehicleDisplayName(v), v.area, v.location, v.workType, v.excavator].join(" ").toLowerCase().includes(q);
      return areaOk && textOk;
    });
  }, [areaFilter, search, vehicleRows]);

  const filteredFleet = useMemo(() => {
    return vehicleRows.filter((v) => {
      if (v.visible === false) return false;
      switch (fleetTab) {
        case "rent":
          return v.rent > 0;
        case "work":
          return v.work > 0;
        case "idle":
          return v.downtime > 0;
        case "repair":
          return v.repair > 0;
        case "free":
          return !v.active || (v.work === 0 && v.rent === 0 && v.repair === 0 && v.downtime === 0);
        default:
          return true;
      }
    });
  }, [fleetTab, vehicleRows]);

  const activeCustomTab = customTabs.find((tab) => tab.visible !== false && customTabKey(tab.id) === topTab);
  const activeDispatchSubtab = subTabs.dispatch.find((tab) => tab.value === dispatchTab);
  const activeFleetSubtab = subTabs.fleet.find((tab) => tab.value === fleetTab);
  const activeContractorSubtab = subTabs.contractors.find((tab) => tab.value === contractorTab);
  const activeFuelSubtab = subTabs.fuel.find((tab) => tab.value === fuelTab);
  const activePtoSubtab = subTabs.pto.find((tab) => tab.value === ptoTab);
  const activeTbSubtab = subTabs.tb.find((tab) => tab.value === tbTab);
  const isPtoDateTab = ["plan", "oper", "survey"].includes(ptoTab);

  function selectTopTab(tab: TopTab) {
    setTopTab(tab);
    requestPtoDatabaseSave();
  }

  function selectPtoTab(tab: string) {
    setPtoTab(tab);
    requestPtoDatabaseSave();
  }

  function selectPtoPlanYear(year: string) {
    setPtoPlanYear(year);
    requestPtoDatabaseSave();
  }

  function selectPtoArea(area: string) {
    setPtoAreaFilter(area);
    requestPtoDatabaseSave();
  }

  function selectReportDate(value: string) {
    setReportDate(value);
    requestPtoDatabaseSave();
  }

  function startPtoColumnResize(event: React.MouseEvent<HTMLElement>, key: string, width: number) {
    event.preventDefault();
    event.stopPropagation();
    ptoResizeStateRef.current = { type: "column", key, startX: event.clientX, startWidth: width };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function startPtoRowResize(event: React.MouseEvent<HTMLElement>, key: string) {
    event.preventDefault();
    event.stopPropagation();
    const rowElement = event.currentTarget.closest("tr");
    const startHeight = rowElement?.getBoundingClientRect().height ?? ptoRowHeights[key] ?? 34;

    ptoResizeStateRef.current = { type: "row", key, startY: event.clientY, startHeight };
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }

  function ptoHeaderLabel(key: string, fallback: string) {
    return ptoHeaderLabels[key]?.trim() || fallback;
  }

  function startPtoHeaderEdit(key: string, fallback: string) {
    setEditingPtoHeaderKey(key);
    setPtoHeaderDraft(ptoHeaderLabel(key, fallback));
  }

  function cancelPtoHeaderEdit() {
    setEditingPtoHeaderKey(null);
    setPtoHeaderDraft("");
  }

  function commitPtoHeaderEdit(key: string, fallback: string) {
    const nextLabel = ptoHeaderDraft.trim();

    setPtoHeaderLabels((current) => {
      const next = { ...current };
      if (!nextLabel || nextLabel === fallback) {
        delete next[key];
      } else {
        next[key] = nextLabel;
      }
      return next;
    });
    setEditingPtoHeaderKey(null);
    setPtoHeaderDraft("");
    requestPtoDatabaseSave();
  }

  function updateReportForm(field: keyof ReportRow, value: string) {
    const textFields: Array<keyof ReportRow> = ["area", "name", "unit", "dayReason", "yearReason"];
    setReportForm((current) => ({
      ...current,
      [field]: textFields.includes(field) ? value : Number(value),
    }));
  }

  function addReportRow() {
    if (!reportForm.name.trim()) return;
    setReportRows((current) => [...current, normalizeReportRow({ ...reportForm, name: reportForm.name.trim() })]);
    setReportForm(defaultReportForm);
  }

  function removeReportRow(index: number) {
    setReportRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  function updateReportRow(index: number, field: keyof ReportRow, value: string) {
    const textFields: Array<keyof ReportRow> = ["area", "name", "unit", "dayReason", "yearReason"];
    setReportRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, [field]: textFields.includes(field) ? value : Number(value) }
          : row,
      ),
    );
  }

  function createEmptyPtoDateRow(status: PtoStatus, id = createId(), overrides: Partial<PtoPlanRow> = {}): PtoPlanRow {
    return {
      id,
      area: overrides.area ?? (ptoAreaFilter === "Все участки" ? "" : `Уч_${ptoAreaFilter}`),
      location: overrides.location ?? "",
      structure: overrides.structure ?? "",
      unit: normalizePtoUnit(overrides.unit),
      coefficient: Number(overrides.coefficient ?? 0),
      status,
      carryover: Number(overrides.carryover ?? 0),
      carryovers: overrides.carryovers,
      carryoverManualYears: overrides.carryoverManualYears,
      dailyPlans: overrides.dailyPlans ?? {},
      years: uniqueSorted([...(overrides.years ?? []), ptoPlanYear]),
    };
  }

  function insertPtoRowAfter(current: PtoPlanRow[], targetRow: PtoPlanRow | undefined, nextRow: PtoPlanRow) {
    if (!targetRow) return [...current, nextRow];

    const targetSignature = ptoLinkedRowSignature(targetRow);
    const targetIndex = current.findIndex((row) => ptoLinkedRowMatches(row, targetRow.id, targetSignature));
    if (targetIndex < 0) return [...current, nextRow];

    return [
      ...current.slice(0, targetIndex + 1),
      nextRow,
      ...current.slice(targetIndex + 1),
    ];
  }

  function addLinkedPtoDateRow(overrides: Partial<PtoPlanRow> = {}, insertAfterRow?: PtoPlanRow) {
    const id = createId();
    const sharedOverrides = {
      area: overrides.area,
      location: overrides.location,
      structure: overrides.structure,
      unit: overrides.unit,
      coefficient: overrides.coefficient,
      years: overrides.years,
    };
    const planRow = createEmptyPtoDateRow("Новая", id, ptoTab === "plan" ? overrides : sharedOverrides);
    const operRow = createEmptyPtoDateRow("Новая", id, ptoTab === "oper" ? overrides : sharedOverrides);
    const surveyRow = createEmptyPtoDateRow("Новая", id, ptoTab === "survey" ? overrides : sharedOverrides);

    setPtoPlanRows((current) => insertPtoRowAfter(current, insertAfterRow, planRow));
    setPtoOperRows((current) => insertPtoRowAfter(current, insertAfterRow, operRow));
    setPtoSurveyRows((current) => insertPtoRowAfter(current, insertAfterRow, surveyRow));
    requestPtoDatabaseSave();

    return id;
  }

  function addPtoYear() {
    const nextYear = normalizePtoYearValue(ptoYearInput);
    if (!nextYear) return;

    setPtoPlanYear(nextYear);
    setPtoManualYears((current) => uniqueSorted([...current, nextYear]));
    setExpandedPtoMonths((current) => ({ ...current, [`${nextYear}-01`]: true }));
    setPtoYearDialogOpen(false);
    setPtoYearInput("");
    requestPtoDatabaseSave();
  }

  function deletePtoYear() {
    const year = normalizePtoYearValue(ptoPlanYear);
    if (!year) return;

    const confirmed = window.confirm(`Вы точно хотите удалить ${year} год? Все данные ПТО за этот год в Плане, Оперучете и Замере будут удалены.`);
    if (!confirmed) return;

    const fallbackYear = ptoYearTabs.find((item) => item !== year) ?? String(Number(year) - 1);

    setPtoPlanRows((current) => removeYearFromPtoRows(current, year));
    setPtoOperRows((current) => removeYearFromPtoRows(current, year));
    setPtoSurveyRows((current) => removeYearFromPtoRows(current, year));
    setPtoManualYears((current) => uniqueSorted([...current.filter((item) => item !== year), fallbackYear]));
    setPtoPlanYear(fallbackYear);
    setPtoYearInput("");
    setPtoYearDialogOpen(false);
    requestPtoDatabaseSave();
  }

  function updatePtoDateRow(setRows: React.Dispatch<React.SetStateAction<PtoPlanRow[]>>, id: string, field: keyof Omit<PtoPlanRow, "id" | "dailyPlans">, value: string) {
    const numericFields: Array<keyof PtoPlanRow> = ["coefficient", "carryover"];
    const sharedFields: Array<keyof Omit<PtoPlanRow, "id" | "dailyPlans">> = ["area", "location", "structure", "unit", "coefficient"];
    const updatedValue = numericFields.includes(field) ? parseDecimalValue(value) : value;
    const linkedRow = [...ptoPlanRows, ...ptoOperRows, ...ptoSurveyRows].find((row) => row.id === id);
    const linkedSignature = linkedRow ? ptoLinkedRowSignature(linkedRow) : "";

    if (field === "carryover") {
      setRows((current) =>
        current.map((row) => {
          if (row.id !== id) return row;

          return {
            ...row,
            carryover: Number(updatedValue),
            carryovers: {
              ...(row.carryovers ?? {}),
              [ptoPlanYear]: Number(updatedValue),
            },
            carryoverManualYears: uniqueSorted([...(row.carryoverManualYears ?? []), ptoPlanYear]),
            years: uniqueSorted([...(row.years ?? []), ptoPlanYear]),
          };
        }),
      );
      return;
    }

    if (sharedFields.includes(field)) {
      const updateLinkedRows = (current: PtoPlanRow[]) =>
        current.map((row) =>
          ptoLinkedRowMatches(row, id, linkedSignature)
            ? { ...row, [field]: updatedValue }
            : row,
        );

      setPtoPlanRows(updateLinkedRows);
      setPtoOperRows(updateLinkedRows);
      setPtoSurveyRows(updateLinkedRows);
      return;
    }

    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: updatedValue } : row)),
    );
  }

  function clearPtoCarryoverOverride(setRows: React.Dispatch<React.SetStateAction<PtoPlanRow[]>>, id: string, year: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;

        const carryovers = { ...(row.carryovers ?? {}) };
        delete carryovers[year];

        return {
          ...row,
          carryover: year === defaultPtoPlanMonth.slice(0, 4) ? 0 : row.carryover,
          carryovers,
          carryoverManualYears: (row.carryoverManualYears ?? []).filter((rowYear) => rowYear !== year),
        };
      }),
    );
  }

  function updatePtoDateDay(setRows: React.Dispatch<React.SetStateAction<PtoPlanRow[]>>, id: string, day: string, value: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;

        const dailyPlans = { ...row.dailyPlans };
        const year = day.slice(0, 4);
        if (value.trim() === "") {
          delete dailyPlans[day];
        } else {
          dailyPlans[day] = parseDecimalValue(value);
        }

        return {
          ...row,
          dailyPlans,
          years: uniqueSorted([...(row.years ?? []), year]),
        };
      }),
    );
  }

  function updatePtoMonthTotal(setRows: React.Dispatch<React.SetStateAction<PtoPlanRow[]>>, id: string, days: string[], value: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;

        const nextDailyPlans = { ...row.dailyPlans };
        days.forEach((day) => {
          delete nextDailyPlans[day];
        });

        if (value.trim()) {
          Object.assign(nextDailyPlans, distributeMonthlyTotal(parseDecimalValue(value), days));
        }

        return {
          ...row,
          dailyPlans: nextDailyPlans,
          years: days[0] ? uniqueSorted([...(row.years ?? []), days[0].slice(0, 4)]) : row.years,
        };
      }),
    );
  }

  function removeLinkedPtoDateRow(row: PtoPlanRow) {
    const rowName = [cleanAreaName(row.area), row.structure].filter(Boolean).join(" / ") || "строку ПТО";
    const confirmed = window.confirm(`Вы точно хотите удалить ${rowName}? Строка удалится из Плана, Оперучета и Замера.`);
    if (!confirmed) return;

    const signature = ptoLinkedRowSignature(row);
    const removeRow = (current: PtoPlanRow[]) => current.filter((item) => !ptoLinkedRowMatches(item, row.id, signature));

    setPtoPlanRows(removeRow);
    setPtoOperRows(removeRow);
    setPtoSurveyRows(removeRow);
    requestPtoDatabaseSave();
  }

  function getPtoDropPosition(event: React.DragEvent<HTMLTableRowElement>): PtoDropPosition {
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientY - bounds.top > bounds.height / 2 ? "after" : "before";
  }

  function moveLinkedPtoDateRow(sourceId: string, targetId: string, visibleRows: PtoPlanRow[], position: PtoDropPosition) {
    const sourceRow = visibleRows.find((row) => row.id === sourceId);
    const targetRow = visibleRows.find((row) => row.id === targetId);
    if (!sourceRow || !targetRow) return;

    const sourceSignature = ptoLinkedRowSignature(sourceRow);
    const targetSignature = ptoLinkedRowSignature(targetRow);
    const reorderRows = (current: PtoPlanRow[]) => reorderPtoRows(current, sourceRow.id, sourceSignature, targetRow.id, targetSignature, position);

    setPtoPlanRows(reorderRows);
    setPtoOperRows(reorderRows);
    setPtoSurveyRows(reorderRows);
    requestPtoDatabaseSave();
  }

  function addCustomTab() {
    const title = customTabForm.title.trim();
    if (!title) return;

    const nextTab: CustomTab = {
      id: createId(),
      title,
      description: customTabForm.description.trim(),
      items: [],
      visible: true,
    };

    setCustomTabs((current) => [...current, nextTab]);
    setCustomTabForm(defaultCustomTabForm);
    setCustomInfoTabId(nextTab.id);
    setTopTab(customTabKey(nextTab.id));
  }

  function addCustomInfo() {
    const text = customInfoForm.trim();
    if (!text || !customInfoTabId) return;

    setCustomTabs((current) =>
      current.map((tab) =>
        tab.id === customInfoTabId ? { ...tab, items: [...tab.items, text] } : tab,
      ),
    );
    setCustomInfoForm("");
  }

  function updateCustomInfo(tabId: string, itemIndex: number, value: string) {
    setCustomTabs((current) =>
      current.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              items: tab.items.map((item, index) => (index === itemIndex ? value : item)),
            }
          : tab,
      ),
    );
  }

  function deleteCustomInfo(tabId: string, itemIndex: number) {
    setCustomTabs((current) =>
      current.map((tab) =>
        tab.id === tabId
          ? { ...tab, items: tab.items.filter((_, index) => index !== itemIndex) }
          : tab,
      ),
    );
  }

  function updateTopTabLabel(id: BaseTopTab, label: string) {
    setTopTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, label } : tab)),
    );
  }

  function hideTopTab(id: BaseTopTab) {
    if (id === "admin") return;

    setTopTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, visible: false } : tab)),
    );

    if (topTab === id) {
      setTopTab("admin");
    }
  }

  function showTopTab(id: BaseTopTab) {
    setTopTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, visible: true } : tab)),
    );
  }

  function updateCustomTab(id: string, patch: Partial<CustomTab>) {
    setCustomTabs((current) =>
      current.map((tab) => (tab.id === id ? { ...tab, ...patch } : tab)),
    );
  }

  function deleteCustomTab(id: string) {
    setCustomTabs((current) => current.filter((tab) => tab.id !== id));
    if (topTab === customTabKey(id)) {
      setTopTab("admin");
    }
  }

  function updateSubTabLabel(group: EditableSubtabGroup, id: string, label: string) {
    const currentTab = subTabs[group].find((tab) => tab.id === id);

    setSubTabs((current) => ({
      ...current,
      [group]: current[group].map((tab) =>
        tab.id === id
          ? { ...tab, label, value: group === "reports" && tab.value !== "Все участки" ? label : tab.value }
          : tab,
      ),
    }));

    if (group === "reports" && currentTab && currentTab.value !== "Все участки") {
      setReportRows((current) =>
        current.map((row) => (row.area === currentTab.value ? { ...row, area: label } : row)),
      );
      setReportForm((current) =>
        current.area === currentTab.value ? { ...current, area: label } : current,
      );
      if (reportArea === currentTab.value) {
        setReportArea(label);
      }
    }
  }

  function updateSubTabContent(group: EditableSubtabGroup, id: string, content: string) {
    setSubTabs((current) => ({
      ...current,
      [group]: current[group].map((tab) => (tab.id === id ? { ...tab, content } : tab)),
    }));
  }

  function addSubTab() {
    const label = newSubTabForm.label.trim();
    if (!label) return;

    const id = createId();
    const nextTab: SubTabConfig = {
      id,
      label,
      value: newSubTabForm.group === "reports" ? label : `custom:${id}`,
      visible: true,
      content: newSubTabForm.content.trim(),
    };

    setSubTabs((current) => ({
      ...current,
      [newSubTabForm.group]: [...current[newSubTabForm.group], nextTab],
    }));
    setNewSubTabForm({ group: "reports", label: "", content: "" });
  }

  function removeSubTab(group: EditableSubtabGroup, id: string) {
    const removedTab = subTabs[group].find((tab) => tab.id === id);
    if (!removedTab) return;

    setSubTabs((current) => ({
      ...current,
      [group]: removedTab.builtIn
        ? current[group].map((tab) => (tab.id === id ? { ...tab, visible: false } : tab))
        : current[group].filter((tab) => tab.id !== id),
    }));

    if (group === "reports" && reportArea === removedTab.value) setReportArea("Все участки");
    if (group === "dispatch" && dispatchTab === removedTab.value) setDispatchTab("daily");
    if (group === "fleet" && fleetTab === removedTab.value) setFleetTab("all");
    if (group === "contractors" && contractorTab === removedTab.value) setContractorTab("AA Mining");
    if (group === "fuel" && fuelTab === removedTab.value) setFuelTab("general");
    if (group === "pto" && ptoTab === removedTab.value) setPtoTab("bodies");
    if (group === "tb" && tbTab === removedTab.value) setTbTab("list");
  }

  function showSubTab(group: EditableSubtabGroup, id: string) {
    setSubTabs((current) => ({
      ...current,
      [group]: current[group].map((tab) => (tab.id === id ? { ...tab, visible: true } : tab)),
    }));
  }

  function addQuickSubTab(group: EditableSubtabGroup) {
    const id = createId();
    const label = "Новая подвкладка";
    const nextTab: SubTabConfig = {
      id,
      label,
      value: group === "reports" ? label : `custom:${id}`,
      visible: true,
      content: "",
    };

    setSubTabs((current) => ({
      ...current,
      [group]: [...current[group], nextTab],
    }));
    setEditingSubTabId(id);
  }

  function updateOrgMember(id: string, field: keyof OrgMember, value: string | boolean) {
    setOrgMembers((current) =>
      current.map((member) =>
        member.id === id
          ? {
              ...member,
              [field]: value,
            }
          : member,
      ),
    );
  }

  function updateOrgMemberForm(field: keyof OrgMember, value: string | boolean) {
    setOrgMemberForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addOrgMember() {
    const name = orgMemberForm.name.trim();
    const position = orgMemberForm.position.trim();
    if (!name && !position) return;

    const nextMember: OrgMember = {
      ...orgMemberForm,
      id: createId(),
      name: name || position,
      position,
      department: orgMemberForm.department.trim(),
      area: orgMemberForm.area.trim(),
    };

    setOrgMembers((current) => [...current, nextMember]);
    setOrgMemberForm(defaultOrgMemberForm);
    setEditingOrgMemberId(nextMember.id);
  }

  function deleteOrgMember(id: string) {
    setOrgMembers((current) =>
      current
        .filter((member) => member.id !== id)
        .map((member) => ({
          ...member,
          linearManagerId: member.linearManagerId === id ? "" : member.linearManagerId,
          functionalManagerId: member.functionalManagerId === id ? "" : member.functionalManagerId,
        })),
    );
    setEditingOrgMemberId((current) => (current === id ? null : current));
  }

  function updateDependencyNode(id: string, field: keyof DependencyNode, value: string | boolean) {
    setDependencyNodes((current) =>
      current.map((node) => (node.id === id ? { ...node, [field]: value } : node)),
    );
  }

  function updateDependencyNodeForm(field: keyof DependencyNode, value: string | boolean) {
    setDependencyNodeForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addDependencyNode() {
    const name = dependencyNodeForm.name.trim();
    if (!name) return;

    const nextNode: DependencyNode = {
      ...dependencyNodeForm,
      id: createId(),
      name,
      kind: dependencyNodeForm.kind.trim(),
      owner: dependencyNodeForm.owner.trim(),
      visible: true,
    };

    setDependencyNodes((current) => [...current, nextNode]);
    setDependencyNodeForm(defaultDependencyNodeForm);
    setEditingDependencyNodeId(nextNode.id);
    setDependencyLinkForm((current) => ({
      ...current,
      toNodeId: nextNode.id,
    }));
  }

  function deleteDependencyNode(id: string) {
    setDependencyNodes((current) => current.filter((node) => node.id !== id));
    setDependencyLinks((current) => current.filter((link) => link.fromNodeId !== id && link.toNodeId !== id));
    setEditingDependencyNodeId((current) => (current === id ? null : current));
    setEditingDependencyLinkId(null);
  }

  function updateDependencyLink(id: string, field: keyof DependencyLink, value: string | boolean) {
    setDependencyLinks((current) =>
      current.map((link) =>
        link.id === id
          ? {
              ...link,
              [field]: value,
            }
          : link,
      ),
    );
  }

  function updateDependencyLinkForm(field: keyof DependencyLink, value: string | boolean) {
    setDependencyLinkForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addDependencyLink() {
    if (!dependencyLinkForm.fromNodeId || !dependencyLinkForm.toNodeId) return;

    const nextLink: DependencyLink = {
      ...dependencyLinkForm,
      id: createId(),
      rule: dependencyLinkForm.rule.trim(),
      owner: dependencyLinkForm.owner.trim(),
      visible: true,
    };

    setDependencyLinks((current) => [...current, nextLink]);
    setDependencyLinkForm((current) => ({
      ...defaultDependencyLinkForm,
      fromNodeId: current.fromNodeId,
      toNodeId: current.toNodeId,
    }));
    setEditingDependencyLinkId(nextLink.id);
  }

  function deleteDependencyLink(id: string) {
    setDependencyLinks((current) => current.filter((link) => link.id !== id));
    setEditingDependencyLinkId((current) => (current === id ? null : current));
  }

  function getSubTabGroup(id: BaseTopTab): EditableSubtabGroup | null {
    return id in subTabs ? (id as EditableSubtabGroup) : null;
  }

  function restoreDefaultNavigation() {
    setTopTabs(defaultTopTabs);
    setSubTabs(defaultSubTabs);
  }

  function openNewVehicleCard() {
    const nextId = Math.max(0, ...vehicleRows.map((vehicle) => vehicle.id)) + 1;
    setVehicleCard({ ...defaultVehicleForm, id: nextId });
  }

  function openVehicleCard(vehicle: VehicleRow) {
    setVehicleCard({ ...defaultVehicleForm, ...vehicle, visible: vehicle.visible !== false });
  }

  function updateVehicleCard(field: keyof VehicleRow, value: string | boolean) {
    setVehicleCard((current) => {
      if (!current) return current;

      const numericFields: Array<keyof VehicleRow> = [
        "id",
        "work",
        "rent",
        "repair",
        "downtime",
        "trips",
        "fuelNormWinter",
        "fuelNormSummer",
      ];

      return {
        ...current,
        [field]: numericFields.includes(field) ? Number(value) : value,
      };
    });
  }

  function saveVehicleCard() {
    if (!vehicleCard) return;

    const nextVehicle: VehicleRow = {
      ...vehicleCard,
      brand: vehicleCard.brand.trim(),
      model: vehicleCard.model.trim(),
      plateNumber: vehicleCard.plateNumber.trim(),
      garageNumber: vehicleCard.garageNumber.trim(),
      vehicleType: vehicleCard.vehicleType.trim(),
      vin: vehicleCard.vin.trim(),
      owner: vehicleCard.owner.trim(),
      contractor: vehicleCard.contractor?.trim(),
    };
    nextVehicle.name = buildVehicleDisplayName(nextVehicle);

    if (nextVehicle.name === "Без названия") return;

    setVehicleRows((current) => {
      const exists = current.some((vehicle) => vehicle.id === nextVehicle.id);
      return exists
        ? current.map((vehicle) => (vehicle.id === nextVehicle.id ? nextVehicle : vehicle))
        : [...current, nextVehicle];
    });
    setVehicleCard(null);
  }

  function toggleVehicleVisibility(id: number) {
    setVehicleRows((current) =>
      current.map((vehicle) =>
        vehicle.id === id ? { ...vehicle, visible: vehicle.visible === false } : vehicle,
      ),
    );
  }

  function deleteVehicle(id: number) {
    setVehicleRows((current) => current.filter((vehicle) => vehicle.id !== id));
    setVehicleCard((current) => (current?.id === id ? null : current));
  }

  function exportVehiclesToExcel() {
    const headers = [
      "Отображаемое имя",
      "Марка",
      "Модель",
      "Госномер",
      "Гаражный номер",
      "Вид техники",
      "Норма расхода: Зима",
      "Норма расхода: Лето",
      "Расчет расхода",
      "VIN",
      "Собственник",
      "Отображение",
    ];
    const rows = vehicleRows.map((vehicle) => [
      buildVehicleDisplayName(vehicle),
      vehicle.brand,
      vehicle.model,
      vehicle.plateNumber,
      vehicle.garageNumber,
      vehicle.vehicleType,
      vehicle.fuelNormWinter,
      vehicle.fuelNormSummer,
      vehicle.fuelCalcType,
      vehicle.vin,
      vehicle.owner,
      vehicle.visible === false ? "Скрыта" : "Показывается",
    ]);
    const tableRows = [headers, ...rows]
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeExcelCell(cell)}</td>`).join("")}</tr>`)
      .join("");
    const html = `<html><head><meta charset="utf-8" /></head><body><table>${tableRows}</table></body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "spisok-tehniki.xls";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function renderPtoDateTable(
    rows: PtoPlanRow[],
    setRows: React.Dispatch<React.SetStateAction<PtoPlanRow[]>>,
    options: { showLocation?: boolean; editableMonthTotal?: boolean } = {},
  ) {
    const showLocation = options.showLocation !== false;
    const editableMonthTotal = options.editableMonthTotal === true;
    const filteredRows = rows.filter((row) => ptoAreaMatches(row.area, ptoAreaFilter) && ptoRowHasYear(row, ptoPlanYear));
    const carryoverHeader = `Остатки ${previousPtoYearLabel(ptoPlanYear)}`;
    const columnWidth = (key: string, fallback: number) => Math.min(800, Math.max(44, Math.round(ptoColumnWidths[key] ?? fallback)));
    const baseColumns: PtoTableColumn[] = [
      { key: "area", width: columnWidth("area", ptoColumnDefaults.area) },
      ...(showLocation ? [{ key: "location", width: columnWidth("location", ptoColumnDefaults.location) }] : []),
      { key: "structure", width: columnWidth("structure", ptoColumnDefaults.structure) },
      { key: "unit", width: columnWidth("unit", ptoColumnDefaults.unit) },
      { key: "coefficient", width: columnWidth("coefficient", ptoColumnDefaults.coefficient) },
      { key: "status", width: columnWidth("status", ptoColumnDefaults.status) },
      { key: `carryover:${ptoPlanYear}`, width: columnWidth(`carryover:${ptoPlanYear}`, ptoColumnDefaults.carryover) },
      { key: "year-total", width: columnWidth("year-total", ptoColumnDefaults.yearTotal) },
    ];
    const dateColumns = ptoMonthGroups.flatMap((group) => [
      { key: `month-total:${group.month}`, width: columnWidth(`month-total:${group.month}`, ptoColumnDefaults.monthTotal) },
      ...(group.expanded ? group.days.map((day) => ({ key: `day:${day}`, width: columnWidth(`day:${day}`, ptoColumnDefaults.day) })) : []),
    ]);
    const actionColumn = { key: "actions", width: columnWidth("actions", ptoColumnDefaults.actions) };
    const tableColumns = [...baseColumns, ...dateColumns, actionColumn];
    const tableMinWidth = tableColumns.reduce((sum, column) => sum + column.width, 0);
    const columnWidthByKey = new Map(tableColumns.map((column) => [column.key, column.width]));
    const activeFormulaCell = ptoFormulaCell?.table === ptoTab && ptoFormulaCell.year === ptoPlanYear ? ptoFormulaCell : null;
    const activeInlineEditCell = ptoInlineEditCell?.table === ptoTab && ptoInlineEditCell.year === ptoPlanYear ? ptoInlineEditCell : null;
    const activeFormulaRow = activeFormulaCell ? rows.find((row) => row.id === activeFormulaCell.rowId) : undefined;
    const activeFormulaValue = activeFormulaRow && activeFormulaCell
      ? activeFormulaCell.kind === "coefficient"
        ? activeFormulaRow.coefficient
        : activeFormulaCell.kind === "carryover"
          ? ptoEffectiveCarryover(activeFormulaRow, ptoPlanYear, rows)
          : activeFormulaCell.kind === "month" && activeFormulaCell.month
            ? ptoMonthTotal(activeFormulaRow, activeFormulaCell.month)
            : activeFormulaCell.kind === "day" && activeFormulaCell.day
              ? activeFormulaRow.dailyPlans[activeFormulaCell.day]
              : undefined
      : undefined;
    const formulaInputDisabled = !activeFormulaCell || !activeFormulaRow || activeFormulaCell.editable === false;
    const formulaCellRows = filteredRows.map((row) => {
      const cells: Array<Omit<PtoFormulaCell, "table" | "year">> = [
        { rowId: row.id, kind: "coefficient", label: "Коэфф." },
        { rowId: row.id, kind: "carryover", label: carryoverHeader },
        ...ptoMonthGroups.flatMap((group) => [
          ...(editableMonthTotal
            ? [{
                rowId: row.id,
                kind: "month" as const,
                month: group.month,
                days: group.days,
                label: group.label,
                editable: true,
              }]
            : []),
          ...(group.expanded
            ? group.days.map((day) => ({
                rowId: row.id,
                kind: "day" as const,
                day,
                label: `${day.slice(8, 10)}.${day.slice(5, 7)}`,
              }))
            : []),
        ]),
      ];

      return { row, cells };
    });

    const formulaCellKey = (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => `${cell.rowId}:${cell.kind}:${cell.month ?? cell.day ?? ""}`;
    const formulaCellDomKey = (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => `${ptoTab}:${ptoPlanYear}:${formulaCellKey(cell)}`;
    const formulaSelectionKey = (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => formulaCellDomKey(cell);
    const formulaSelectionScope = `${ptoTab}:${ptoPlanYear}:`;
    const selectedFormulaCellKeys = new Set(ptoSelectedCellKeys.filter((key) => key.startsWith(formulaSelectionScope)));
    const arrowKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    const getFormulaCellValue = (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => {
      const row = rows.find((item) => item.id === cell.rowId);
      if (!row) return undefined;

      if (cell.kind === "coefficient") return row.coefficient;
      if (cell.kind === "carryover") return ptoEffectiveCarryover(row, ptoPlanYear, rows);
      if (cell.kind === "month" && cell.month) return ptoMonthTotal(row, cell.month);
      if (cell.kind === "day" && cell.day) return row.dailyPlans[cell.day];
      return undefined;
    };

    const focusFormulaCell = (cell: Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">) => {
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLInputElement>(`[data-pto-cell-key="${formulaCellDomKey(cell)}"]`)?.focus();
      });
    };

    const formulaRangeKeys = (anchor: PtoFormulaCell, target: PtoFormulaCell) => {
      const anchorRowIndex = formulaCellRows.findIndex((row) => row.cells.some((cell) => formulaCellKey(cell) === formulaCellKey(anchor)));
      const targetRowIndex = formulaCellRows.findIndex((row) => row.cells.some((cell) => formulaCellKey(cell) === formulaCellKey(target)));
      if (anchorRowIndex < 0 || targetRowIndex < 0) return [formulaSelectionKey(target)];

      const anchorColumnIndex = formulaCellRows[anchorRowIndex].cells.findIndex((cell) => formulaCellKey(cell) === formulaCellKey(anchor));
      const targetColumnIndex = formulaCellRows[targetRowIndex].cells.findIndex((cell) => formulaCellKey(cell) === formulaCellKey(target));
      if (anchorColumnIndex < 0 || targetColumnIndex < 0) return [formulaSelectionKey(target)];

      const rowStart = Math.min(anchorRowIndex, targetRowIndex);
      const rowEnd = Math.max(anchorRowIndex, targetRowIndex);
      const columnStart = Math.min(anchorColumnIndex, targetColumnIndex);
      const columnEnd = Math.max(anchorColumnIndex, targetColumnIndex);

      return formulaCellRows
        .slice(rowStart, rowEnd + 1)
        .flatMap((row) => row.cells.slice(columnStart, columnEnd + 1).map((cell) => formulaSelectionKey(cell)));
    };

    const selectFormulaCell = (cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined) => {
      const nextCell = { ...cell, table: ptoTab, year: ptoPlanYear };
      setPtoFormulaCell(nextCell);
      setPtoFormulaDraft(formatPtoFormulaNumber(value));
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoSelectionAnchorCell(nextCell);
      setPtoSelectedCellKeys([formulaSelectionKey(nextCell)]);
      requestPtoDatabaseSave();
    };

    const selectFormulaRange = (cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined) => {
      const targetCell = { ...cell, table: ptoTab, year: ptoPlanYear };
      const anchorCell = ptoSelectionAnchorCell?.table === ptoTab && ptoSelectionAnchorCell.year === ptoPlanYear
        ? ptoSelectionAnchorCell
        : targetCell;

      setPtoFormulaCell(targetCell);
      setPtoFormulaDraft(formatPtoFormulaNumber(value));
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoSelectionAnchorCell(anchorCell);
      setPtoSelectedCellKeys(formulaRangeKeys(anchorCell, targetCell));
      requestPtoDatabaseSave();
    };

    const toggleFormulaCell = (cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined) => {
      const targetCell = { ...cell, table: ptoTab, year: ptoPlanYear };
      const targetKey = formulaSelectionKey(targetCell);
      const selectionScope = `${ptoTab}:${ptoPlanYear}:`;

      setPtoFormulaCell(targetCell);
      setPtoFormulaDraft(formatPtoFormulaNumber(value));
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoSelectionAnchorCell(targetCell);
      setPtoSelectedCellKeys((currentKeys) => {
        const scopedKeys = currentKeys.filter((key) => key.startsWith(selectionScope));
        const nextKeys = scopedKeys.includes(targetKey)
          ? scopedKeys.filter((key) => key !== targetKey)
          : [...scopedKeys, targetKey];

        return nextKeys.length ? nextKeys : [targetKey];
      });
      requestPtoDatabaseSave();
    };

    const startInlineFormulaEdit = (cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined, draftOverride?: string) => {
      const nextCell = { ...cell, table: ptoTab, year: ptoPlanYear };
      const draft = draftOverride ?? formatPtoFormulaNumber(value);
      setPtoFormulaCell(nextCell);
      setPtoInlineEditCell(nextCell);
      setPtoFormulaDraft(draft);
      setPtoInlineEditInitialDraft(draft);
    };

    const cancelInlineFormulaEdit = () => {
      setPtoFormulaDraft(ptoInlineEditInitialDraft);
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
    };

    const formulaCellMatches = (cell: PtoFormulaCell | null, rowId: string, kind: PtoFormulaCell["kind"], key?: string) => {
      if (!cell) return false;

      return cell.rowId === rowId
        && cell.kind === kind
        && cell.table === ptoTab
        && cell.year === ptoPlanYear
        && (kind === "month" ? cell.month === key : kind === "day" ? cell.day === key : true);
    };

    const formulaCellActive = (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => formulaCellMatches(activeFormulaCell, rowId, kind, key);
    const formulaCellEditing = (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => formulaCellMatches(activeInlineEditCell, rowId, kind, key);
    const formulaCellSelected = (rowId: string, kind: PtoFormulaCell["kind"], key?: string) => selectedFormulaCellKeys.has(formulaSelectionKey({
      rowId,
      kind,
      ...(kind === "month" ? { month: key } : kind === "day" ? { day: key } : {}),
    }));

    const commitFormulaCellValue = (cell: PtoFormulaCell, value: string) => {
      if (cell.editable === false) return false;
      if (value.trim() !== "" && parseDecimalInput(value) === null) return false;

      if (cell.kind === "coefficient") {
        updatePtoDateRow(setRows, cell.rowId, "coefficient", value);
        return true;
      }

      if (cell.kind === "carryover") {
        if (value.trim() === "") {
          clearPtoCarryoverOverride(setRows, cell.rowId, ptoPlanYear);
          return true;
        }

        updatePtoDateRow(setRows, cell.rowId, "carryover", value);
        return true;
      }

      if (cell.kind === "month" && cell.days) {
        updatePtoMonthTotal(setRows, cell.rowId, cell.days, value);
        return true;
      }

      if (cell.kind === "day" && cell.day) {
        updatePtoDateDay(setRows, cell.rowId, cell.day, value);
        return true;
      }

      return false;
    };

    const selectedFormulaCells = () => formulaCellRows
      .flatMap((row) => row.cells)
      .filter((formulaCell) => selectedFormulaCellKeys.has(formulaSelectionKey(formulaCell)));

    const clearSelectedFormulaCells = (fallbackCell: Omit<PtoFormulaCell, "table" | "year">) => {
      const cellsToClear = selectedFormulaCells();
      const targetCells = cellsToClear.length ? cellsToClear : [fallbackCell];
      let committed = false;

      targetCells.forEach((targetCell) => {
        committed = commitFormulaCellValue({ ...targetCell, table: ptoTab, year: ptoPlanYear }, "") || committed;
      });

      if (!committed) return false;

      const nextActiveCell = activeFormulaCell && targetCells.some((targetCell) => formulaCellKey(targetCell) === formulaCellKey(activeFormulaCell))
        ? activeFormulaCell
        : { ...targetCells[0], table: ptoTab, year: ptoPlanYear };

      setPtoFormulaCell(nextActiveCell);
      setPtoFormulaDraft("");
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoSelectionAnchorCell(nextActiveCell);
      setPtoSelectedCellKeys(targetCells.map((targetCell) => formulaSelectionKey(targetCell)));
      requestPtoDatabaseSave();
      return true;
    };

    const collapseFormulaSelection = (fallbackCell: Omit<PtoFormulaCell, "table" | "year">) => {
      const nextActiveCell = activeFormulaCell ?? { ...fallbackCell, table: ptoTab, year: ptoPlanYear };

      setPtoFormulaCell(nextActiveCell);
      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoSelectionAnchorCell(nextActiveCell);
      setPtoSelectedCellKeys([formulaSelectionKey(nextActiveCell)]);
    };

    const commitInlineFormulaEdit = () => {
      if (!activeInlineEditCell) return;
      const committed = commitFormulaCellValue(activeInlineEditCell, ptoFormulaDraft);
      if (!committed) return;

      setPtoInlineEditCell(null);
      setPtoInlineEditInitialDraft("");
      setPtoFormulaDraft(ptoFormulaDraft.trim() ? formatPtoFormulaNumber(parseDecimalValue(ptoFormulaDraft)) : "");
      requestPtoDatabaseSave();
    };

    const handleInlineFormulaKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitInlineFormulaEdit();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        cancelInlineFormulaEdit();
      }
    };

    const updateFormulaValue = (value: string) => {
      setPtoFormulaDraft(value);
      if (activeInlineEditCell) return;
      if (!activeFormulaCell || !activeFormulaRow || activeFormulaCell.editable === false) return;
      commitFormulaCellValue(activeFormulaCell, value);
    };

    const moveFormulaSelection = (key: string) => {
      if (!activeFormulaCell) return;

      const currentRowIndex = formulaCellRows.findIndex((row) => row.cells.some((cell) => formulaCellKey(cell) === formulaCellKey(activeFormulaCell)));
      if (currentRowIndex < 0) return;

      const currentCells = formulaCellRows[currentRowIndex].cells;
      const currentColumnIndex = currentCells.findIndex((cell) => formulaCellKey(cell) === formulaCellKey(activeFormulaCell));
      if (currentColumnIndex < 0) return;

      let nextCell: Omit<PtoFormulaCell, "table" | "year"> | undefined;
      if (key === "ArrowLeft") nextCell = currentCells[Math.max(currentColumnIndex - 1, 0)];
      if (key === "ArrowRight") nextCell = currentCells[Math.min(currentColumnIndex + 1, currentCells.length - 1)];
      if (key === "ArrowUp") {
        const nextRow = formulaCellRows[Math.max(currentRowIndex - 1, 0)];
        nextCell = nextRow?.cells[Math.min(currentColumnIndex, nextRow.cells.length - 1)];
      }
      if (key === "ArrowDown") {
        const nextRow = formulaCellRows[Math.min(currentRowIndex + 1, formulaCellRows.length - 1)];
        nextCell = nextRow?.cells[Math.min(currentColumnIndex, nextRow.cells.length - 1)];
      }

      if (!nextCell) return;
      selectFormulaCell(nextCell, getFormulaCellValue(nextCell));
      focusFormulaCell(nextCell);
    };

    const handleFormulaCellKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined, isEditing: boolean) => {
      if (isEditing) {
        if (arrowKeys.includes(event.key)) {
          event.preventDefault();
          if (!activeInlineEditCell) return;

          const committed = commitFormulaCellValue(activeInlineEditCell, ptoFormulaDraft);
          if (!committed) return;

          setPtoInlineEditCell(null);
          setPtoInlineEditInitialDraft("");
          moveFormulaSelection(event.key);
          requestPtoDatabaseSave();
          return;
        }

        handleInlineFormulaKeyDown(event);
        return;
      }

      if (arrowKeys.includes(event.key)) {
        event.preventDefault();
        moveFormulaSelection(event.key);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        collapseFormulaSelection(cell);
        return;
      }

      if (cell.editable === false) return;

      if (/^[0-9]$/.test(event.key) || event.key === "-" || event.key === "," || event.key === ".") {
        event.preventDefault();
        startInlineFormulaEdit(cell, value, event.key === "." || event.key === "," ? "0," : event.key);
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        clearSelectedFormulaCells(cell);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        startInlineFormulaEdit(cell, value);
      }
    };

    const handleFormulaCellMouseDown = (event: React.MouseEvent<HTMLElement>, cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined, isEditing: boolean) => {
      if (event.button !== 0 || isEditing) return;

      ptoSelectionDraggingRef.current = true;
      if (event.ctrlKey || event.metaKey) {
        toggleFormulaCell(cell, value);
      } else if (event.shiftKey) {
        selectFormulaRange(cell, value);
      } else {
        selectFormulaCell(cell, value);
      }
    };

    const handleFormulaCellMouseEnter = (event: React.MouseEvent<HTMLElement>, cell: Omit<PtoFormulaCell, "table" | "year">, value: number | undefined, isEditing: boolean) => {
      if (!ptoSelectionDraggingRef.current || event.buttons !== 1 || event.ctrlKey || event.metaKey || isEditing) return;
      selectFormulaRange(cell, value);
    };

    const addPtoRowAfter = (row: PtoPlanRow) => {
      const nextRowId = addLinkedPtoDateRow({
        area: row.area,
        location: row.location,
        unit: row.unit,
      }, row);
      setPtoPendingFieldFocus({ rowId: nextRowId, field: "structure" });
    };

    const commitPtoDraftField = (field: "area" | "location" | "structure" | "unit" | "coefficient", value: string) => {
      if (!value.trim()) return;
      if (field === "coefficient" && parseDecimalInput(value) === null) return;

      const nextRowId = addLinkedPtoDateRow({
        [field]: field === "unit" ? normalizePtoUnit(value) : field === "coefficient" ? parseDecimalValue(value) : value,
      });
      setPtoPendingFieldFocus({ rowId: nextRowId, field });
      requestPtoDatabaseSave();
    };

    const addPtoRowFromDraft = () => {
      const nextRowId = addLinkedPtoDateRow();
      setPtoPendingFieldFocus({ rowId: nextRowId, field: ptoAreaFilter === "Все участки" ? "area" : "structure" });
    };

    const renderPtoHeaderText = (key: string, fallback: string, align: React.CSSProperties["textAlign"] = "left") => {
      const isEditing = editingPtoHeaderKey === key;

      if (isEditing) {
        return (
          <input
            autoFocus
            value={ptoHeaderDraft}
            onChange={(event) => setPtoHeaderDraft(event.target.value)}
            onBlur={(event) => {
              if (event.currentTarget.dataset.cancelHeaderEdit === "true") return;
              commitPtoHeaderEdit(key, fallback);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitPtoHeaderEdit(key, fallback);
              }

              if (event.key === "Escape") {
                event.preventDefault();
                event.currentTarget.dataset.cancelHeaderEdit = "true";
                cancelPtoHeaderEdit();
              }
            }}
            onClick={(event) => event.stopPropagation()}
            style={{ ...ptoHeaderInputStyle, textAlign: align }}
          />
        );
      }

      return (
        <button
          type="button"
          onDoubleClick={(event) => {
            event.stopPropagation();
            startPtoHeaderEdit(key, fallback);
          }}
          style={{ ...ptoHeaderLabelButtonStyle, textAlign: align }}
          title="Двойной клик — переименовать заголовок"
        >
          {ptoHeaderLabel(key, fallback)}
        </button>
      );
    };

    const renderPtoMonthHeader = (month: string, fallback: string, expanded: boolean) => {
      const key = `month-group:${month}`;
      const isEditing = editingPtoHeaderKey === key;

      if (isEditing) {
        return renderPtoHeaderText(key, fallback);
      }

      return (
        <button
          type="button"
          onClick={() => {
            setExpandedPtoMonths((current) => ({ ...current, [month]: !current[month] }));
            requestPtoDatabaseSave();
          }}
          onDoubleClick={(event) => {
            event.stopPropagation();
            startPtoHeaderEdit(key, fallback);
          }}
          style={monthToggleStyle}
          title="Клик — свернуть/развернуть, двойной клик — переименовать"
        >
          {expanded ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
          {ptoHeaderLabel(key, fallback)}
        </button>
      );
    };

    return (
      <div style={ptoDateTableLayoutStyle}>
        <div style={ptoToolbarStyle}>
          <div style={ptoToolbarBlockStyle}>
            <span style={fieldLabelStyle}>Участки</span>
            <div style={ptoToolbarRowStyle}>
              {ptoAreaTabs.map((area) => (
                <TopButton key={area} active={ptoAreaFilter === area} onClick={() => selectPtoArea(area)} label={area} />
              ))}
            </div>
          </div>

          <div style={{ ...ptoToolbarBlockStyle, justifySelf: "end", alignItems: "end" }}>
            <span style={fieldLabelStyle}>Годы</span>
            <div style={ptoToolbarRowStyle}>
              <IconButton label="Удалить выбранный год" onClick={deletePtoYear}>
                <span aria-hidden>−</span>
              </IconButton>
              {ptoYearTabs.map((year) => (
                <TopButton key={year} active={ptoPlanYear === year} onClick={() => {
                  selectPtoPlanYear(year);
                }} label={year} />
              ))}
              <IconButton label="Добавить год" onClick={() => {
                setPtoYearInput("");
                setPtoYearDialogOpen(true);
              }}>
                <span aria-hidden>+</span>
              </IconButton>
            </div>
            {ptoYearDialogOpen ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  addPtoYear();
                }}
                style={ptoYearDialogStyle}
              >
                <Field label="Новый год">
                  <input
                    autoFocus
                    type="number"
                    min="1900"
                    max="2100"
                    value={ptoYearInput}
                    onChange={(event) => setPtoYearInput(event.target.value)}
                    style={{ ...inputStyle, width: 120, padding: "7px 10px", borderRadius: 8 }}
                  />
                </Field>
                <TopButton active onClick={addPtoYear} label="ОК" />
                <TopButton active={false} onClick={() => {
                  setPtoYearDialogOpen(false);
                  setPtoYearInput("");
                }} label="Отмена" />
              </form>
            ) : null}
          </div>
        </div>

        <div style={ptoFormulaBarStyle}>
          <input
            type="text"
            inputMode="decimal"
            value={activeFormulaCell ? ptoFormulaDraft : ""}
            onChange={(event) => updateFormulaValue(event.target.value)}
            onBlur={() => {
              if (activeFormulaCell) setPtoFormulaDraft(formatPtoFormulaNumber(activeFormulaValue));
              requestPtoDatabaseSave();
            }}
            disabled={formulaInputDisabled}
            placeholder="Выбери числовую ячейку"
            style={ptoFormulaInputStyle}
          />
        </div>

        <div style={ptoDateTableScrollStyle}>
          <table style={{ ...ptoPlanTableStyle, width: tableMinWidth, minWidth: tableMinWidth }}>
            <colgroup>
              {tableColumns.map((column) => (
                <col key={column.key} style={{ width: column.width }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <PtoPlanTh rowSpan={2} columnKey="area" width={columnWidthByKey.get("area")} onResizeStart={startPtoColumnResize}>{renderPtoHeaderText("area", "Участок")}</PtoPlanTh>
                {showLocation ? <PtoPlanTh rowSpan={2} columnKey="location" width={columnWidthByKey.get("location")} onResizeStart={startPtoColumnResize}>{renderPtoHeaderText("location", "Местонахождение")}</PtoPlanTh> : null}
                <PtoPlanTh rowSpan={2} columnKey="structure" width={columnWidthByKey.get("structure")} onResizeStart={startPtoColumnResize}>{renderPtoHeaderText("structure", "Структура")}</PtoPlanTh>
                <PtoPlanTh rowSpan={2} align="center" columnKey="unit" width={columnWidthByKey.get("unit")} onResizeStart={startPtoColumnResize}>{renderPtoHeaderText("unit", "Ед.", "center")}</PtoPlanTh>
                <PtoPlanTh rowSpan={2} align="center" columnKey="coefficient" width={columnWidthByKey.get("coefficient")} onResizeStart={startPtoColumnResize}>{renderPtoHeaderText("coefficient", "Коэфф.", "center")}</PtoPlanTh>
                <PtoPlanTh rowSpan={2} align="center" columnKey="status" width={columnWidthByKey.get("status")} onResizeStart={startPtoColumnResize}>{renderPtoHeaderText("status", "Статус", "center")}</PtoPlanTh>
                <PtoPlanTh rowSpan={2} align="center" columnKey={`carryover:${ptoPlanYear}`} width={columnWidthByKey.get(`carryover:${ptoPlanYear}`)} onResizeStart={startPtoColumnResize}>{renderPtoHeaderText(`carryover:${ptoPlanYear}`, carryoverHeader, "center")}</PtoPlanTh>
                <PtoPlanTh rowSpan={2} align="center" columnKey="year-total" width={columnWidthByKey.get("year-total")} onResizeStart={startPtoColumnResize}>{renderPtoHeaderText("year-total", "Итого год", "center")}</PtoPlanTh>
                {ptoMonthGroups.map((group) => (
                  <PtoPlanTh key={group.month} colSpan={1 + (group.expanded ? group.days.length : 0)}>
                    {renderPtoMonthHeader(group.month, group.label, group.expanded)}
                  </PtoPlanTh>
                ))}
                <PtoPlanTh rowSpan={2} columnKey="actions" width={columnWidthByKey.get("actions")} onResizeStart={startPtoColumnResize}>
                  <span aria-hidden />
                </PtoPlanTh>
              </tr>
              <tr>
                {ptoMonthGroups.map((group) => (
                  <Fragment key={`${group.month}-days`}>
                    <PtoPlanTh align="center" columnKey={`month-total:${group.month}`} width={columnWidthByKey.get(`month-total:${group.month}`)} onResizeStart={startPtoColumnResize}>{renderPtoHeaderText(`month-total:${group.month}`, "Итого", "center")}</PtoPlanTh>
                    {group.expanded && group.days.map((day) => (
                      <PtoPlanTh key={day} align="center" columnKey={`day:${day}`} width={columnWidthByKey.get(`day:${day}`)} onResizeStart={startPtoColumnResize}>{renderPtoHeaderText(`day:${day}`, day.slice(8, 10), "center")}</PtoPlanTh>
                    ))}
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, rowIndex) => {
                const rowAreaFilter = cleanAreaName(row.area) || "Все участки";
                const locationOptions = showLocation
                  ? uniqueSorted(allPtoDateRows
                    .filter((item) => ptoAreaMatches(item.area, rowAreaFilter))
                    .map((item) => item.location))
                  : [];
                const structureOptions = uniqueSorted(allPtoDateRows
                  .filter((item) => ptoAreaMatches(item.area, rowAreaFilter))
                  .filter((item) => !showLocation || !row.location || normalizeLookupValue(item.location) === normalizeLookupValue(row.location))
                  .map((item) => item.structure));
                const locationListId = `pto-location-${row.id}`;
                const structureListId = `pto-structure-${row.id}`;
                const isDropTarget = ptoDropTarget?.rowId === row.id;
                const dropLineStyle = isDropTarget
                  ? {
                      ...ptoDropIndicatorStyle,
                      width: tableMinWidth,
                      ...(ptoDropTarget.position === "before" ? { top: -2 } : { bottom: -2 }),
                    }
                  : null;
                const showInlineAddRowButton = rowIndex < filteredRows.length - 1;
                const coefficientCellActive = formulaCellActive(row.id, "coefficient");
                const carryoverCellActive = formulaCellActive(row.id, "carryover");
                const coefficientCellSelected = formulaCellSelected(row.id, "coefficient");
                const carryoverCellSelected = formulaCellSelected(row.id, "carryover");
                const coefficientCellEditing = formulaCellEditing(row.id, "coefficient");
                const carryoverCellEditing = formulaCellEditing(row.id, "carryover");
                const rowStatus = ptoAutomatedStatus(row, reportDate);
                const effectiveCarryover = ptoEffectiveCarryover(row, ptoPlanYear, rows);
                const coefficientCell = formulaCellRows
                  .find((item) => item.row.id === row.id)
                  ?.cells.find((cell) => cell.kind === "coefficient") ?? { rowId: row.id, kind: "coefficient" as const, label: "Коэфф." };
                const carryoverCell = formulaCellRows
                  .find((item) => item.row.id === row.id)
                  ?.cells.find((cell) => cell.kind === "carryover") ?? { rowId: row.id, kind: "carryover" as const, label: carryoverHeader };
                const rowHeightKey = `${ptoTab}:${row.id}`;
                const rowHeight = ptoRowHeights[rowHeightKey];

                return (
                  <tr
                    key={row.id}
                    style={{ background: ptoStatusRowBackground(rowStatus), ...(rowHeight ? { height: rowHeight } : null) }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (!draggedPtoRowId || draggedPtoRowId === row.id) {
                        setPtoDropTarget(null);
                        return;
                      }

                      const position = getPtoDropPosition(event);
                      setPtoDropTarget((current) =>
                        current?.rowId === row.id && current.position === position
                          ? current
                          : { rowId: row.id, position },
                      );
                    }}
                    onDragLeave={(event) => {
                      const nextTarget = event.relatedTarget as Node | null;
                      if (nextTarget && event.currentTarget.contains(nextTarget)) return;

                      setPtoDropTarget((current) => (current?.rowId === row.id ? null : current));
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggedPtoRowId && draggedPtoRowId !== row.id) {
                        const position = ptoDropTarget?.rowId === row.id ? ptoDropTarget.position : getPtoDropPosition(event);
                        moveLinkedPtoDateRow(draggedPtoRowId, row.id, filteredRows, position);
                      }
                      setDraggedPtoRowId(null);
                      setPtoDropTarget(null);
                    }}
                  >
                    <PtoPlanTd>
                      {dropLineStyle ? <span style={dropLineStyle} /> : null}
                      <span
                        onMouseDown={(event) => startPtoRowResize(event, rowHeightKey)}
                        style={ptoRowResizeHandleStyle}
                        title="Потяни вниз или вверх, чтобы изменить высоту строки"
                        aria-hidden
                      />
                      {showInlineAddRowButton ? (
                        <button
                          type="button"
                          onClick={() => addPtoRowAfter(row)}
                          onMouseEnter={() => setHoveredPtoAddRowId(row.id)}
                          onMouseLeave={() => setHoveredPtoAddRowId((current) => (current === row.id ? null : current))}
                          style={{
                            ...ptoInlineAddRowButtonStyle,
                            ...(hoveredPtoAddRowId === row.id ? ptoInlineAddRowButtonHoverStyle : null),
                          }}
                          title="Добавить строку ниже"
                          aria-label="Добавить строку ниже"
                        >
                          +
                        </button>
                      ) : null}
                      <div style={ptoAreaCellStyle}>
                        <div style={ptoRowToolsStyle}>
                          <button
                            type="button"
                            draggable
                            onDragStart={() => {
                              setDraggedPtoRowId(row.id);
                              setPtoDropTarget(null);
                            }}
                            onDragEnd={() => {
                              setDraggedPtoRowId(null);
                              setPtoDropTarget(null);
                            }}
                            style={dragHandleStyle}
                            title="Перетащи строку"
                            aria-label="Перетащи строку"
                          >
                            <span style={dragHandleDotsStyle} aria-hidden>
                              <span style={dragHandleDotStyle} />
                              <span style={dragHandleDotStyle} />
                              <span style={dragHandleDotStyle} />
                            </span>
                          </button>
                        </div>
                        <input data-pto-row-field={ptoRowFieldDomKey(row.id, "area")} list="pto-area-options" value={row.area} onChange={(e) => updatePtoDateRow(setRows, row.id, "area", e.target.value)} onBlur={requestPtoDatabaseSave} placeholder="Уч_Аксу" style={ptoPlanInputStyle} />
                      </div>
                    </PtoPlanTd>
                    {showLocation ? (
                      <PtoPlanTd>
                        <input data-pto-row-field={ptoRowFieldDomKey(row.id, "location")} list={locationListId} value={row.location} onChange={(e) => updatePtoDateRow(setRows, row.id, "location", e.target.value)} onBlur={requestPtoDatabaseSave} placeholder="Карьер" style={ptoPlanInputStyle} />
                        <datalist id={locationListId}>
                          {locationOptions.map((location) => (
                            <option key={location} value={location} />
                          ))}
                        </datalist>
                      </PtoPlanTd>
                    ) : null}
                    <PtoPlanTd>
                      <input data-pto-row-field={ptoRowFieldDomKey(row.id, "structure")} list={structureListId} value={row.structure} onChange={(e) => updatePtoDateRow(setRows, row.id, "structure", e.target.value)} onBlur={requestPtoDatabaseSave} placeholder="Вид работ" style={ptoPlanInputStyle} />
                      <datalist id={structureListId}>
                        {structureOptions.map((structure) => (
                          <option key={structure} value={structure} />
                        ))}
                      </datalist>
                    </PtoPlanTd>
                    <PtoPlanTd align="center">
                      <select data-pto-row-field={ptoRowFieldDomKey(row.id, "unit")} value={normalizePtoUnit(row.unit)} onChange={(e) => {
                        updatePtoDateRow(setRows, row.id, "unit", e.target.value);
                        requestPtoDatabaseSave();
                      }} style={{ ...ptoPlanInputStyle, textAlign: "center" }}>
                        {ptoUnitOptions.map((unit) => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </PtoPlanTd>
                    <PtoPlanTd active={coefficientCellActive} selected={coefficientCellSelected} editing={coefficientCellEditing} align="center">
                      <input
                        readOnly={!coefficientCellEditing}
                        data-pto-row-field={ptoRowFieldDomKey(row.id, "coefficient")}
                        data-pto-cell-key={formulaCellDomKey(coefficientCell)}
                        type="text"
                        inputMode="decimal"
                        value={coefficientCellEditing ? ptoFormulaDraft : formatPtoCellNumber(row.coefficient)}
                        onFocus={() => {
                          if (!ptoSelectionDraggingRef.current) selectFormulaCell(coefficientCell, row.coefficient);
                        }}
                        onMouseDown={(event) => handleFormulaCellMouseDown(event, coefficientCell, row.coefficient, coefficientCellEditing)}
                        onMouseEnter={(event) => handleFormulaCellMouseEnter(event, coefficientCell, row.coefficient, coefficientCellEditing)}
                        onClick={(event) => {
                          if (event.shiftKey && !coefficientCellEditing) selectFormulaRange(coefficientCell, row.coefficient);
                        }}
                        onDoubleClick={(event) => {
                          startInlineFormulaEdit(coefficientCell, row.coefficient);
                          event.currentTarget.select();
                        }}
                        onChange={(event) => updateFormulaValue(event.target.value)}
                        onBlur={() => {
                          if (coefficientCellEditing) commitInlineFormulaEdit();
                        }}
                        onKeyDown={(event) => handleFormulaCellKeyDown(event, coefficientCell, row.coefficient, coefficientCellEditing)}
                        title={formatPtoFormulaNumber(row.coefficient)}
                        style={{ ...ptoPlanInputStyle, ...ptoCompactNumberInputStyle }}
                      />
                    </PtoPlanTd>
                    <PtoPlanTd align="center">
                      <span
                        title="Статус рассчитывается по рабочей дате и заполненным значениям месяца"
                        style={{ ...ptoStatusBadgeStyle, ...ptoStatusControlStyle(rowStatus) }}
                      >
                        {rowStatus}
                      </span>
                    </PtoPlanTd>
                    <PtoPlanTd active={carryoverCellActive} selected={carryoverCellSelected} editing={carryoverCellEditing} align="center">
                      <input
                        readOnly={!carryoverCellEditing}
                        data-pto-cell-key={formulaCellDomKey(carryoverCell)}
                        type="text"
                        inputMode="decimal"
                        value={carryoverCellEditing ? ptoFormulaDraft : formatPtoCellNumber(effectiveCarryover)}
                        onFocus={() => {
                          if (!ptoSelectionDraggingRef.current) selectFormulaCell(carryoverCell, effectiveCarryover);
                        }}
                        onMouseDown={(event) => handleFormulaCellMouseDown(event, carryoverCell, effectiveCarryover, carryoverCellEditing)}
                        onMouseEnter={(event) => handleFormulaCellMouseEnter(event, carryoverCell, effectiveCarryover, carryoverCellEditing)}
                        onClick={(event) => {
                          if (event.shiftKey && !carryoverCellEditing) selectFormulaRange(carryoverCell, effectiveCarryover);
                        }}
                        onDoubleClick={(event) => {
                          startInlineFormulaEdit(carryoverCell, effectiveCarryover);
                          event.currentTarget.select();
                        }}
                        onChange={(event) => updateFormulaValue(event.target.value)}
                        onBlur={() => {
                          if (carryoverCellEditing) commitInlineFormulaEdit();
                        }}
                        onKeyDown={(event) => handleFormulaCellKeyDown(event, carryoverCell, effectiveCarryover, carryoverCellEditing)}
                        title={formatPtoFormulaNumber(effectiveCarryover)}
                        style={{ ...ptoPlanInputStyle, ...ptoCompactNumberInputStyle }}
                      />
                    </PtoPlanTd>
                    <PtoPlanTd align="center">
                      <div style={{ fontWeight: 800, textAlign: "center" }} title={formatPtoFormulaNumber(ptoYearTotalWithCarryover(row, ptoPlanYear, rows))}>{formatPtoCellNumber(ptoYearTotalWithCarryover(row, ptoPlanYear, rows))}</div>
                    </PtoPlanTd>
                    {ptoMonthGroups.map((group) => {
                      const monthHasValue = group.days.some((day) => row.dailyPlans[day] !== undefined);
                      const monthValue = monthHasValue ? ptoMonthTotal(row, group.month) : undefined;
                      const monthCellActive = formulaCellActive(row.id, "month", group.month);
                      const monthCellSelected = formulaCellSelected(row.id, "month", group.month);
                      const monthCellEditing = formulaCellEditing(row.id, "month", group.month);
                      const monthCell = {
                        rowId: row.id,
                        kind: "month" as const,
                        month: group.month,
                        days: group.days,
                        label: group.label,
                        editable: editableMonthTotal,
                      };

                      return (
                        <Fragment key={`${row.id}-${group.month}`}>
                          <PtoPlanTd active={monthCellActive} selected={monthCellSelected} editing={monthCellEditing} align="center">
                            {editableMonthTotal ? (
                              <input
                                readOnly={!monthCellEditing}
                                data-pto-cell-key={formulaCellDomKey(monthCell)}
                                type="text"
                                inputMode="decimal"
                                value={monthCellEditing ? ptoFormulaDraft : formatPtoCellNumber(monthValue)}
                                onFocus={() => {
                                  if (!ptoSelectionDraggingRef.current) selectFormulaCell(monthCell, monthValue);
                                }}
                                onMouseDown={(event) => handleFormulaCellMouseDown(event, monthCell, monthValue, monthCellEditing)}
                                onMouseEnter={(event) => handleFormulaCellMouseEnter(event, monthCell, monthValue, monthCellEditing)}
                                onClick={(event) => {
                                  if (event.shiftKey && !monthCellEditing) selectFormulaRange(monthCell, monthValue);
                                }}
                                onDoubleClick={(event) => {
                                  startInlineFormulaEdit(monthCell, monthValue);
                                  event.currentTarget.select();
                                }}
                                onChange={(event) => updateFormulaValue(event.target.value)}
                                onBlur={() => {
                                  if (monthCellEditing) commitInlineFormulaEdit();
                                }}
                                onKeyDown={(event) => handleFormulaCellKeyDown(event, monthCell, monthValue, monthCellEditing)}
                                placeholder="Месяц"
                                title={formatPtoFormulaNumber(monthValue)}
                                style={{ ...ptoPlanDayInputStyle, ...ptoCompactNumberInputStyle, fontWeight: 800 }}
                              />
                            ) : (
                              <button
                                type="button"
                                onMouseDown={(event) => handleFormulaCellMouseDown(event, { ...monthCell, editable: false }, monthValue, false)}
                                onMouseEnter={(event) => handleFormulaCellMouseEnter(event, { ...monthCell, editable: false }, monthValue, false)}
                                onClick={(event) => {
                                  if (event.ctrlKey || event.metaKey) {
                                    return;
                                  }

                                  if (event.shiftKey) {
                                    selectFormulaRange({ ...monthCell, editable: false }, monthValue);
                                  } else {
                                    selectFormulaCell({ ...monthCell, editable: false }, monthValue);
                                  }
                                }}
                                title={formatPtoFormulaNumber(monthValue)}
                                style={ptoReadonlyTotalStyle}
                              >
                                {formatPtoCellNumber(monthValue)}
                              </button>
                            )}
                          </PtoPlanTd>
                          {group.expanded && group.days.map((day) => {
                            const dayValue = row.dailyPlans[day];
                            const dayCellActive = formulaCellActive(row.id, "day", day);
                            const dayCellSelected = formulaCellSelected(row.id, "day", day);
                            const dayCellEditing = formulaCellEditing(row.id, "day", day);
                            const dayLabel = `${day.slice(8, 10)}.${day.slice(5, 7)}`;
                            const dayCell = {
                              rowId: row.id,
                              kind: "day" as const,
                              day,
                              label: dayLabel,
                            };

                            return (
                              <PtoPlanTd key={day} active={dayCellActive} selected={dayCellSelected} editing={dayCellEditing} align="center">
                                <input
                                  readOnly={!dayCellEditing}
                                  data-pto-cell-key={formulaCellDomKey(dayCell)}
                                  type="text"
                                  inputMode="decimal"
                                  value={dayCellEditing ? ptoFormulaDraft : formatPtoCellNumber(dayValue)}
                                  onFocus={() => {
                                    if (!ptoSelectionDraggingRef.current) selectFormulaCell(dayCell, dayValue);
                                  }}
                                  onMouseDown={(event) => handleFormulaCellMouseDown(event, dayCell, dayValue, dayCellEditing)}
                                  onMouseEnter={(event) => handleFormulaCellMouseEnter(event, dayCell, dayValue, dayCellEditing)}
                                  onClick={(event) => {
                                    if (event.shiftKey && !dayCellEditing) selectFormulaRange(dayCell, dayValue);
                                  }}
                                  onDoubleClick={(event) => {
                                    startInlineFormulaEdit(dayCell, dayValue);
                                    event.currentTarget.select();
                                  }}
                                  onChange={(event) => updateFormulaValue(event.target.value)}
                                  onBlur={() => {
                                    if (dayCellEditing) commitInlineFormulaEdit();
                                  }}
                                  onKeyDown={(event) => handleFormulaCellKeyDown(event, dayCell, dayValue, dayCellEditing)}
                                  title={formatPtoFormulaNumber(dayValue)}
                                  style={{ ...ptoPlanDayInputStyle, ...ptoCompactNumberInputStyle }}
                                />
                              </PtoPlanTd>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                    <PtoPlanTd>
                      <IconButton label={`Удалить строку: ${row.structure || "ПТО"}`} onClick={() => removeLinkedPtoDateRow(row)}>
                        <Trash2 size={16} aria-hidden />
                      </IconButton>
                    </PtoPlanTd>
                  </tr>
                );
              })}
              <tr style={ptoDraftRowStyle}>
                <PtoPlanTd>
                  <div style={ptoAreaCellStyle}>
                    <button
                      type="button"
                      onClick={addPtoRowFromDraft}
                      style={ptoDraftAddButtonStyle}
                      title="Добавить строку"
                      aria-label="Добавить строку"
                    >
                      +
                    </button>
                    <input value="" onChange={(event) => commitPtoDraftField("area", event.target.value)} placeholder="Новая строка" style={{ ...ptoPlanInputStyle, ...ptoDraftInputStyle }} />
                  </div>
                </PtoPlanTd>
                {showLocation ? (
                  <PtoPlanTd>
                    <input value="" onChange={(event) => commitPtoDraftField("location", event.target.value)} placeholder="Местонахождение" style={{ ...ptoPlanInputStyle, ...ptoDraftInputStyle }} />
                  </PtoPlanTd>
                ) : null}
                <PtoPlanTd>
                  <input value="" onChange={(event) => commitPtoDraftField("structure", event.target.value)} placeholder="Структура" style={{ ...ptoPlanInputStyle, ...ptoDraftInputStyle }} />
                </PtoPlanTd>
                <PtoPlanTd align="center">
                  <select value="" onChange={(event) => commitPtoDraftField("unit", event.target.value)} style={{ ...ptoPlanInputStyle, ...ptoDraftInputStyle, textAlign: "center" }}>
                    <option value="">Ед.</option>
                    {ptoUnitOptions.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </PtoPlanTd>
                <PtoPlanTd align="center">
                  <input value="" inputMode="decimal" onChange={(event) => commitPtoDraftField("coefficient", event.target.value)} placeholder="0" style={{ ...ptoPlanInputStyle, ...ptoCompactNumberInputStyle, ...ptoDraftInputStyle }} />
                </PtoPlanTd>
                <PtoPlanTd align="center">
                  <span style={ptoDraftStatusStyle}>Новая</span>
                </PtoPlanTd>
                <PtoPlanTd align="center"><span style={ptoDraftCellHintStyle} /></PtoPlanTd>
                <PtoPlanTd align="center"><span style={ptoDraftCellHintStyle} /></PtoPlanTd>
                {ptoMonthGroups.map((group) => (
                  <Fragment key={`draft-${group.month}`}>
                    <PtoPlanTd align="center"><span style={ptoDraftCellHintStyle} /></PtoPlanTd>
                    {group.expanded && group.days.map((day) => (
                      <PtoPlanTd key={`draft-${day}`} align="center"><span style={ptoDraftCellHintStyle} /></PtoPlanTd>
                    ))}
                  </Fragment>
                ))}
                <PtoPlanTd><span style={ptoDraftCellHintStyle} /></PtoPlanTd>
              </tr>
            </tbody>
          </table>
        </div>
        <datalist id="pto-area-options">
          {ptoAreaTabs.filter((area) => area !== "Все участки").map((area) => (
            <option key={area} value={`Уч_${area}`} />
          ))}
        </datalist>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "24px", fontFamily: "var(--app-font)", color: "#0f172a", lineHeight: 1.35 }}>
      <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto" }}>
        <div style={{ background: "#ffffff", borderRadius: 18, padding: 20, boxShadow: "0 4px 16px rgba(15,23,42,0.06)", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ width: 130, flex: "0 0 130px" }}>
              <Image src="/mining-logo.png" alt="Логотип" width={112} height={72} style={logoImageStyle} priority />
            </div>
            <div style={{ ...headerNavStackStyle, ...(topTab === "pto" ? headerNavStackPtoStyle : null) }}>
              <div style={headerMainTabsStyle}>
                {topTabs.filter((tab) => tab.visible).map((tab) => (
                  tab.id === "pto" && topTab === "pto" ? (
                    <div key={tab.id} style={headerActiveTabWithSubtabsStyle}>
                      <TopButton active={topTab === tab.id} onClick={() => selectTopTab(tab.id)} label={compactTopTabLabel(tab)} />
                      <div style={headerSubtabsStyle}>
                        {subTabs.pto.filter((subTab) => subTab.visible).map((subTab) => (
                          <HeaderSubButton
                            key={subTab.id}
                            active={ptoTab === subTab.value}
                            onClick={() => selectPtoTab(subTab.value)}
                            label={compactSubTabLabel("pto", subTab)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <TopButton key={tab.id} active={topTab === tab.id} onClick={() => selectTopTab(tab.id)} label={compactTopTabLabel(tab)} />
                  )
                ))}
                {customTabs.filter((tab) => tab.visible !== false).map((tab) => (
                  <TopButton key={tab.id} active={topTab === customTabKey(tab.id)} onClick={() => selectTopTab(customTabKey(tab.id))} label={tab.title} />
                ))}
              </div>
            </div>
            <div style={workDateStyle}>
              <Field label="Рабочая дата">
                <input type="date" value={reportDate} min={reportMonthStart} max={reportMonthEnd} onChange={(e) => selectReportDate(e.target.value)} style={{ ...inputStyle, padding: "8px 10px" }} />
              </Field>
            </div>
          </div>
        </div>

        {topTab === "reports" && (
          <>
            <SubTabs>
              {subTabs.reports.filter((tab) => tab.visible).map((tab) => (
                <TopButton key={tab.id} active={reportArea === tab.value} onClick={() => setReportArea(tab.value)} label={compactSubTabLabel("reports", tab)} />
              ))}
            </SubTabs>

            <SectionCard title="">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "end", flexWrap: "wrap", marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Отчёт ТОО &quot;АА Mining&quot; по планово-фактическим показателям</div>
                  <div style={{ color: "#64748b", marginTop: 4 }}>за {formatReportDate(reportDate)}</div>
                </div>
              </div>

              <div style={reportGaugeGridStyle}>
                {reportCompletionCards.map((card) => (
                  <ReportCompletionGauge
                    key={card.title}
                    fact={card.fact}
                    lag={card.lag}
                    monthPlan={card.monthPlan}
                    overPlanPerDay={card.overPlanPerDay}
                    percent={card.percent}
                    plan={card.plan}
                    remainingDays={card.remainingDays}
                    title={card.title}
                  />
                ))}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={reportTableStyle}>
                  <thead>
                    <tr>
                      <ReportTh rowSpan={2}>Участок</ReportTh>
                      <ReportTh rowSpan={2}>Вид работ</ReportTh>
                      <ReportTh rowSpan={2}>Ед.</ReportTh>
                      <ReportTh colSpan={5}>Текущая дата</ReportTh>
                      <ReportTh colSpan={5}>С начала месяца</ReportTh>
                      <ReportTh colSpan={4}>С начала года</ReportTh>
                      <ReportTh colSpan={3}>Годовой план</ReportTh>
                    </tr>
                    <tr>
                      <ReportTh>План суточный</ReportTh>
                      <ReportTh>Оперучет</ReportTh>
                      <ReportTh>Откл.</ReportTh>
                      <ReportTh>Произв. техники</ReportTh>
                      <ReportTh>Причина за сутки</ReportTh>
                      <ReportTh>План на месяц</ReportTh>
                      <ReportTh>План с начала месяца</ReportTh>
                      <ReportTh>Маркзамер + оперучет</ReportTh>
                      <ReportTh>Откл.</ReportTh>
                      <ReportTh>Произв. накоп.</ReportTh>
                      <ReportTh>План с начала года</ReportTh>
                      <ReportTh>Маркзамер + недостающий оперучет</ReportTh>
                      <ReportTh>Откл.</ReportTh>
                      <ReportTh>Причины с накоплением</ReportTh>
                      <ReportTh>Годовой план</ReportTh>
                      <ReportTh>Факт годового плана</ReportTh>
                      <ReportTh>Остаток</ReportTh>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((row) => {
                      const monthFact = reportMonthFact(row);
                      const yearFact = reportYearFact(row);
                      const annualFact = reportAnnualFact(row);
                      const dayDelta = delta(row.dayPlan, row.dayFact);
                      const monthDelta = delta(row.monthPlan, monthFact);
                      const yearDelta = delta(row.yearPlan, yearFact);
                      const annualRemaining = delta(row.annualPlan, annualFact);

                      return (
                        <tr key={`${row.area}-${row.name}`}>
                          <ReportTd strong>{row.area}</ReportTd>
                          <ReportTd strong>{row.name}</ReportTd>
                          <ReportTd>{row.unit}</ReportTd>
                          <ReportTd align="right">{formatNumber(row.dayPlan)}</ReportTd>
                          <ReportTd align="right">{formatNumber(row.dayFact)}</ReportTd>
                          <ReportTd align="right" tone={dayDelta < 0 ? "bad" : "good"}>{formatNumber(dayDelta)}</ReportTd>
                          <ReportTd align="right">
                            <ReportMetric value={formatNumber(row.dayProductivity || row.dayFact)} note={formatPercent(row.dayFact, row.dayPlan)} />
                          </ReportTd>
                          <ReportTd>{reportReason(row.dayFact, row.dayPlan, row.dayReason)}</ReportTd>
                          <ReportTd align="right">{formatNumber(row.monthTotalPlan)}</ReportTd>
                          <ReportTd align="right">{formatNumber(row.monthPlan)}</ReportTd>
                          <ReportTd align="right">
                            <ReportMetric value={formatNumber(monthFact)} note={`марк ${formatNumber(row.monthSurveyFact)} + опер ${formatNumber(row.monthOperFact)}`} />
                          </ReportTd>
                          <ReportTd align="right" tone={monthDelta < 0 ? "bad" : "good"}>{formatNumber(monthDelta)}</ReportTd>
                          <ReportTd align="right">
                            <ReportMetric value={formatNumber(row.monthProductivity || monthFact)} note={formatPercent(monthFact, row.monthPlan)} />
                          </ReportTd>
                          <ReportTd align="right">{formatNumber(row.yearPlan)}</ReportTd>
                          <ReportTd align="right">
                            <ReportMetric value={formatNumber(yearFact)} note={`марк ${formatNumber(row.yearSurveyFact)} + опер ${formatNumber(row.yearOperFact)}`} />
                          </ReportTd>
                          <ReportTd align="right" tone={yearDelta < 0 ? "bad" : "good"}>{formatNumber(yearDelta)}</ReportTd>
                          <ReportTd>{reportReason(yearFact, row.yearPlan, row.yearReason)}</ReportTd>
                          <ReportTd align="right">{formatNumber(row.annualPlan)}</ReportTd>
                          <ReportTd align="right">{formatNumber(annualFact)}</ReportTd>
                          <ReportTd align="right" tone={annualRemaining < 0 ? "bad" : "good"}>{formatNumber(annualRemaining)}</ReportTd>
                        </tr>
                      );
                    })}
                    {filteredReports.length === 0 && (
                      <tr>
                        <ReportTd colSpan={20}>По выбранному участку пока нет данных.</ReportTd>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </>
        )}

        {topTab === "dispatch" && (
          <>
            <SubTabs>
              {subTabs.dispatch.filter((tab) => tab.visible).map((tab) => (
                <TopButton key={tab.id} active={dispatchTab === tab.value} onClick={() => setDispatchTab(tab.value)} label={compactSubTabLabel("dispatch", tab)} />
              ))}
            </SubTabs>

            <SectionCard title={activeDispatchSubtab?.label ?? "Диспетчерская сводка"}>
              {dispatchTab.startsWith("custom:") ? (
                <div style={blockStyle}>{activeDispatchSubtab?.content || "В этой подвкладке пока нет информации."}</div>
              ) : (
                <>
                  <div style={{ color: "#64748b", marginBottom: 12 }}>Дата сводки: {formatReportDate(reportDate)}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12, marginBottom: 16 }}>
                    <Field label="Поиск">
                      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Техника, участок, местонахождение..." style={inputStyle} />
                    </Field>
                    <Field label="Участок">
                      <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} style={inputStyle}>
                        <option>Все участки</option>
                        <option>Аксу</option>
                        <option>Акбакай</option>
                        <option>Жолымбет</option>
                      </select>
                    </Field>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100, fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                          <Th>Техника</Th>
                          <Th>Участок</Th>
                          <Th>Местонахождение</Th>
                          <Th>Вид работ</Th>
                          <Th>Экскаватор</Th>
                          <Th>Работа</Th>
                          <Th>Аренда</Th>
                          <Th>Ремонт</Th>
                          <Th>Простой</Th>
                          <Th>Рейсы</Th>
                          <Th>Итого</Th>
                          <Th>КТГ</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDispatch.map((v) => (
                          <tr key={v.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                            <Td strong>{buildVehicleDisplayName(v)}</Td>
                            <Td>{v.area}</Td>
                            <Td>{v.location}</Td>
                            <Td>{v.workType}</Td>
                            <Td>{v.excavator}</Td>
                            <Td>{v.work}</Td>
                            <Td>{v.rent}</Td>
                            <Td>{v.repair}</Td>
                            <Td>{v.downtime}</Td>
                            <Td>{v.trips}</Td>
                            <Td><Pill bg={totalHours(v) === 11 ? "#dcfce7" : "#fee2e2"} color={totalHours(v) === 11 ? "#166534" : "#991b1b"}>{totalHours(v)} / 11</Pill></Td>
                            <Td><Pill bg={statusColor(ktg(v))} color={statusTextColor(ktg(v))}>{ktg(v)}%</Pill></Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </SectionCard>
          </>
        )}

        {topTab === "fleet" && (
          <>
            <SubTabs>
              {subTabs.fleet.filter((tab) => tab.visible).map((tab) => (
                <TopButton key={tab.id} active={fleetTab === tab.value} onClick={() => setFleetTab(tab.value)} label={compactSubTabLabel("fleet", tab)} />
              ))}
            </SubTabs>

            <SectionCard title={activeFleetSubtab?.label ?? "Список техники по участкам"}>
              {fleetTab.startsWith("custom:") ? (
                <div style={blockStyle}>{activeFleetSubtab?.content || "В этой подвкладке пока нет информации."}</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                  {filteredFleet.map((v) => (
                    <div key={v.id} style={blockStyle}>
                      <div style={{ fontWeight: 700 }}>{buildVehicleDisplayName(v)}</div>
                      <div style={{ color: "#64748b", marginTop: 6 }}>{v.area} · {v.location}</div>
                      <div style={{ marginTop: 8 }}>Вид работ: {v.workType}</div>
                      <div>Работа: {v.work} ч | Аренда: {v.rent} ч</div>
                      <div>Ремонт: {v.repair} ч | Простой: {v.downtime} ч</div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        )}

        {topTab === "contractors" && (
          <>
            <SubTabs>
              {subTabs.contractors.filter((tab) => tab.visible).map((tab) => (
                <TopButton key={tab.id} active={contractorTab === tab.value} onClick={() => setContractorTab(tab.value)} label={compactSubTabLabel("contractors", tab)} />
              ))}
            </SubTabs>

            <SectionCard title={`Действующий подрядчик: ${activeContractorSubtab?.label ?? contractorTab}`}>
              {contractorTab.startsWith("custom:") ? (
                <div style={blockStyle}>{activeContractorSubtab?.content || "В этой подвкладке пока нет информации."}</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                  {(contractors[contractorTab] ?? []).map((unit) => (
                    <div key={unit} style={blockStyle}>{unit}</div>
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        )}

        {topTab === "fuel" && (
          <>
            <SubTabs>
              {subTabs.fuel.filter((tab) => tab.visible).map((tab) => (
                <TopButton key={tab.id} active={fuelTab === tab.value} onClick={() => setFuelTab(tab.value)} label={compactSubTabLabel("fuel", tab)} />
              ))}
            </SubTabs>

            <SectionCard title={`Топливо — ${activeFuelSubtab?.label ?? fuelTab}`}>
              {fuelTab.startsWith("custom:") ? (
                <div style={blockStyle}>{activeFuelSubtab?.content || "В этой подвкладке пока нет информации."}</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                  {(fuelTab === "general" ? fuelGeneral : fuelContractors).map((row) => (
                    <div key={`${row.unit}-${row.mode}`} style={blockStyle}>
                      <div style={{ fontWeight: 700 }}>{row.unit}</div>
                      {row.contractor ? <div style={{ color: "#64748b", marginTop: 6 }}>Организация: {row.contractor}</div> : null}
                      <div style={{ marginTop: 8 }}>Режим: {row.mode}</div>
                      <div>Литраж: {row.liters} л</div>
                      <div>Долг: {row.debt} л</div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        )}

        {topTab === "pto" && (
          <div style={isPtoDateTab ? ptoWorkspaceStyle : undefined}>
            <SectionCard title={isPtoDateTab ? "" : `ПТО: ${activePtoSubtab?.label ?? ptoTab}`} fill={isPtoDateTab}>
              {isPtoDateTab && (
                <div style={ptoDatabaseBarStyle}>
                  <span>{ptoDatabaseMessage}</span>
                  {ptoDatabaseSaving ? <span style={ptoDatabaseSavingBadgeStyle}>Автосохранение...</span> : null}
                </div>
              )}
              {ptoTab.startsWith("custom:") && <div style={blockStyle}>{activePtoSubtab?.content || "В этой подвкладке пока нет информации."}</div>}
              {ptoTab === "bodies" && <div style={blockStyle}>{activePtoSubtab?.content || "Справочник объемов кузовов: модель техники → материал → объем кузова."}</div>}
              {ptoTab === "performance" && <div style={blockStyle}>{activePtoSubtab?.content || "Расчет производительности: рейсы, кузова, материалы, удельный вес, перевод м³ ↔ тн."}</div>}
              {ptoTab === "cycle" && <div style={blockStyle}>{activePtoSubtab?.content || "Цикл погрузки: подъезд, погрузка, выезд, разгрузка, обратный путь."}</div>}
              {ptoTab === "buckets" && <div style={blockStyle}>{activePtoSubtab?.content || "Объемы ковшей по моделям экскаваторов."}</div>}
              {ptoTab === "plan" && (
                <div style={ptoDatePanelStyle}>
                  {activePtoSubtab?.content ? <div style={blockStyle}>{activePtoSubtab.content}</div> : null}
                  <div style={ptoDateTableFrameStyle}>
                    {renderPtoDateTable(
                      ptoPlanRows,
                      setPtoPlanRows,
                      { showLocation: false, editableMonthTotal: true },
                    )}
                  </div>
                </div>
              )}
              {ptoTab === "oper" && (
                <div style={ptoDatePanelStyle}>
                  {activePtoSubtab?.content ? <div style={blockStyle}>{activePtoSubtab.content}</div> : null}
                  <div style={ptoDateTableFrameStyle}>
                    {renderPtoDateTable(
                      ptoOperRows,
                      setPtoOperRows,
                      { showLocation: false, editableMonthTotal: true },
                    )}
                  </div>
                </div>
              )}
              {ptoTab === "survey" && (
                <div style={ptoDatePanelStyle}>
                  {activePtoSubtab?.content ? <div style={blockStyle}>{activePtoSubtab.content}</div> : null}
                  <div style={ptoDateTableFrameStyle}>
                    {renderPtoDateTable(
                      ptoSurveyRows,
                      setPtoSurveyRows,
                      { showLocation: false, editableMonthTotal: true },
                    )}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {topTab === "tb" && (
          <>
            <SubTabs>
              {subTabs.tb.filter((tab) => tab.visible).map((tab) => (
                <TopButton key={tab.id} active={tbTab === tab.value} onClick={() => setTbTab(tab.value)} label={compactSubTabLabel("tb", tab)} />
              ))}
            </SubTabs>

            <SectionCard title={`ТБ: ${activeTbSubtab?.label ?? tbTab}`}>
              {tbTab.startsWith("custom:") && (
                <div style={blockStyle}>{activeTbSubtab?.content || "В этой подвкладке пока нет информации."}</div>
              )}
              {tbTab === "list" && (
                <div style={blockStyle}>
                  {activeTbSubtab?.content || "Список техники с данными GPS и статусом подключения."}
                </div>
              )}
              {tbTab === "driving" && (
                <div style={blockStyle}>
                  {activeTbSubtab?.content || "Анализ качества вождения: резкие ускорения, торможения, превышения скорости, ремень, фары."}
                </div>
              )}
              {tbTab === "contractors" && (
                <div style={blockStyle}>
                  {activeTbSubtab?.content || "Подрядчики с контролем наличия и активности GPS на технике."}
                </div>
              )}
            </SectionCard>
          </>
        )}

        {topTab === "user" && (
          <SectionCard title="Пользователь">
            <div style={{ ...blockStyle, maxWidth: 520 }}>
              <div style={{ fontWeight: 700, fontSize: 20 }}>{userCard.fullName}</div>
              <div style={{ color: "#64748b", marginTop: 6 }}>{userCard.role}</div>
              <div style={{ marginTop: 10 }}>Подразделение: {userCard.department}</div>
              <div>Права доступа: {userCard.access}</div>
            </div>
          </SectionCard>
        )}

        {topTab === "admin" && (
          <SectionCard title="">
            <SubTabs>
              <TopButton active={adminSection === "menu"} onClick={() => setAdminSection("menu")} label="Вкладки" />
              <TopButton active={adminSection === "structure"} onClick={() => setAdminSection("structure")} label="Структура" />
              <TopButton active={adminSection === "vehicles"} onClick={() => setAdminSection("vehicles")} label="Техника" />
              <TopButton active={adminSection === "reports"} onClick={() => setAdminSection("reports")} label="Отчетность" />
              <TopButton active={adminSection === "content"} onClick={() => setAdminSection("content")} label="Содержимое" />
            </SubTabs>

            {adminSection === "menu" && (
              <div style={{ ...blockStyle, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700 }}>Вкладки</div>
                  <IconButton label="Вернуть стандартное меню" onClick={restoreDefaultNavigation}>
                    <RotateCcw size={16} aria-hidden />
                  </IconButton>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                        <CompactTh>Вкладка</CompactTh>
                        <CompactTh>Тип</CompactTh>
                        <CompactTh>Показ</CompactTh>
                        <CompactTh>Подвкладки</CompactTh>
                        <CompactTh>Действия</CompactTh>
                      </tr>
                    </thead>
                    <tbody>
                      {topTabs.map((tab) => {
                        const group = getSubTabGroup(tab.id);
                        const isExpanded = expandedAdminTab === tab.id;
                        const isEditing = editingTopTabId === tab.id;
                        const visibleSubtabs = group ? subTabs[group].filter((subtab) => subtab.visible).length : 0;
                        const totalSubtabs = group ? subTabs[group].length : 0;

                        return (
                          <Fragment key={tab.id}>
                            <tr>
                              <CompactTd>
                                <div style={vehicleNameStyle}>{tab.label}</div>
                                <VehicleMeta label="В меню" value={compactTopTabLabel(tab)} />
                              </CompactTd>
                              <CompactTd>Основная</CompactTd>
                              <CompactTd>{tab.locked ? "Защищена" : tab.visible ? "Показывается" : "Скрыта"}</CompactTd>
                              <CompactTd>{group ? `${visibleSubtabs} / ${totalSubtabs}` : "—"}</CompactTd>
                              <CompactTd>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <IconButton label={isExpanded ? "Свернуть вкладку" : "Развернуть вкладку"} onClick={() => setExpandedAdminTab(isExpanded ? null : tab.id)}>
                                    {isExpanded ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
                                  </IconButton>
                                  <IconButton label={isEditing ? "Завершить редактирование" : "Редактировать вкладку"} onClick={() => setEditingTopTabId(isEditing ? null : tab.id)}>
                                    {isEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
                                  </IconButton>
                                  <IconButton
                                    disabled={tab.locked}
                                    label={tab.locked ? "Эту вкладку нельзя скрыть" : tab.visible ? "Скрыть вкладку" : "Вернуть вкладку"}
                                    onClick={() => (tab.visible ? hideTopTab(tab.id) : showTopTab(tab.id))}
                                  >
                                    {tab.visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                                  </IconButton>
                                </div>
                              </CompactTd>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={5} style={adminDetailCellStyle}>
                                  <div style={{ display: "grid", gap: 10 }}>
                                    {isEditing && (
                                      <Field label="Название вкладки">
                                        <input value={tab.label} onChange={(e) => updateTopTabLabel(tab.id, e.target.value)} style={inputStyle} />
                                      </Field>
                                    )}
                                    {group ? (
                                      <>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                          <div style={{ color: "#475569", fontWeight: 700 }}>Подвкладки внутри раздела</div>
                                          <IconButton label="Добавить подвкладку" onClick={() => addQuickSubTab(group)}>
                                            <Plus size={16} aria-hidden />
                                          </IconButton>
                                        </div>
                                        <div style={{ display: "grid", gap: 8 }}>
                                          {subTabs[group].map((subtab) => {
                                            const isSubtabEditing = editingSubTabId === subtab.id;

                                            return (
                                              <div key={subtab.id} style={compactRowStyle}>
                                                <div>
                                                  <div style={{ fontWeight: 700 }}>{subtab.label}</div>
                                                  <div style={{ color: "#64748b", marginTop: 3 }}>{subtab.visible ? "Показывается" : "Скрыта"}</div>
                                                </div>
                                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                  <IconButton label={isSubtabEditing ? "Завершить редактирование" : "Редактировать подвкладку"} onClick={() => setEditingSubTabId(isSubtabEditing ? null : subtab.id)}>
                                                    {isSubtabEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
                                                  </IconButton>
                                                  <IconButton label={subtab.visible ? "Скрыть подвкладку" : "Вернуть подвкладку"} onClick={() => (subtab.visible ? removeSubTab(group, subtab.id) : showSubTab(group, subtab.id))}>
                                                    {subtab.visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                                                  </IconButton>
                                                </div>
                                                {isSubtabEditing && (
                                                  <div style={adminInlineEditStyle}>
                                                    <Field label="Название подвкладки">
                                                      <input value={subtab.label} onChange={(e) => updateSubTabLabel(group, subtab.id, e.target.value)} style={inputStyle} />
                                                    </Field>
                                                    <Field label="Текст подвкладки">
                                                      <input value={subtab.content ?? ""} onChange={(e) => updateSubTabContent(group, subtab.id, e.target.value)} placeholder="Текст для этой подвкладки" style={inputStyle} />
                                                    </Field>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </>
                                    ) : (
                                      <div style={{ color: "#64748b" }}>У этого раздела нет подвкладок.</div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                      {customTabs.map((tab) => {
                        const key = customTabKey(tab.id);
                        const isExpanded = expandedAdminTab === key;
                        const isEditing = editingTopTabId === key;

                        return (
                          <Fragment key={tab.id}>
                            <tr>
                              <CompactTd>
                                <div style={vehicleNameStyle}>{tab.title}</div>
                                <VehicleMeta label="Описание" value={tab.description} />
                              </CompactTd>
                              <CompactTd>Пользовательская</CompactTd>
                              <CompactTd>{tab.visible === false ? "Скрыта" : "Показывается"}</CompactTd>
                              <CompactTd>{tab.items.length}</CompactTd>
                              <CompactTd>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <IconButton label={isExpanded ? "Свернуть вкладку" : "Развернуть вкладку"} onClick={() => setExpandedAdminTab(isExpanded ? null : key)}>
                                    {isExpanded ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
                                  </IconButton>
                                  <IconButton label={isEditing ? "Завершить редактирование" : "Редактировать вкладку"} onClick={() => setEditingTopTabId(isEditing ? null : key)}>
                                    {isEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
                                  </IconButton>
                                  <IconButton label={tab.visible === false ? "Вернуть вкладку" : "Скрыть вкладку"} onClick={() => updateCustomTab(tab.id, { visible: tab.visible === false })}>
                                    {tab.visible === false ? <Eye size={16} aria-hidden /> : <EyeOff size={16} aria-hidden />}
                                  </IconButton>
                                  <IconButton label="Удалить вкладку" onClick={() => deleteCustomTab(tab.id)}>
                                    <Trash2 size={16} aria-hidden />
                                  </IconButton>
                                </div>
                              </CompactTd>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={5} style={adminDetailCellStyle}>
                                  {isEditing ? (
                                    <div style={adminInlineEditStyle}>
                                      <Field label="Название вкладки">
                                        <input value={tab.title} onChange={(e) => updateCustomTab(tab.id, { title: e.target.value })} style={inputStyle} />
                                      </Field>
                                      <Field label="Описание вкладки">
                                        <input value={tab.description} onChange={(e) => updateCustomTab(tab.id, { description: e.target.value })} placeholder="Описание" style={inputStyle} />
                                      </Field>
                                    </div>
                                  ) : (
                                    <div style={{ color: "#64748b" }}>{tab.description || "Описание не заполнено."}</div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "minmax(180px, 1fr) minmax(180px, 1fr) auto", gap: 10, alignItems: "end" }}>
                  <Field label="Название новой вкладки">
                    <input value={customTabForm.title} onChange={(e) => setCustomTabForm((current) => ({ ...current, title: e.target.value }))} placeholder="Например: Справочники" style={inputStyle} />
                  </Field>
                  <Field label="Описание новой вкладки">
                    <input value={customTabForm.description} onChange={(e) => setCustomTabForm((current) => ({ ...current, description: e.target.value }))} placeholder="Краткое описание" style={inputStyle} />
                  </Field>
                  <IconButton label="Добавить вкладку" onClick={addCustomTab}>
                    <Plus size={16} aria-hidden />
                  </IconButton>
                </div>
              </div>
            )}

            {adminSection === "structure" && (
              <div style={{ ...blockStyle, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Структура данных</div>
                    <div style={{ color: "#64748b", marginTop: 4 }}>Связка: участки, техника, ПТО, объемы, оперучет, маркзамеры и отчетность.</div>
                  </div>
                </div>
                <SubTabs>
                  <TopButton active={structureSection === "scheme"} onClick={() => setStructureSection("scheme")} label="Схема" />
                  <TopButton active={structureSection === "elements"} onClick={() => setStructureSection("elements")} label="Элементы" />
                  <TopButton active={structureSection === "links"} onClick={() => setStructureSection("links")} label="Связи" />
                  <TopButton active={structureSection === "roles"} onClick={() => setStructureSection("roles")} label="Роли" />
                </SubTabs>

                {structureSection === "scheme" && (
                  <div style={{ ...blockStyle, background: "#ffffff", marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>Поток данных</div>
                    <div style={reportSourceGridStyle}>
                      <SourceNote title="База смены" source="БД" text="дата, участок, техника, рейсы, часы, смена, диспетчер, состояние техники" />
                      <SourceNote title="Справочник техники" source="СводТехники / Список техники" text="марка, модель, госномер, гаражный номер, статус, участок и местоположение" />
                      <SourceNote title="ПТО" source="План, ПланС, График, Объемы кузова" text="план по датам, объем кузова, коэффициенты и плановые показатели" />
                      <SourceNote title="Итог" source="AAM" text="отчетность собирает план, маркзамер, оперучет, производительность и причины" />
                    </div>
                    <div style={dependencyStageGridStyle}>
                      {dependencyStages.map((stage) => (
                        <div key={stage.title} style={dependencyStageStyle}>
                          <div style={{ color: "#475569", fontWeight: 700, marginBottom: 8 }}>{stage.title}</div>
                          <div style={{ display: "grid", gap: 8 }}>
                            {stage.nodeIds.map((nodeId) => {
                              const node = dependencyNodes.find((item) => item.id === nodeId);
                              if (!node) return null;

                              return (
                                <div key={node.id} style={dependencyNodeCardStyle}>
                                  <div style={{ fontWeight: 700 }}>{node.name}</div>
                                  <div style={{ color: "#64748b", fontSize: 13, marginTop: 3 }}>{node.kind} · {node.owner || "Ответственный не задан"}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
                      {dependencyLinks.filter((link) => link.visible).map((link) => (
                        <div key={link.id} style={dependencyLinkCardStyle}>
                          <div style={{ fontWeight: 700 }}>
                            {dependencyNodeLabel(dependencyNodes, link.fromNodeId)} → {dependencyNodeLabel(dependencyNodes, link.toNodeId)}
                          </div>
                          <div style={{ color: "#475569", marginTop: 4 }}>{link.linkType} связь</div>
                          <div style={{ color: "#64748b", marginTop: 6 }}>{link.rule || "Правило не заполнено."}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {structureSection === "elements" && (
                <div style={{ ...blockStyle, background: "#ffffff", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Связка данных и процессов</div>
                  <div style={{ color: "#64748b", marginBottom: 12 }}>Здесь задается, откуда берутся данные и куда они дальше уходят: техника, участки, объемы, ПТО, оперучет, маркзамеры и отчетность.</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", minWidth: 960, borderCollapse: "collapse", fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                          <CompactTh>Элемент</CompactTh>
                          <CompactTh>Тип</CompactTh>
                          <CompactTh>Ответственный</CompactTh>
                          <CompactTh>Показ</CompactTh>
                          <CompactTh>Действия</CompactTh>
                        </tr>
                      </thead>
                      <tbody>
                        {dependencyNodes.map((node) => {
                          const isEditing = editingDependencyNodeId === node.id;

                          return (
                            <Fragment key={node.id}>
                              <tr>
                                <CompactTd>
                                  <div style={vehicleNameStyle}>{node.name || "Без названия"}</div>
                                </CompactTd>
                                <CompactTd>{node.kind || "—"}</CompactTd>
                                <CompactTd>{node.owner || "—"}</CompactTd>
                                <CompactTd>{node.visible ? "Показывается" : "Скрыт"}</CompactTd>
                                <CompactTd>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    <IconButton label={isEditing ? "Завершить редактирование" : "Редактировать элемент"} onClick={() => setEditingDependencyNodeId(isEditing ? null : node.id)}>
                                      {isEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
                                    </IconButton>
                                    <IconButton label={node.visible ? "Скрыть элемент" : "Вернуть элемент"} onClick={() => updateDependencyNode(node.id, "visible", !node.visible)}>
                                      {node.visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                                    </IconButton>
                                    <IconButton label="Удалить элемент" onClick={() => deleteDependencyNode(node.id)}>
                                      <Trash2 size={16} aria-hidden />
                                    </IconButton>
                                  </div>
                                </CompactTd>
                              </tr>
                              {isEditing && (
                                <tr>
                                  <td colSpan={5} style={adminDetailCellStyle}>
                                    <div style={adminInlineEditStyle}>
                                      <Field label="Название элемента">
                                        <input value={node.name} onChange={(e) => updateDependencyNode(node.id, "name", e.target.value)} placeholder="Например: Объемы" style={inputStyle} />
                                      </Field>
                                      <Field label="Тип элемента">
                                        <input value={node.kind} onChange={(e) => updateDependencyNode(node.id, "kind", e.target.value)} placeholder="Справочник, расчет, факт" style={inputStyle} />
                                      </Field>
                                      <Field label="Ответственный">
                                        <input value={node.owner} onChange={(e) => updateDependencyNode(node.id, "owner", e.target.value)} placeholder="Например: ПТО" style={inputStyle} />
                                      </Field>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)) auto", gap: 10, alignItems: "end" }}>
                    <Field label="Новый элемент">
                      <input value={dependencyNodeForm.name} onChange={(e) => updateDependencyNodeForm("name", e.target.value)} placeholder="Например: Взвешивание" style={inputStyle} />
                    </Field>
                    <Field label="Тип">
                      <input value={dependencyNodeForm.kind} onChange={(e) => updateDependencyNodeForm("kind", e.target.value)} placeholder="Справочник / расчет / факт" style={inputStyle} />
                    </Field>
                    <Field label="Ответственный">
                      <input value={dependencyNodeForm.owner} onChange={(e) => updateDependencyNodeForm("owner", e.target.value)} placeholder="Ответственный" style={inputStyle} />
                    </Field>
                    <IconButton label="Добавить элемент" onClick={addDependencyNode}>
                      <Plus size={16} aria-hidden />
                    </IconButton>
                  </div>
                </div>
                )}

                {structureSection === "links" && (
                <div style={{ ...blockStyle, background: "#ffffff", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>Связи зависимостей</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", minWidth: 1180, borderCollapse: "collapse", fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                          <CompactTh>Откуда</CompactTh>
                          <CompactTh>Тип связи</CompactTh>
                          <CompactTh>Куда</CompactTh>
                          <CompactTh>Правило / что передает</CompactTh>
                          <CompactTh>Ответственный</CompactTh>
                          <CompactTh>Показ</CompactTh>
                          <CompactTh>Действия</CompactTh>
                        </tr>
                      </thead>
                      <tbody>
                        {dependencyLinks.map((link) => {
                          const isEditing = editingDependencyLinkId === link.id;

                          return (
                            <Fragment key={link.id}>
                              <tr>
                                <CompactTd>{dependencyNodeLabel(dependencyNodes, link.fromNodeId)}</CompactTd>
                                <CompactTd>{link.linkType}</CompactTd>
                                <CompactTd>{dependencyNodeLabel(dependencyNodes, link.toNodeId)}</CompactTd>
                                <CompactTd>{link.rule || "—"}</CompactTd>
                                <CompactTd>{link.owner || "—"}</CompactTd>
                                <CompactTd>{link.visible ? "Показывается" : "Скрыта"}</CompactTd>
                                <CompactTd>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    <IconButton label={isEditing ? "Завершить редактирование" : "Редактировать связь"} onClick={() => setEditingDependencyLinkId(isEditing ? null : link.id)}>
                                      {isEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
                                    </IconButton>
                                    <IconButton label={link.visible ? "Скрыть связь" : "Вернуть связь"} onClick={() => updateDependencyLink(link.id, "visible", !link.visible)}>
                                      {link.visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                                    </IconButton>
                                    <IconButton label="Удалить связь" onClick={() => deleteDependencyLink(link.id)}>
                                      <Trash2 size={16} aria-hidden />
                                    </IconButton>
                                  </div>
                                </CompactTd>
                              </tr>
                              {isEditing && (
                                <tr>
                                  <td colSpan={7} style={adminDetailCellStyle}>
                                    <div style={adminInlineEditStyle}>
                                      <Field label="Откуда">
                                        <select value={link.fromNodeId} onChange={(e) => updateDependencyLink(link.id, "fromNodeId", e.target.value)} style={inputStyle}>
                                          {dependencyNodes.map((node) => (
                                            <option key={node.id} value={node.id}>{node.name}</option>
                                          ))}
                                        </select>
                                      </Field>
                                      <Field label="Тип связи">
                                        <select value={link.linkType} onChange={(e) => updateDependencyLink(link.id, "linkType", e.target.value as DependencyLinkType)} style={inputStyle}>
                                          <option value="Линейная">Линейная</option>
                                          <option value="Функциональная">Функциональная</option>
                                        </select>
                                      </Field>
                                      <Field label="Куда">
                                        <select value={link.toNodeId} onChange={(e) => updateDependencyLink(link.id, "toNodeId", e.target.value)} style={inputStyle}>
                                          {dependencyNodes.map((node) => (
                                            <option key={node.id} value={node.id}>{node.name}</option>
                                          ))}
                                        </select>
                                      </Field>
                                      <Field label="Правило / что передает">
                                        <input value={link.rule} onChange={(e) => updateDependencyLink(link.id, "rule", e.target.value)} placeholder="Например: рейсы × объем кузова" style={inputStyle} />
                                      </Field>
                                      <Field label="Ответственный">
                                        <input value={link.owner} onChange={(e) => updateDependencyLink(link.id, "owner", e.target.value)} placeholder="Например: ПТО" style={inputStyle} />
                                      </Field>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)) auto", gap: 10, alignItems: "end" }}>
                    <Field label="Откуда">
                      <select value={dependencyLinkForm.fromNodeId} onChange={(e) => updateDependencyLinkForm("fromNodeId", e.target.value)} style={inputStyle}>
                        {dependencyNodes.map((node) => (
                          <option key={node.id} value={node.id}>{node.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Тип связи">
                      <select value={dependencyLinkForm.linkType} onChange={(e) => updateDependencyLinkForm("linkType", e.target.value as DependencyLinkType)} style={inputStyle}>
                        <option value="Линейная">Линейная</option>
                        <option value="Функциональная">Функциональная</option>
                      </select>
                    </Field>
                    <Field label="Куда">
                      <select value={dependencyLinkForm.toNodeId} onChange={(e) => updateDependencyLinkForm("toNodeId", e.target.value)} style={inputStyle}>
                        {dependencyNodes.map((node) => (
                          <option key={node.id} value={node.id}>{node.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Правило">
                      <input value={dependencyLinkForm.rule} onChange={(e) => updateDependencyLinkForm("rule", e.target.value)} placeholder="Что передает / как считается" style={inputStyle} />
                    </Field>
                    <Field label="Ответственный">
                      <input value={dependencyLinkForm.owner} onChange={(e) => updateDependencyLinkForm("owner", e.target.value)} placeholder="Ответственный" style={inputStyle} />
                    </Field>
                    <IconButton label="Добавить связь" onClick={addDependencyLink}>
                      <Plus size={16} aria-hidden />
                    </IconButton>
                  </div>
                </div>
                )}

                {structureSection === "roles" && (
                <>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Сотрудники и роли</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: 1120, borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                        <CompactTh>Сотрудник / роль</CompactTh>
                        <CompactTh>Подразделение</CompactTh>
                        <CompactTh>Линейный руководитель</CompactTh>
                        <CompactTh>Функциональный руководитель</CompactTh>
                        <CompactTh>Статус</CompactTh>
                        <CompactTh>Действия</CompactTh>
                      </tr>
                    </thead>
                    <tbody>
                      {orgMembers.map((member) => {
                        const isEditing = editingOrgMemberId === member.id;
                        const managerOptions = orgMembers.filter((candidate) => candidate.id !== member.id);
                        const linearManager = orgMembers.find((candidate) => candidate.id === member.linearManagerId);
                        const functionalManager = orgMembers.find((candidate) => candidate.id === member.functionalManagerId);

                        return (
                          <Fragment key={member.id}>
                            <tr>
                              <CompactTd>
                                <div style={vehicleNameStyle}>{member.name || "Без названия"}</div>
                                <VehicleMeta label="Должность" value={member.position} />
                              </CompactTd>
                              <CompactTd>
                                <VehicleMeta label="Отдел" value={member.department} />
                                <VehicleMeta label="Участок" value={member.area} />
                              </CompactTd>
                              <CompactTd>{orgMemberLabel(linearManager)}</CompactTd>
                              <CompactTd>{orgMemberLabel(functionalManager)}</CompactTd>
                              <CompactTd>{member.active ? "Активен" : "Скрыт"}</CompactTd>
                              <CompactTd>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <IconButton label={isEditing ? "Завершить редактирование" : "Редактировать связь"} onClick={() => setEditingOrgMemberId(isEditing ? null : member.id)}>
                                    {isEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
                                  </IconButton>
                                  <IconButton label={member.active ? "Скрыть из структуры" : "Вернуть в структуру"} onClick={() => updateOrgMember(member.id, "active", !member.active)}>
                                    {member.active ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                                  </IconButton>
                                  <IconButton label="Удалить связь" onClick={() => deleteOrgMember(member.id)}>
                                    <Trash2 size={16} aria-hidden />
                                  </IconButton>
                                </div>
                              </CompactTd>
                            </tr>
                            {isEditing && (
                              <tr>
                                <td colSpan={6} style={adminDetailCellStyle}>
                                  <div style={adminInlineEditStyle}>
                                    <Field label="Сотрудник / роль">
                                      <input value={member.name} onChange={(e) => updateOrgMember(member.id, "name", e.target.value)} placeholder="Например: Диспетчер смены" style={inputStyle} />
                                    </Field>
                                    <Field label="Должность">
                                      <input value={member.position} onChange={(e) => updateOrgMember(member.id, "position", e.target.value)} placeholder="Например: Диспетчер" style={inputStyle} />
                                    </Field>
                                    <Field label="Подразделение">
                                      <input value={member.department} onChange={(e) => updateOrgMember(member.id, "department", e.target.value)} placeholder="Например: ПТО" style={inputStyle} />
                                    </Field>
                                    <Field label="Участок">
                                      <input value={member.area} onChange={(e) => updateOrgMember(member.id, "area", e.target.value)} placeholder="Например: Аксу" style={inputStyle} />
                                    </Field>
                                    <Field label="Линейный руководитель">
                                      <select value={member.linearManagerId} onChange={(e) => updateOrgMember(member.id, "linearManagerId", e.target.value)} style={inputStyle}>
                                        <option value="">Не назначен</option>
                                        {managerOptions.map((candidate) => (
                                          <option key={candidate.id} value={candidate.id}>{orgMemberLabel(candidate)}</option>
                                        ))}
                                      </select>
                                    </Field>
                                    <Field label="Функциональный руководитель">
                                      <select value={member.functionalManagerId} onChange={(e) => updateOrgMember(member.id, "functionalManagerId", e.target.value)} style={inputStyle}>
                                        <option value="">Не назначен</option>
                                        {managerOptions.map((candidate) => (
                                          <option key={candidate.id} value={candidate.id}>{orgMemberLabel(candidate)}</option>
                                        ))}
                                      </select>
                                    </Field>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)) auto", gap: 10, alignItems: "end" }}>
                  <Field label="Сотрудник / роль">
                    <input value={orgMemberForm.name} onChange={(e) => updateOrgMemberForm("name", e.target.value)} placeholder="Например: Геолог" style={inputStyle} />
                  </Field>
                  <Field label="Должность">
                    <input value={orgMemberForm.position} onChange={(e) => updateOrgMemberForm("position", e.target.value)} placeholder="Должность" style={inputStyle} />
                  </Field>
                  <Field label="Подразделение">
                    <input value={orgMemberForm.department} onChange={(e) => updateOrgMemberForm("department", e.target.value)} placeholder="Отдел" style={inputStyle} />
                  </Field>
                  <Field label="Участок">
                    <input value={orgMemberForm.area} onChange={(e) => updateOrgMemberForm("area", e.target.value)} placeholder="Участок" style={inputStyle} />
                  </Field>
                  <Field label="Линейный руководитель">
                    <select value={orgMemberForm.linearManagerId} onChange={(e) => updateOrgMemberForm("linearManagerId", e.target.value)} style={inputStyle}>
                      <option value="">Не назначен</option>
                      {orgMembers.map((member) => (
                        <option key={member.id} value={member.id}>{orgMemberLabel(member)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Функциональный руководитель">
                    <select value={orgMemberForm.functionalManagerId} onChange={(e) => updateOrgMemberForm("functionalManagerId", e.target.value)} style={inputStyle}>
                      <option value="">Не назначен</option>
                      {orgMembers.map((member) => (
                        <option key={member.id} value={member.id}>{orgMemberLabel(member)}</option>
                      ))}
                    </select>
                  </Field>
                  <IconButton label="Добавить связь" onClick={addOrgMember}>
                    <Plus size={16} aria-hidden />
                  </IconButton>
                </div>
                </>
                )}
              </div>
            )}

            {adminSection === "subtabs" && (
            <div style={{ ...blockStyle, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Подвкладки</div>
              <div style={{ display: "grid", gap: 14 }}>
                {(Object.keys(subTabs) as EditableSubtabGroup[]).map((group) => (
                  <div key={group} style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ color: "#475569", fontWeight: 700 }}>{subtabGroupLabels[group]}</div>
                      <TopButton active={false} onClick={() => setNewSubTabForm((current) => ({ ...current, group }))} label="Добавить сюда" />
                    </div>
                    {subTabs[group].map((tab) => (
                      <div key={tab.id} style={{ display: "grid", gap: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{tab.label}</div>
                            <div style={{ color: "#64748b", marginTop: 4 }}>{tab.visible ? "Показывается" : "Скрыта"}</div>
                          </div>
                          <TopButton active={editingSubTabId === tab.id} onClick={() => setEditingSubTabId(editingSubTabId === tab.id ? null : tab.id)} label={editingSubTabId === tab.id ? "Готово" : "Редактировать"} />
                          <TopButton
                            active={tab.visible}
                            onClick={() => (tab.visible ? removeSubTab(group, tab.id) : showSubTab(group, tab.id))}
                            label={tab.visible ? "Удалить" : "Вернуть"}
                          />
                        </div>
                        {editingSubTabId === tab.id && (
                          <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 260px) 1fr", gap: 10, alignItems: "center" }}>
                            <Field label="Название подвкладки">
                              <input value={tab.label} onChange={(e) => updateSubTabLabel(group, tab.id, e.target.value)} style={inputStyle} />
                            </Field>
                            <Field label="Текст подвкладки">
                              <input value={tab.content ?? ""} onChange={(e) => updateSubTabContent(group, tab.id, e.target.value)} placeholder="Текст для этой подвкладки" style={inputStyle} />
                            </Field>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "180px minmax(180px, 1fr) minmax(180px, 1fr) auto", gap: 10, alignItems: "center" }}>
                <Field label="Раздел">
                  <select value={newSubTabForm.group} onChange={(e) => setNewSubTabForm((current) => ({ ...current, group: e.target.value as EditableSubtabGroup }))} style={inputStyle}>
                    {(Object.keys(subtabGroupLabels) as EditableSubtabGroup[]).map((group) => (
                      <option key={group} value={group}>{subtabGroupLabels[group]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Название подвкладки">
                  <input value={newSubTabForm.label} onChange={(e) => setNewSubTabForm((current) => ({ ...current, label: e.target.value }))} placeholder="Например: Сменный журнал" style={inputStyle} />
                </Field>
                <Field label="Текст подвкладки">
                  <input value={newSubTabForm.content} onChange={(e) => setNewSubTabForm((current) => ({ ...current, content: e.target.value }))} placeholder="Текст для новой подвкладки" style={inputStyle} />
                </Field>
                <TopButton active onClick={addSubTab} label="Добавить подвкладку" />
              </div>
            </div>
            )}

            {adminSection === "vehicles" && (
              <div style={{ ...blockStyle, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700 }}>Техника</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <IconButton label="Добавить технику" onClick={openNewVehicleCard}>
                      <Plus size={16} aria-hidden />
                    </IconButton>
                    <IconButton label="Выгрузить список техники в Excel" onClick={exportVehiclesToExcel}>
                      <Download size={16} aria-hidden />
                    </IconButton>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: 1080, borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                        <CompactTh>Показ</CompactTh>
                        <CompactTh>Техника</CompactTh>
                        <CompactTh>Номера</CompactTh>
                        <CompactTh>Расход</CompactTh>
                        <CompactTh>Собственник</CompactTh>
                        <CompactTh>Действия</CompactTh>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicleRows.map((vehicle) => (
                        <tr key={vehicle.id}>
                          <CompactTd>
                            <input
                              aria-label={`Показывать ${buildVehicleDisplayName(vehicle)}`}
                              checked={vehicle.visible !== false}
                              onChange={() => toggleVehicleVisibility(vehicle.id)}
                              type="checkbox"
                            />
                          </CompactTd>
                          <CompactTd>
                            <div style={vehicleNameStyle}>{buildVehicleDisplayName(vehicle)}</div>
                            <VehicleMeta label="Марка" value={vehicle.brand} />
                            <VehicleMeta label="Модель" value={vehicle.model} />
                            <VehicleMeta label="Вид техники" value={vehicle.vehicleType} />
                          </CompactTd>
                          <CompactTd>
                            <VehicleMeta label="Гаражный №" value={vehicle.garageNumber} />
                            <VehicleMeta label="Госномер" value={vehicle.plateNumber} />
                            <VehicleMeta label="VIN" value={vehicle.vin} />
                          </CompactTd>
                          <CompactTd>
                            <VehicleMeta label="Зима" value={vehicle.fuelNormWinter ? `${vehicle.fuelNormWinter}` : ""} />
                            <VehicleMeta label="Лето" value={vehicle.fuelNormSummer ? `${vehicle.fuelNormSummer}` : ""} />
                            <VehicleMeta label="Расчет" value={vehicle.fuelCalcType} />
                          </CompactTd>
                          <CompactTd>
                            <VehicleMeta label="Собственник" value={vehicle.owner} />
                          </CompactTd>
                          <CompactTd>
                            <div style={{ display: "flex", gap: 6 }}>
                              <IconButton label={`Редактировать ${buildVehicleDisplayName(vehicle)}`} onClick={() => openVehicleCard(vehicle)}>
                                <Pencil size={16} aria-hidden />
                              </IconButton>
                              <IconButton label={`Удалить ${buildVehicleDisplayName(vehicle)}`} onClick={() => deleteVehicle(vehicle.id)}>
                                <Trash2 size={16} aria-hidden />
                              </IconButton>
                            </div>
                          </CompactTd>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: adminSection === "reports" || adminSection === "content" ? "grid" : "none", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
              <div style={{ ...blockStyle, display: adminSection === "reports" ? "block" : "none" }}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Добавить строку отчетности</div>
                <div style={{ display: "grid", gap: 10 }}>
                  <Field label="Участок">
                    <select value={reportForm.area} onChange={(e) => updateReportForm("area", e.target.value)} style={inputStyle}>
                      {reportAreas.map((area) => (
                        <option key={area}>{area}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Название показателя">
                    <input value={reportForm.name} onChange={(e) => updateReportForm("name", e.target.value)} placeholder="Например: Подача руды на ЗИФ" style={inputStyle} />
                  </Field>
                  <Field label="Единица измерения">
                    <input value={reportForm.unit} onChange={(e) => updateReportForm("unit", e.target.value)} placeholder="м3, тн, м2" style={inputStyle} />
                  </Field>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
                    <Field label="План за сутки">
                      <input type="number" value={reportForm.dayPlan} onChange={(e) => updateReportForm("dayPlan", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Оперучет за сутки">
                      <input type="number" value={reportForm.dayFact} onChange={(e) => updateReportForm("dayFact", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Производительность за сутки">
                      <input type="number" value={reportForm.dayProductivity} onChange={(e) => updateReportForm("dayProductivity", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="План месяца всего">
                      <input type="number" value={reportForm.monthTotalPlan} onChange={(e) => updateReportForm("monthTotalPlan", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="План с начала месяца">
                      <input type="number" value={reportForm.monthPlan} onChange={(e) => updateReportForm("monthPlan", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Маркзамер месяца">
                      <input type="number" value={reportForm.monthSurveyFact} onChange={(e) => updateReportForm("monthSurveyFact", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Оперучет после замера">
                      <input type="number" value={reportForm.monthOperFact} onChange={(e) => updateReportForm("monthOperFact", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Факт за месяц">
                      <input type="number" value={reportForm.monthFact} onChange={(e) => updateReportForm("monthFact", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Производительность накоплением">
                      <input type="number" value={reportForm.monthProductivity} onChange={(e) => updateReportForm("monthProductivity", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="План с начала года">
                      <input type="number" value={reportForm.yearPlan} onChange={(e) => updateReportForm("yearPlan", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Маркзамер с начала года">
                      <input type="number" value={reportForm.yearSurveyFact} onChange={(e) => updateReportForm("yearSurveyFact", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Оперучет недостающих дней">
                      <input type="number" value={reportForm.yearOperFact} onChange={(e) => updateReportForm("yearOperFact", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Факт с начала года">
                      <input type="number" value={reportForm.yearFact} onChange={(e) => updateReportForm("yearFact", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Годовой план">
                      <input type="number" value={reportForm.annualPlan} onChange={(e) => updateReportForm("annualPlan", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Факт годового плана">
                      <input type="number" value={reportForm.annualFact} onChange={(e) => updateReportForm("annualFact", e.target.value)} style={inputStyle} />
                    </Field>
                  </div>
                  <Field label="Причина отклонения за сутки">
                    <textarea value={reportForm.dayReason} onChange={(e) => updateReportForm("dayReason", e.target.value)} placeholder="Например: простой ДСК, ремонт техники, погодные условия" style={{ ...inputStyle, minHeight: 74, resize: "vertical" }} />
                  </Field>
                  <Field label="Причины с начала года">
                    <textarea value={reportForm.yearReason} onChange={(e) => updateReportForm("yearReason", e.target.value)} placeholder="Накопленные причины невыполнения" style={{ ...inputStyle, minHeight: 74, resize: "vertical" }} />
                  </Field>
                  <TopButton active onClick={addReportRow} label="Добавить в отчетность" />
                </div>
              </div>

              <div style={{ ...blockStyle, display: adminSection === "content" ? "block" : "none" }}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Добавить информацию во вкладку</div>
                <div style={{ display: "grid", gap: 10 }}>
                  <Field label="Вкладка">
                    <select value={customInfoTabId} onChange={(e) => setCustomInfoTabId(e.target.value)} style={inputStyle}>
                      <option value="">Выбери вкладку</option>
                      {customTabs.map((tab) => (
                        <option key={tab.id} value={tab.id}>{tab.title}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Текст для вкладки">
                    <textarea value={customInfoForm} onChange={(e) => setCustomInfoForm(e.target.value)} placeholder="Текст, который нужно показать во вкладке" style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} />
                  </Field>
                  <TopButton active onClick={addCustomInfo} label="Добавить информацию" />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, display: adminSection === "reports" ? "block" : "none" }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Текущая отчетность</div>
              <div style={{ display: "grid", gap: 10 }}>
                {reportRows.map((row, index) => (
                  <div key={`${row.area}-${row.name}-${index}`} style={{ ...blockStyle, display: "grid", gap: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 120px auto", gap: 10, alignItems: "center" }}>
                      <Field label="Участок">
                        <select value={row.area} onChange={(e) => updateReportRow(index, "area", e.target.value)} style={inputStyle}>
                          {reportAreas.map((area) => (
                            <option key={area}>{area}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Название показателя">
                        <input value={row.name} onChange={(e) => updateReportRow(index, "name", e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label="Ед. изм.">
                        <input value={row.unit} onChange={(e) => updateReportRow(index, "unit", e.target.value)} style={inputStyle} />
                      </Field>
                      <TopButton active={false} onClick={() => removeReportRow(index)} label="Удалить" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                      <Field label="План сутки">
                        <input type="number" value={row.dayPlan} onChange={(e) => updateReportRow(index, "dayPlan", e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label="Оперучет сутки">
                        <input type="number" value={row.dayFact} onChange={(e) => updateReportRow(index, "dayFact", e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label="Произв. сутки">
                        <input type="number" value={row.dayProductivity} onChange={(e) => updateReportRow(index, "dayProductivity", e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label="План месяца">
                        <input type="number" value={row.monthTotalPlan} onChange={(e) => updateReportRow(index, "monthTotalPlan", e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label="План с начала месяца">
                        <input type="number" value={row.monthPlan} onChange={(e) => updateReportRow(index, "monthPlan", e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label="Маркзамер месяца">
                        <input type="number" value={row.monthSurveyFact} onChange={(e) => updateReportRow(index, "monthSurveyFact", e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label="Оперучет после замера">
                        <input type="number" value={row.monthOperFact} onChange={(e) => updateReportRow(index, "monthOperFact", e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label="Факт месяц">
                        <input type="number" value={row.monthFact} onChange={(e) => updateReportRow(index, "monthFact", e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label="Произв. накоплением">
                        <input type="number" value={row.monthProductivity} onChange={(e) => updateReportRow(index, "monthProductivity", e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label="План с начала года">
                        <input type="number" value={row.yearPlan} onChange={(e) => updateReportRow(index, "yearPlan", e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label="Маркзамер год">
                        <input type="number" value={row.yearSurveyFact} onChange={(e) => updateReportRow(index, "yearSurveyFact", e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label="Оперучет хвост">
                        <input type="number" value={row.yearOperFact} onChange={(e) => updateReportRow(index, "yearOperFact", e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label="Факт с начала года">
                        <input type="number" value={row.yearFact} onChange={(e) => updateReportRow(index, "yearFact", e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label="Годовой план">
                        <input type="number" value={row.annualPlan} onChange={(e) => updateReportRow(index, "annualPlan", e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label="Факт годового плана">
                        <input type="number" value={row.annualFact} onChange={(e) => updateReportRow(index, "annualFact", e.target.value)} style={inputStyle} />
                      </Field>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
                      <Field label="Причина за сутки">
                        <textarea value={row.dayReason} onChange={(e) => updateReportRow(index, "dayReason", e.target.value)} style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} />
                      </Field>
                      <Field label="Причины с начала года">
                        <textarea value={row.yearReason} onChange={(e) => updateReportRow(index, "yearReason", e.target.value)} style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16, display: adminSection === "content" ? "block" : "none" }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Информация в пользовательских вкладках</div>
              <div style={{ display: "grid", gap: 10 }}>
                {customTabs.length === 0 && (
                  <div style={blockStyle}>Пользовательских вкладок пока нет.</div>
                )}
                {customTabs.map((tab) => (
                  <div key={tab.id} style={{ ...blockStyle, display: "grid", gap: 10 }}>
                    <div style={{ fontWeight: 700 }}>{tab.title}</div>
                    {tab.items.length === 0 && (
                      <div style={{ color: "#64748b" }}>Информации пока нет.</div>
                    )}
                    {tab.items.map((item, index) => (
                      <div key={`${tab.id}-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "start" }}>
                        <Field label="Текстовый блок">
                          <textarea value={item} onChange={(e) => updateCustomInfo(tab.id, index, e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
                        </Field>
                        <TopButton active={false} onClick={() => deleteCustomInfo(tab.id, index)} label="Удалить" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {vehicleCard && (
              <div style={modalOverlayStyle}>
                <div style={vehicleCardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>Карточка техники</div>
                    <TopButton active={false} onClick={() => setVehicleCard(null)} label="Закрыть" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                    <Field label="Отображаемое имя">
                      <div style={displayNamePreviewStyle}>{buildVehicleDisplayName(vehicleCard)}</div>
                    </Field>
                    <Field label="Марка">
                      <input value={vehicleCard.brand} onChange={(e) => updateVehicleCard("brand", e.target.value)} placeholder="Например: Shacman" style={inputStyle} />
                    </Field>
                    <Field label="Модель">
                      <input value={vehicleCard.model} onChange={(e) => updateVehicleCard("model", e.target.value)} placeholder="Например: X3000" style={inputStyle} />
                    </Field>
                    <Field label="Госномер (при его наличии)">
                      <input value={vehicleCard.plateNumber} onChange={(e) => updateVehicleCard("plateNumber", e.target.value)} placeholder="Госномер" style={inputStyle} />
                    </Field>
                    <Field label="Гаражный номер">
                      <input value={vehicleCard.garageNumber} onChange={(e) => updateVehicleCard("garageNumber", e.target.value)} placeholder="Например: 22" style={inputStyle} />
                    </Field>
                    <Field label="Вид техники">
                      <input value={vehicleCard.vehicleType} onChange={(e) => updateVehicleCard("vehicleType", e.target.value)} placeholder="Например: Самосвал" style={inputStyle} />
                    </Field>
                    <Field label="Норма расхода: Зима">
                      <input type="number" value={vehicleCard.fuelNormWinter} onChange={(e) => updateVehicleCard("fuelNormWinter", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Норма расхода: Лето">
                      <input type="number" value={vehicleCard.fuelNormSummer} onChange={(e) => updateVehicleCard("fuelNormSummer", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Расчет расхода">
                      <select value={vehicleCard.fuelCalcType} onChange={(e) => updateVehicleCard("fuelCalcType", e.target.value)} style={inputStyle}>
                        <option value="Моточасы">Моточасы</option>
                        <option value="Пробег">Пробег</option>
                      </select>
                    </Field>
                    <Field label="VIN">
                      <input value={vehicleCard.vin} onChange={(e) => updateVehicleCard("vin", e.target.value)} placeholder="VIN" style={inputStyle} />
                    </Field>
                    <Field label="Собственник">
                      <input value={vehicleCard.owner} onChange={(e) => updateVehicleCard("owner", e.target.value)} placeholder="Название собственника" style={inputStyle} />
                    </Field>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                    <TopButton active={false} onClick={() => setVehicleCard(null)} label="Отмена" />
                    <TopButton active onClick={saveVehicleCard} label="Сохранить технику" />
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ color: "#64748b" }}>{saveMessage}</div>
              <TopButton active onClick={saveAdminChanges} label="Сохранить изменения" />
            </div>
          </SectionCard>
        )}

        {activeCustomTab && (
          <SectionCard title={activeCustomTab.title}>
            <div style={{ display: "grid", gap: 16 }}>
              {activeCustomTab.description && <div style={{ color: "#475569" }}>{activeCustomTab.description}</div>}
              {activeCustomTab.items.length > 0 ? (
                activeCustomTab.items.map((item, index) => (
                  <div key={`${activeCustomTab.id}-${index}`} style={blockStyle}>{item}</div>
                ))
              ) : (
                <div style={blockStyle}>Во вкладке пока нет информации.</div>
              )}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

function TopButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? "1px solid #0f172a" : "1px solid #cbd5e1",
        background: active ? "#0f172a" : "#ffffff",
        color: active ? "#ffffff" : "#0f172a",
        borderRadius: 8,
        padding: "7px 10px",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        lineHeight: 1.2,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function HeaderSubButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        onClick();
        event.currentTarget.blur();
      }}
      style={{
        ...headerSubtabButtonStyle,
        ...(active ? headerSubtabButtonActiveStyle : null),
      }}
    >
      {label}
    </button>
  );
}

function IconButton({ label, onClick, children, disabled = false }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button aria-label={label} disabled={disabled} title={label} onClick={onClick} style={disabled ? { ...iconButtonStyle, cursor: "not-allowed", opacity: 0.45 } : iconButtonStyle} type="button">
      {children}
    </button>
  );
}

function SectionCard({ title, children, fill = false }: { title: string; children: React.ReactNode; fill?: boolean }) {
  return (
    <div style={{ ...sectionCardStyle, ...(fill ? sectionCardFillStyle : null) }}>
      {title ? <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{title}</div> : null}
      {children}
    </div>
  );
}

function SubTabs({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      {children}
    </label>
  );
}

function SourceNote({ title, source, text }: { title: string; source: string; text: string }) {
  return (
    <div style={sourceNoteStyle}>
      <div style={{ fontWeight: 800 }}>{title}</div>
      <div style={{ color: "#0f172a", marginTop: 4 }}>{source}</div>
      <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{text}</div>
    </div>
  );
}

function ReportCompletionGauge({
  title,
  percent,
  fact,
  plan,
  monthPlan,
  lag,
  overPlanPerDay,
  remainingDays,
}: {
  title: string;
  percent: number;
  fact: number;
  plan: number;
  monthPlan: number;
  lag: number;
  overPlanPerDay: number;
  remainingDays: number;
}) {
  const visiblePercent = Math.max(0, Math.min(percent, 100));
  const deltaValue = fact - plan;

  return (
    <div style={reportGaugeStyle} aria-label={`Выполнение плана: ${percent}%`}>
      <div style={{ ...reportGaugeCircleStyle, background: `conic-gradient(#16a34a ${visiblePercent * 3.6}deg, #e2e8f0 0deg)` }}>
        <div style={reportGaugeInnerStyle}>
          <span style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{percent}%</span>
          <span style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>план</span>
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Участок {title}</div>
        <div style={{ color: "#64748b", marginTop: 3 }}>Выполнение плана с начала месяца</div>
        <div style={reportGaugeStatsStyle}>
          <span>План месяца: <strong>{formatNumber(monthPlan)}</strong></span>
          <span>План к дате: <strong>{formatNumber(plan)}</strong></span>
          <span>Факт к дате: <strong>{formatNumber(fact)}</strong></span>
          <span style={{ color: deltaValue < 0 ? "#991b1b" : "#166534" }}>Откл.: <strong>{formatNumber(deltaValue)}</strong></span>
        </div>
        <div style={reportCatchUpStyle}>
          <span style={{ color: lag > 0 ? "#991b1b" : "#166534" }}>Отставание на дату: <strong>{formatNumber(lag)}</strong></span>
          <span>Чтобы догнать: <strong>{formatNumber(lag)}</strong> сверх оставшегося плана</span>
          <span>Сверх плана в день: <strong>{formatNumber(overPlanPerDay)}</strong>{remainingDays ? ` (${remainingDays} дн.)` : ""}</span>
        </div>
      </div>
    </div>
  );
}

function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return <span style={{ padding: "6px 10px", borderRadius: 999, background: bg, color, fontWeight: 700, display: "inline-block" }}>{children}</span>;
}

function VehicleMeta({ label, value }: { label: string; value: React.ReactNode }) {
  const renderedValue = value === "" || value === null || value === undefined ? "—" : value;

  return (
    <div style={{ display: "flex", gap: 5, alignItems: "baseline", minHeight: 20 }}>
      <span style={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>{label}:</span>
      <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700, wordBreak: "break-word" }}>{renderedValue}</span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: 12, borderBottom: "1px solid #cbd5e1", whiteSpace: "nowrap" }}>{children}</th>;
}

function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return <td style={{ padding: 12, whiteSpace: "nowrap", fontWeight: strong ? 700 : 400 }}>{children}</td>;
}

function CompactTh({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "8px 10px", borderBottom: "1px solid #cbd5e1", whiteSpace: "nowrap" }}>{children}</th>;
}

function CompactTd({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "8px 10px", borderBottom: "1px solid #e2e8f0", verticalAlign: "top" }}>{children}</td>;
}

function ReportTh({ children, colSpan = 1, rowSpan = 1 }: { children: React.ReactNode; colSpan?: number; rowSpan?: number }) {
  return <th colSpan={colSpan} rowSpan={rowSpan} style={reportThStyle}>{children}</th>;
}

function ReportTd({ children, strong = false, align = "left", tone, colSpan = 1 }: { children: React.ReactNode; strong?: boolean; align?: "left" | "right" | "center"; tone?: "good" | "bad"; colSpan?: number }) {
  const color = tone === "good" ? "#166534" : tone === "bad" ? "#991b1b" : "#0f172a";

  return <td colSpan={colSpan} style={{ ...reportTdStyle, textAlign: align, fontWeight: strong ? 700 : 400, color }}>{children}</td>;
}

function PtoPlanTh({
  children,
  colSpan = 1,
  rowSpan = 1,
  align = "left",
  columnKey,
  width,
  onResizeStart,
}: {
  children: React.ReactNode;
  colSpan?: number;
  rowSpan?: number;
  align?: React.CSSProperties["textAlign"];
  columnKey?: string;
  width?: number;
  onResizeStart?: (event: React.MouseEvent<HTMLElement>, key: string, width: number) => void;
}) {
  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      style={{
        ...ptoPlanThStyle,
        textAlign: align,
        ...(width ? { width, minWidth: width, maxWidth: width } : null),
      }}
    >
      <div style={ptoHeaderContentStyle}>{children}</div>
      {columnKey && width && onResizeStart ? (
        <span
          onMouseDown={(event) => onResizeStart(event, columnKey, width)}
          style={ptoColumnResizeHandleStyle}
          title="Потяни, чтобы изменить ширину столбца"
          aria-hidden
        />
      ) : null}
    </th>
  );
}

function PtoPlanTd({ children, colSpan = 1, active = false, selected = false, editing = false, align }: { children: React.ReactNode; colSpan?: number; active?: boolean; selected?: boolean; editing?: boolean; align?: React.CSSProperties["textAlign"] }) {
  return (
    <td
      colSpan={colSpan}
      style={{
        ...ptoPlanTdStyle,
        ...(align ? { textAlign: align } : null),
        ...(selected ? ptoSelectedFormulaCellStyle : null),
        ...(editing ? ptoEditingFormulaCellStyle : null),
        ...(active ? ptoActiveFormulaCellStyle : null),
      }}
    >
      {children}
    </td>
  );
}

function ReportMetric({ value, note }: { value: string; note: string }) {
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <span style={{ fontWeight: 700 }}>{value}</span>
      <span style={{ color: "#64748b", fontSize: 11, lineHeight: 1.2 }}>{note}</span>
    </div>
  );
}

const blockStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
};

const sectionCardStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
  marginBottom: 20,
};

const sectionCardFillStyle: React.CSSProperties = {
  minHeight: 0,
  height: "100%",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  marginBottom: 0,
};

const reportTableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 2300,
  borderCollapse: "collapse",
  fontSize: 12,
  background: "#ffffff",
};

const reportSourceGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
  marginBottom: 14,
};

const sourceNoteStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 10,
  minHeight: 92,
};

const reportGaugeGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 10,
  marginBottom: 14,
};

const reportGaugeStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 14,
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const reportGaugeCircleStyle: React.CSSProperties = {
  width: 92,
  height: 92,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  flex: "0 0 92px",
};

const reportGaugeInnerStyle: React.CSSProperties = {
  width: 68,
  height: 68,
  borderRadius: "50%",
  background: "#ffffff",
  display: "grid",
  placeItems: "center",
  alignContent: "center",
};

const reportGaugeStatsStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 10,
  color: "#0f172a",
};

const reportCatchUpStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  marginTop: 10,
  color: "#0f172a",
  fontSize: 13,
};

const reportThStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  color: "#0f172a",
  fontWeight: 800,
  textAlign: "center",
  verticalAlign: "middle",
  lineHeight: 1.25,
};

const reportTdStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #e2e8f0",
  verticalAlign: "top",
  lineHeight: 1.3,
};

const ptoPlanTableStyle: React.CSSProperties = {
  borderCollapse: "collapse",
  tableLayout: "fixed",
  fontSize: 12,
  background: "#ffffff",
};

const ptoPlanThStyle: React.CSSProperties = {
  padding: "8px 9px",
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  color: "#0f172a",
  fontWeight: 800,
  textAlign: "left",
  verticalAlign: "middle",
  whiteSpace: "normal",
  position: "relative",
  overflow: "visible",
};

const ptoHeaderContentStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: "visible",
  overflowWrap: "anywhere",
  whiteSpace: "normal",
  lineHeight: 1.15,
};

const monthToggleStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  display: "inline-flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 4,
  padding: 0,
  cursor: "pointer",
  maxWidth: "100%",
  overflow: "visible",
  overflowWrap: "anywhere",
  textAlign: "left",
  whiteSpace: "normal",
  lineHeight: 1.15,
};

const ptoHeaderLabelButtonStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "text",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  padding: 0,
  overflow: "visible",
  overflowWrap: "anywhere",
  textOverflow: "clip",
  whiteSpace: "normal",
  lineHeight: 1.15,
};

const ptoHeaderInputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #60a5fa",
  borderRadius: 4,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  outline: "none",
  padding: "2px 4px",
};

const ptoColumnResizeHandleStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: -3,
  width: 7,
  height: "100%",
  cursor: "col-resize",
  zIndex: 12,
};

const ptoPlanTdStyle: React.CSSProperties = {
  position: "relative",
  padding: 3,
  border: "1px solid #e2e8f0",
  verticalAlign: "middle",
  background: "inherit",
};

const ptoWorkspaceStyle: React.CSSProperties = {
  height: "calc(100dvh - 232px)",
  minHeight: 320,
  display: "grid",
  gridTemplateRows: "minmax(0, 1fr)",
};

const ptoDatePanelStyle: React.CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const ptoDateTableFrameStyle: React.CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  height: "100%",
};

const ptoDateTableLayoutStyle: React.CSSProperties = {
  height: "100%",
  minHeight: 0,
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  gap: 10,
};

const ptoDateTableScrollStyle: React.CSSProperties = {
  overflow: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  paddingLeft: 24,
  background: "#ffffff",
  height: "100%",
  minHeight: 0,
};

const ptoToolbarStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 12,
  display: "grid",
  gridTemplateColumns: "minmax(280px, 1fr) minmax(260px, auto)",
  gap: 12,
  alignItems: "end",
};

const ptoToolbarBlockStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  alignContent: "start",
};

const ptoToolbarRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  alignItems: "center",
};

const ptoYearDialogStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  padding: 10,
  display: "flex",
  gap: 8,
  alignItems: "end",
  flexWrap: "wrap",
};

const ptoFormulaBarStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  padding: 8,
  display: "grid",
  gridTemplateColumns: "minmax(240px, 1fr)",
  gap: 8,
  alignItems: "center",
};

const ptoFormulaInputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "7px 10px",
  fontFamily: "inherit",
  fontSize: 13,
  fontVariantNumeric: "tabular-nums",
  outline: "none",
};

const ptoDatabaseBarStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 8,
  background: "#eff6ff",
  color: "#1e3a8a",
  padding: "8px 10px",
  marginBottom: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  fontSize: 13,
};

const ptoDatabaseSavingBadgeStyle: React.CSSProperties = {
  border: "1px solid #bfdbfe",
  borderRadius: 8,
  background: "#ffffff",
  color: "#1d4ed8",
  padding: "5px 8px",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const ptoAreaCellStyle: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};

const ptoRowToolsStyle: React.CSSProperties = {
  position: "absolute",
  left: -32,
  top: "50%",
  transform: "translateY(-50%)",
  width: 28,
  height: 30,
  display: "grid",
  placeItems: "center",
};

const dragHandleStyle: React.CSSProperties = {
  width: 18,
  height: 24,
  border: "none",
  background: "transparent",
  color: "#475569",
  cursor: "grab",
  fontFamily: "inherit",
  display: "inline-grid",
  placeItems: "center",
  padding: 0,
  flex: "0 0 auto",
};

const ptoInlineAddRowButtonStyle: React.CSSProperties = {
  position: "absolute",
  left: -27,
  bottom: -10,
  width: 18,
  height: 18,
  border: "1px solid #bfdbfe",
  borderRadius: 4,
  background: "#ffffff",
  color: "#2563eb",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: "16px",
  opacity: 0.28,
  padding: 0,
  transition: "opacity 120ms ease, background 120ms ease, border-color 120ms ease",
  zIndex: 6,
};

const ptoInlineAddRowButtonHoverStyle: React.CSSProperties = {
  opacity: 1,
  background: "#dbeafe",
  borderColor: "#60a5fa",
};

const ptoDropIndicatorStyle: React.CSSProperties = {
  position: "absolute",
  left: 0,
  height: 3,
  background: "#2563eb",
  borderRadius: 999,
  pointerEvents: "none",
  zIndex: 3,
};

const ptoRowResizeHandleStyle: React.CSSProperties = {
  position: "absolute",
  left: -24,
  right: 0,
  bottom: -4,
  height: 8,
  cursor: "row-resize",
  zIndex: 8,
};

const dragHandleDotsStyle: React.CSSProperties = {
  width: 6,
  display: "grid",
  gap: 3,
  justifyItems: "center",
};

const dragHandleDotStyle: React.CSSProperties = {
  width: 4,
  height: 4,
  borderRadius: 999,
  background: "#64748b",
};

const ptoDraftRowStyle: React.CSSProperties = {
  background: "#f8fafc",
  color: "#64748b",
};

const ptoDraftAddButtonStyle: React.CSSProperties = {
  position: "absolute",
  left: -28,
  top: "50%",
  transform: "translateY(-50%)",
  width: 20,
  height: 20,
  border: "1px solid #bfdbfe",
  borderRadius: 4,
  background: "#ffffff",
  color: "#2563eb",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: "18px",
  opacity: 0.75,
  padding: 0,
};

const ptoDraftInputStyle: React.CSSProperties = {
  background: "transparent",
  borderColor: "transparent",
  color: "#64748b",
  fontStyle: "italic",
};

const ptoDraftStatusStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 29,
  border: "1px solid transparent",
  borderRadius: 0,
  background: "transparent",
  color: "#64748b",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  padding: "6px 8px",
};

const ptoDraftCellHintStyle: React.CSSProperties = {
  display: "block",
  minHeight: 29,
};

const ptoPlanInputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid transparent",
  borderRadius: 0,
  padding: "3px 4px",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.25,
  outline: "none",
  fontVariantNumeric: "tabular-nums",
  background: "transparent",
};

const ptoCompactNumberInputStyle: React.CSSProperties = {
  minWidth: 0,
  cursor: "cell",
  textAlign: "center",
};

const ptoStatusBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 25,
  boxSizing: "border-box",
  border: "1px solid",
  borderRadius: 4,
  padding: "3px 6px",
  fontWeight: 800,
  lineHeight: 1.15,
  textAlign: "center",
  whiteSpace: "normal",
};

const ptoActiveFormulaCellStyle: React.CSSProperties = {
  outline: "2px solid #2563eb",
  outlineOffset: "-2px",
  zIndex: 2,
};

const ptoSelectedFormulaCellStyle: React.CSSProperties = {
  background: "#f0f7ff",
  outline: "2px solid #2563eb",
  outlineOffset: "-2px",
  zIndex: 1,
};

const ptoEditingFormulaCellStyle: React.CSSProperties = {
  background: "#eaf4ff",
};

const ptoReadonlyTotalStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 68,
  border: "1px solid transparent",
  borderRadius: 0,
  background: "transparent",
  color: "#0f172a",
  cursor: "cell",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.25,
  padding: "3px 4px",
  textAlign: "center",
};

const ptoPlanDayInputStyle: React.CSSProperties = {
  ...ptoPlanInputStyle,
  minWidth: 68,
  textAlign: "center",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  outline: "none",
  fontFamily: "inherit",
  fontSize: 14,
  lineHeight: 1.35,
  background: "#ffffff",
};

const vehicleNameStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.4,
  marginBottom: 6,
  overflowWrap: "anywhere",
  whiteSpace: "normal",
};

const adminDetailCellStyle: React.CSSProperties = {
  padding: "10px 12px 14px",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
};

const compactRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 8,
  alignItems: "center",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 10,
  background: "#ffffff",
};

const adminInlineEditStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
  alignItems: "end",
};

const dependencyStageGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};

const dependencyStageStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 10,
};

const dependencyNodeCardStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  padding: 10,
};

const dependencyLinkCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 12,
};

const displayNamePreviewStyle: React.CSSProperties = {
  minHeight: 44,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  padding: "11px 14px",
  color: "#0f172a",
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.4,
  overflowWrap: "anywhere",
};

const headerNavStackStyle: React.CSSProperties = {
  flex: "1 1 720px",
  display: "grid",
  gap: 5,
  minWidth: 280,
};

const headerNavStackPtoStyle: React.CSSProperties = {
  paddingBottom: 48,
};

const headerMainTabsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  alignItems: "center",
};

const headerActiveTabWithSubtabsStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
};

const headerSubtabsStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 14px)",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  alignItems: "center",
  justifyContent: "center",
  width: "max-content",
  maxWidth: "min(720px, calc(100vw - 120px))",
  borderTop: "1px solid #0f172a",
  paddingTop: 6,
  zIndex: 10,
};

const headerSubtabButtonStyle: React.CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  WebkitTapHighlightColor: "transparent",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 8,
  padding: "5px 9px",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  cursor: "pointer",
  outline: "none",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.10)",
  userSelect: "none",
};

const headerSubtabButtonActiveStyle: React.CSSProperties = {
  background: "#0f172a",
  borderColor: "#0f172a",
  color: "#ffffff",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.16)",
};

const logoImageStyle: React.CSSProperties = {
  width: 112,
  height: 72,
  objectFit: "contain",
  display: "block",
};

const workDateStyle: React.CSSProperties = {
  width: 170,
  flex: "0 0 170px",
};

const iconButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const fieldLabelStyle: React.CSSProperties = {
  color: "#475569",
  fontSize: 13,
  fontWeight: 700,
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 50,
  background: "rgba(15, 23, 42, 0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
};

const vehicleCardStyle: React.CSSProperties = {
  width: "min(900px, 100%)",
  maxHeight: "calc(100vh - 48px)",
  overflowY: "auto",
  background: "#ffffff",
  borderRadius: 8,
  padding: 20,
  boxShadow: "0 24px 70px rgba(15, 23, 42, 0.25)",
};
