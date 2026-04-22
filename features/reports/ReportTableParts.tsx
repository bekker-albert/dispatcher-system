import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { formatNumber } from "@/lib/domain/reports/display";

export function ReportCompletionGauge({
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

export function ReportTh({
  children,
  colSpan = 1,
  rowSpan = 1,
  columnKey,
  printLabel,
  width,
  onResizeStart,
}: {
  children: ReactNode;
  colSpan?: number;
  rowSpan?: number;
  columnKey?: string;
  printLabel?: string;
  width?: number;
  onResizeStart?: (event: MouseEvent<HTMLElement>, key: string, width: number) => void;
}) {
  return (
    <th
      className={columnKey ? `report-print-th report-print-th-${columnKey}` : "report-print-th"}
      colSpan={colSpan}
      rowSpan={rowSpan}
      style={{
        ...reportThStyle,
        ...(width ? { width, minWidth: width, maxWidth: width } : null),
      }}
    >
      <div className="report-screen-header-content" style={reportHeaderContentStyle}>{children}</div>
      {printLabel ? <span className="report-print-header-label">{printLabel}</span> : null}
      {columnKey && width && onResizeStart ? (
        <span
          onMouseDown={(event) => onResizeStart(event, columnKey, width)}
          style={reportColumnResizeHandleStyle}
          title="Потяни, чтобы изменить ширину столбца"
          aria-hidden
        />
      ) : null}
    </th>
  );
}

export function ReportTd({
  children,
  strong = false,
  align = "left",
  tone,
  colSpan = 1,
  rowSpan = 1,
  variant,
}: {
  children: ReactNode;
  strong?: boolean;
  align?: "left" | "right" | "center";
  tone?: "good" | "bad" | "warn";
  colSpan?: number;
  rowSpan?: number;
  variant?: "area" | "work" | "reason";
}) {
  const toneStyle: CSSProperties = tone === "bad"
    ? { background: "#fee2e2", color: "#991b1b" }
    : tone === "warn"
      ? { background: "#ffedd5", color: "#9a3412" }
      : { color: tone === "good" ? "#166534" : "#0f172a" };
  const variantStyle = variant === "area"
    ? reportAreaTdStyle
    : variant === "work"
      ? reportWorkTdStyle
      : variant === "reason"
        ? reportReasonTdStyle
      : null;

  return <td className={variant ? `report-${variant}-cell` : undefined} colSpan={colSpan} rowSpan={rowSpan} style={{ ...reportTdStyle, ...variantStyle, textAlign: align, fontWeight: strong ? 700 : 400, ...toneStyle }}>{children}</td>;
}

export function ReportMetric({ value, note }: { value: string; note: string }) {
  return (
    <div style={{ display: "grid", gap: 1 }}>
      <span style={{ fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap" }}>{value}</span>
      <span style={{ color: "#64748b", fontSize: 9, lineHeight: 1.05 }}>{note}</span>
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

const reportThStyle: CSSProperties = {
  padding: "6px 3px",
  border: "1.5px solid #cbd5e1",
  background: "#f1f5f9",
  color: "#0f172a",
  fontWeight: 800,
  textAlign: "center",
  verticalAlign: "middle",
  whiteSpace: "normal",
  position: "relative",
  overflow: "visible",
};

const reportHeaderContentStyle: CSSProperties = {
  minWidth: 0,
  overflow: "visible",
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
  hyphens: "none",
  lineHeight: 1.12,
};

const reportColumnResizeHandleStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  right: -3,
  width: 7,
  height: "100%",
  cursor: "col-resize",
  zIndex: 12,
};

const reportTdStyle: CSSProperties = {
  padding: "2px 3px",
  border: "1.5px solid #e2e8f0",
  verticalAlign: "middle",
  lineHeight: 1.08,
  whiteSpace: "pre-wrap",
  overflowWrap: "normal",
  wordBreak: "normal",
  hyphens: "none",
  fontVariantNumeric: "tabular-nums",
};

const reportAreaTdStyle: CSSProperties = {
  verticalAlign: "middle",
  background: "#f8fafc",
};

const reportWorkTdStyle: CSSProperties = {
  minWidth: 220,
  maxWidth: 280,
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
  hyphens: "none",
};

const reportReasonTdStyle: CSSProperties = {
  height: "100%",
  textAlign: "center",
  verticalAlign: "middle",
};
