import type { CSSProperties, MouseEvent, ReactNode } from "react";

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
      style={reportThStyle}
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
  return (
    <td
      className={variant ? `report-${variant}-cell` : undefined}
      colSpan={colSpan}
      rowSpan={rowSpan}
      style={reportTdStyleFor({ align, strong, tone, variant })}
    >
      {children}
    </td>
  );
}

export function ReportMetric({ value, note }: { value: string; note: string }) {
  return (
    <div className="report-metric" style={reportMetricStyle}>
      <span className="report-metric-value" style={reportMetricValueStyle}>{value}</span>
      <span className="report-metric-note" style={reportMetricNoteStyle}>{note}</span>
    </div>
  );
}

const reportMetricStyle: CSSProperties = {
  display: "grid",
  gap: 1,
  justifyItems: "center",
  lineHeight: 1,
};

const reportMetricValueStyle: CSSProperties = {
  fontWeight: 700,
  lineHeight: 1,
  whiteSpace: "nowrap",
};

const reportMetricNoteStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 10,
  fontWeight: 400,
  lineHeight: 1.05,
  whiteSpace: "nowrap",
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

type ReportTdStyleOptions = {
  align: "left" | "right" | "center";
  strong: boolean;
  tone?: "good" | "bad" | "warn";
  variant?: "area" | "work" | "reason";
};

const reportTdStyleCache = new Map<string, CSSProperties>();

function reportTdStyleFor({ align, strong, tone, variant }: ReportTdStyleOptions) {
  const key = `${align}:${strong ? "strong" : "regular"}:${tone ?? "neutral"}:${variant ?? "default"}`;
  const cachedStyle = reportTdStyleCache.get(key);
  if (cachedStyle) return cachedStyle;

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
  const style = {
    ...reportTdStyle,
    ...variantStyle,
    textAlign: align,
    fontWeight: strong ? 700 : 400,
    ...toneStyle,
  };

  reportTdStyleCache.set(key, style);
  return style;
}
