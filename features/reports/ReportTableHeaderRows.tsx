import type { MouseEvent } from "react";
import type { ReportColumnKey } from "@/lib/domain/reports/columns";
import { ReportTh } from "./ReportTableParts";
import type { ReportHeaderGroupKey, ReportHeaderKey, ReportHeaderView } from "./ReportTableHeaderConfig";

type ReportHeaderViews = Record<ReportHeaderKey, ReportHeaderView>;

type ReportTableHeaderRowsProps = {
  reportColumnWidthByKey: Map<ReportColumnKey, number>;
  reportHeaders: ReportHeaderViews;
  showDayProductivity: boolean;
  showMonthProductivity: boolean;
  onStartReportColumnResize: (event: MouseEvent<HTMLElement>, key: string, width: number) => void;
};

const leadingColumnKeys: ReportColumnKey[] = ["area", "work-name", "unit"];
const dayColumnKeys: ReportColumnKey[] = ["day-plan", "day-fact", "day-delta", "day-productivity", "day-reason"];
const monthColumnKeys: ReportColumnKey[] = [
  "month-total-plan",
  "month-plan",
  "month-fact",
  "month-delta",
  "month-productivity",
];
const yearColumnKeys: ReportColumnKey[] = ["year-plan", "year-fact", "year-delta", "year-reason"];
const annualColumnKeys: ReportColumnKey[] = ["annual-plan", "annual-fact", "annual-remaining"];

function visibleColumnKeys(keys: ReportColumnKey[], hiddenKeys: Set<ReportColumnKey>) {
  return keys.filter((key) => !hiddenKeys.has(key));
}

function ReportGroupHeaderCell({
  headerKey,
  colSpan,
  reportHeaders,
}: {
  headerKey: ReportHeaderGroupKey;
  colSpan: number;
  reportHeaders: ReportHeaderViews;
}) {
  const header = reportHeaders[headerKey];
  return (
    <ReportTh colSpan={colSpan} printLabel={header.printLabel}>
      {header.text}
    </ReportTh>
  );
}

function ReportColumnHeaderCell({
  columnKey,
  rowSpan,
  reportColumnWidthByKey,
  reportHeaders,
  onStartReportColumnResize,
}: {
  columnKey: ReportColumnKey;
  rowSpan?: number;
  reportColumnWidthByKey: Map<ReportColumnKey, number>;
  reportHeaders: ReportHeaderViews;
  onStartReportColumnResize: (event: MouseEvent<HTMLElement>, key: string, width: number) => void;
}) {
  const header = reportHeaders[columnKey];
  return (
    <ReportTh
      rowSpan={rowSpan}
      columnKey={columnKey}
      printLabel={header.printLabel}
      width={reportColumnWidthByKey.get(columnKey)}
      onResizeStart={onStartReportColumnResize}
    >
      {header.text}
    </ReportTh>
  );
}

function ReportColumnHeaderCells({
  columnKeys,
  reportColumnWidthByKey,
  reportHeaders,
  onStartReportColumnResize,
}: {
  columnKeys: ReportColumnKey[];
  reportColumnWidthByKey: Map<ReportColumnKey, number>;
  reportHeaders: ReportHeaderViews;
  onStartReportColumnResize: (event: MouseEvent<HTMLElement>, key: string, width: number) => void;
}) {
  return columnKeys.map((columnKey) => (
    <ReportColumnHeaderCell
      key={columnKey}
      columnKey={columnKey}
      reportColumnWidthByKey={reportColumnWidthByKey}
      reportHeaders={reportHeaders}
      onStartReportColumnResize={onStartReportColumnResize}
    />
  ));
}

export function ReportTableHeaderRows({
  reportColumnWidthByKey,
  reportHeaders,
  showDayProductivity,
  showMonthProductivity,
  onStartReportColumnResize,
}: ReportTableHeaderRowsProps) {
  const hiddenKeys = new Set<ReportColumnKey>([
    ...(!showDayProductivity ? (["day-productivity"] as const) : []),
    ...(!showMonthProductivity ? (["month-productivity"] as const) : []),
  ]);
  const visibleDayColumnKeys = visibleColumnKeys(dayColumnKeys, hiddenKeys);
  const visibleMonthColumnKeys = visibleColumnKeys(monthColumnKeys, hiddenKeys);

  return (
    <>
      <tr className="report-screen-header-row">
        {leadingColumnKeys.map((columnKey) => (
          <ReportColumnHeaderCell
            key={columnKey}
            rowSpan={2}
            columnKey={columnKey}
            reportColumnWidthByKey={reportColumnWidthByKey}
            reportHeaders={reportHeaders}
            onStartReportColumnResize={onStartReportColumnResize}
          />
        ))}
        <ReportGroupHeaderCell
          headerKey="day-group"
          colSpan={visibleDayColumnKeys.length}
          reportHeaders={reportHeaders}
        />
        <ReportGroupHeaderCell
          headerKey="month-group"
          colSpan={visibleMonthColumnKeys.length}
          reportHeaders={reportHeaders}
        />
        <ReportGroupHeaderCell headerKey="year-group" colSpan={yearColumnKeys.length} reportHeaders={reportHeaders} />
        <ReportGroupHeaderCell
          headerKey="annual-group"
          colSpan={annualColumnKeys.length}
          reportHeaders={reportHeaders}
        />
      </tr>
      <tr className="report-screen-subheader-row">
        <ReportColumnHeaderCells
          columnKeys={visibleDayColumnKeys}
          reportColumnWidthByKey={reportColumnWidthByKey}
          reportHeaders={reportHeaders}
          onStartReportColumnResize={onStartReportColumnResize}
        />
        <ReportColumnHeaderCells
          columnKeys={visibleMonthColumnKeys}
          reportColumnWidthByKey={reportColumnWidthByKey}
          reportHeaders={reportHeaders}
          onStartReportColumnResize={onStartReportColumnResize}
        />
        <ReportColumnHeaderCells
          columnKeys={yearColumnKeys}
          reportColumnWidthByKey={reportColumnWidthByKey}
          reportHeaders={reportHeaders}
          onStartReportColumnResize={onStartReportColumnResize}
        />
        <ReportColumnHeaderCells
          columnKeys={annualColumnKeys}
          reportColumnWidthByKey={reportColumnWidthByKey}
          reportHeaders={reportHeaders}
          onStartReportColumnResize={onStartReportColumnResize}
        />
      </tr>
    </>
  );
}
