import { useMemo, type MouseEvent, type ReactNode } from "react";
import type { ReportColumnKey } from "@/lib/domain/reports/columns";
import { createReportHeaderViews } from "./ReportTableHeaderConfig";
import { ReportTableHeaderRows } from "./ReportTableHeaderRows";

type ReportTableHeaderProps = {
  reportColumnWidthByKey: Map<ReportColumnKey, number>;
  reportHeaderLabel: (key: string, fallback: string) => string;
  renderReportHeaderText: (key: string, fallback: string) => ReactNode;
  showDayProductivity: boolean;
  showMonthProductivity: boolean;
  onStartReportColumnResize: (event: MouseEvent<HTMLElement>, key: string, width: number) => void;
};

export function ReportTableHeader({
  reportColumnWidthByKey,
  reportHeaderLabel,
  renderReportHeaderText,
  showDayProductivity,
  showMonthProductivity,
  onStartReportColumnResize,
}: ReportTableHeaderProps) {
  const reportHeaders = useMemo(
    () => createReportHeaderViews(reportHeaderLabel, renderReportHeaderText),
    [reportHeaderLabel, renderReportHeaderText],
  );

  return (
    <thead>
      <ReportTableHeaderRows
        reportColumnWidthByKey={reportColumnWidthByKey}
        reportHeaders={reportHeaders}
        showDayProductivity={showDayProductivity}
        showMonthProductivity={showMonthProductivity}
        onStartReportColumnResize={onStartReportColumnResize}
      />
    </thead>
  );
}
