import { dispatchShiftLabel } from "@/lib/domain/dispatch/summary";
import { formatReportDate, statusColor, statusTextColor } from "@/lib/domain/reports/display";
import { Pill } from "@/shared/ui/layout";
import { dispatchSummaryHeaderStyle } from "@/features/dispatch/dispatchSectionStyles";
import type { DispatchTotals } from "@/features/dispatch/dispatchSectionTypes";

type DispatchSummaryHeaderProps = {
  currentDispatchShift: "daily" | "night" | "day";
  isDailyDispatchShift: boolean;
  reportDate: string;
  totals: DispatchTotals;
};

export function DispatchSummaryHeader({
  currentDispatchShift,
  isDailyDispatchShift,
  reportDate,
  totals,
}: DispatchSummaryHeaderProps) {
  return (
    <div style={dispatchSummaryHeaderStyle}>
      <div>
        <div style={{ fontWeight: 800 }}>Заполнение сводки за {formatReportDate(reportDate)}</div>
        <div style={{ color: "#64748b", marginTop: 3 }}>
          {isDailyDispatchShift
            ? "Сутки формируются автоматически из ночной и дневной смены за выбранную дату."
            : `${dispatchShiftLabel(currentDispatchShift)}. Строки сохраняются локально и затем могут стать таблицей базы данных.`}
        </div>
      </div>
      <Pill bg={statusColor(totals.percent)} color={statusTextColor(totals.percent)}>
        {totals.percent}%
      </Pill>
    </div>
  );
}
