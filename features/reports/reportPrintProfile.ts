import type { ReportColumnKey } from "../../lib/domain/reports/columns";

export const reportPrintProfile = {
  page: {
    size: "A3 landscape",
    marginMm: 5,
    widthBudgetPx: 1400,
  },
  rows: {
    perPage: 42,
  },
  columns: {
    baseWidths: {
      area: 54,
      "work-name": 180,
      unit: 24,
      "day-plan": 42,
      "day-fact": 42,
      "day-delta": 38,
      "day-productivity": 48,
      "day-reason": 175,
      "month-total-plan": 48,
      "month-plan": 48,
      "month-fact": 58,
      "month-delta": 42,
      "month-productivity": 48,
      "year-plan": 52,
      "year-fact": 62,
      "year-delta": 46,
      "year-reason": 190,
      "annual-plan": 54,
      "annual-fact": 54,
      "annual-remaining": 58,
    } satisfies Record<ReportColumnKey, number>,
    textBounds: {
      "work-name": { min: 150, max: 225, base: 118, char: 4.2 },
      "day-reason": { min: 145, max: 230, base: 118, char: 3.8 },
      "year-reason": { min: 165, max: 260, base: 126, char: 3.8 },
    },
    cssFallbackWidths: {
      "work-name": 170,
      "day-reason": 175,
      "year-reason": 190,
    },
  },
  table: {
    borderPx: 2,
    borderColor: "#64748b",
    fontSizePx: 7.6,
  },
  cells: {
    lineHeight: 1.02,
    paddingYPx: 0.8,
    paddingXPx: 1.5,
    metricLineHeight: 1,
    noteColor: "#475569",
    headerLineHeight: 1.08,
    headerPaddingYPx: 1.4,
    headerLabelLineHeight: 1.1,
  },
  fillRows: {
    minMissingRows: 1,
    maxMissingRows: 5,
    minPaddingMm: 0.08,
    maxPaddingMm: 0.5,
    paddingMmPerMissingRow: 2.2,
    fallbackPaddingPx: 0.8,
  },
  header: {
    background: "#f1f5f9",
    textColor: "#0f172a",
    labelWeight: 800,
  },
} as const;

export type ReportPrintTextColumnKey = keyof typeof reportPrintProfile.columns.textBounds;
