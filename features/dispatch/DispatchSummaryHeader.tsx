import { formatReportDate } from "@/lib/domain/reports/display";
import { dispatchSummaryHeaderStyle } from "@/features/dispatch/dispatchSectionStyles";
import type { DispatchTotals } from "@/features/dispatch/dispatchSectionTypes";

type DispatchSummaryHeaderProps = {
  currentDispatchShift: "daily" | "night" | "day";
  isDailyDispatchShift: boolean;
  reportDate: string;
  totals: DispatchTotals;
};

export function DispatchSummaryHeader({
  isDailyDispatchShift,
  reportDate,
}: DispatchSummaryHeaderProps) {
  if (!isDailyDispatchShift) return null;

  return (
    <div style={dispatchSummaryHeaderStyle}>
      <div style={{ fontWeight: 800 }}>Суточные объемы за {formatReportDate(reportDate)}</div>
    </div>
  );
}
