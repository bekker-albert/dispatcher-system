import { dateRange, distributeTotal, type PtoPlanRow } from "./date-table";

export const defaultReportDate = "2026-04-12";

function buildPlanDailyValues(dayPlan: number, monthPlan: number, monthTotalPlan: number, yearPlan: number, annualPlan: number) {
  const values: Record<string, number> = {};
  const remainingMonthPlan = monthTotalPlan - monthPlan;

  distributeTotal(values, dateRange("2026-01-01", "2026-03-31"), yearPlan - monthPlan);
  distributeTotal(values, dateRange("2026-04-01", "2026-04-11"), monthPlan - dayPlan);
  values[defaultReportDate] = dayPlan;
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

export const defaultPtoPlanRows: PtoPlanRow[] = [
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

export const defaultPtoSurveyRows: PtoPlanRow[] = [
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

export const defaultPtoOperRows: PtoPlanRow[] = [
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
