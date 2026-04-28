import { formatPtoCellNumber } from "@/lib/domain/pto/formatting";
import { formatNumber } from "@/lib/domain/reports/display";
import {
  dispatchSummaryStatCardStyle,
  dispatchSummaryStatsStyle,
} from "@/features/dispatch/dispatchSectionStyles";
import type { DispatchTotals } from "@/features/dispatch/dispatchSectionTypes";

type DispatchSummaryStatsProps = {
  totals: DispatchTotals;
};

export function DispatchSummaryStats({ totals }: DispatchSummaryStatsProps) {
  return (
    <div style={dispatchSummaryStatsStyle}>
      <div style={dispatchSummaryStatCardStyle}>
        <span>План</span>
        <strong>{formatNumber(totals.plan)}</strong>
      </div>
      <div style={dispatchSummaryStatCardStyle}>
        <span>Факт</span>
        <strong>{formatNumber(totals.fact)}</strong>
      </div>
      <div style={dispatchSummaryStatCardStyle}>
        <span>Отклонение</span>
        <strong style={{ color: totals.delta < 0 ? "#991b1b" : "#166534" }}>{formatNumber(totals.delta)}</strong>
      </div>
      <div style={dispatchSummaryStatCardStyle}>
        <span>Работа / ремонт / простой</span>
        <strong>{formatPtoCellNumber(totals.workHours)} / {formatPtoCellNumber(totals.repairHours)} / {formatPtoCellNumber(totals.downtimeHours)} ч.</strong>
      </div>
      <div style={dispatchSummaryStatCardStyle}>
        <span>Производительность</span>
        <strong>{formatPtoCellNumber(totals.productivity)}</strong>
      </div>
    </div>
  );
}
