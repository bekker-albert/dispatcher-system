import type { CSSProperties } from "react";

import { formatNumber } from "@/lib/domain/reports/display";

type ReportCompletionGaugeProps = {
  title: string;
  percent: number;
  fact: number;
  plan: number;
  monthPlan: number;
  lag: number;
  overPlanPerDay: number;
  remainingDays: number;
};

export function ReportCompletionGauge({
  title,
  percent,
  fact,
  plan,
  monthPlan,
  lag,
  overPlanPerDay,
  remainingDays,
}: ReportCompletionGaugeProps) {
  const visiblePercent = Math.max(0, Math.min(percent, 100));
  const deltaValue = fact - plan;

  return (
    <div style={reportGaugeStyle} aria-label={`Выполнение плана: ${percent}%`}>
      <div style={{ ...reportGaugeCircleStyle, background: `conic-gradient(#16a34a ${visiblePercent * 3.6}deg, #e2e8f0 0deg)` }}>
        <div style={reportGaugeInnerStyle}>
          <span style={getReportGaugePercentStyle(percent)}>{percent}%</span>
          <span style={reportGaugeLabelStyle}>план</span>
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

const reportGaugeStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "92px minmax(0, 1fr)",
  gap: 14,
  alignItems: "center",
  minWidth: 0,
};

const reportGaugeCircleStyle: CSSProperties = {
  width: 84,
  height: 84,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  boxShadow: "inset 0 0 0 1px #cbd5e1",
};

const reportGaugeInnerStyle: CSSProperties = {
  width: 62,
  height: 62,
  borderRadius: "50%",
  background: "#ffffff",
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: 1,
};

const reportGaugePercentStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: 0,
  whiteSpace: "nowrap",
};

function getReportGaugePercentStyle(percent: number): CSSProperties {
  if (percent >= 100) {
    return { ...reportGaugePercentStyle, fontSize: 18 };
  }

  return reportGaugePercentStyle;
}

const reportGaugeLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 9,
  fontWeight: 700,
  lineHeight: 1,
  letterSpacing: 0,
  textTransform: "uppercase",
};

const reportGaugeStatsStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  color: "#334155",
  fontSize: 12,
  marginTop: 8,
};

const reportCatchUpStyle: CSSProperties = {
  display: "grid",
  gap: 3,
  color: "#334155",
  fontSize: 12,
  marginTop: 8,
};
