import { cleanAreaName } from "../../utils/text";
import {
  ptoPlanExcelDateLabel,
  ptoPlanExcelMonthLabel,
  ptoPlanExportCell,
} from "./excel-headers";
import {
  monthDays,
  normalizePtoCustomerCode,
  normalizePtoUnit,
  previousPtoYearLabel,
  ptoAreaMatches,
  ptoMonthTotal,
  ptoRowHasYear,
  ptoStoredCarryover,
  ptoYearTotalWithCarryover,
  yearMonths,
  type PtoDateTableKey,
  type PtoPlanRow,
} from "./date-table";
import type { XlsxColumnOption } from "../../utils/xlsx";

export function createPtoPlanExportRows(rows: PtoPlanRow[], year: string, areaFilterValue: string, table: PtoDateTableKey = "plan") {
  const months = yearMonths(year);
  const includeCustomerCode = table === "plan";
  const headers = [
    ...(includeCustomerCode ? ["Заказчик"] : []),
    "Участок",
    "Вид работ",
    "Ед.",
    `Остатки ${previousPtoYearLabel(year)}`,
    "Итого год",
    ...months.flatMap((month) => [
      ptoPlanExcelMonthLabel(month),
      ...monthDays(month).map(ptoPlanExcelDateLabel),
    ]),
  ];
  const exportRows = rows
    .filter((row) => ptoAreaMatches(row.area, areaFilterValue) && ptoRowHasYear(row, year))
    .map((row) => [
      ...(includeCustomerCode ? [normalizePtoCustomerCode(row.customerCode)] : []),
      cleanAreaName(row.area),
      row.structure,
      normalizePtoUnit(row.unit),
      ptoPlanExportCell(ptoStoredCarryover(row, year)),
      ptoPlanExportCell(ptoYearTotalWithCarryover(row, year, rows)),
      ...months.flatMap((month) => {
        const days = monthDays(month);
        const monthHasValue = days.some((day) => row.dailyPlans[day] !== undefined);

        return [
          monthHasValue ? ptoPlanExportCell(ptoMonthTotal(row, month)) : "",
          ...days.map((day) => ptoPlanExportCell(row.dailyPlans[day])),
        ];
      }),
    ]);

  return [headers, ...exportRows];
}

export function createPtoPlanExportColumns(year: string, table: PtoDateTableKey = "plan") {
  const includeCustomerCode = table === "plan";
  const columns: XlsxColumnOption[] = [
    ...(includeCustomerCode ? [{ width: 10 }] : []),
    { width: 14 },
    { width: 42 },
    { width: 7 },
    { width: 15 },
    { width: 15 },
  ];

  yearMonths(year).forEach((month) => {
    columns.push({ width: 13, collapsed: true });
    monthDays(month).forEach(() => {
      columns.push({ width: 10, hidden: true, outlineLevel: 1 });
    });
  });

  return columns;
}
