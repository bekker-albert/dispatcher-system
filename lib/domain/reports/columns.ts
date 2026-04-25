export const reportColumnKeys = [
  "area",
  "work-name",
  "unit",
  "day-plan",
  "day-fact",
  "day-delta",
  "day-productivity",
  "day-reason",
  "month-total-plan",
  "month-plan",
  "month-fact",
  "month-delta",
  "month-productivity",
  "year-plan",
  "year-fact",
  "year-delta",
  "year-reason",
  "annual-plan",
  "annual-fact",
  "annual-remaining",
] as const;

export type ReportColumnKey = typeof reportColumnKeys[number];

export const reportColumnHeaderFallbacks: Record<ReportColumnKey, string> = {
  area: "Участок",
  "work-name": "Вид работ",
  unit: "Ед.",
  "day-plan": "План суточный",
  "day-fact": "Оперучет",
  "day-delta": "Откл.",
  "day-productivity": "Произв. техники",
  "day-reason": "Причина за сутки",
  "month-total-plan": "План на месяц",
  "month-plan": "План с начала месяца",
  "month-fact": "Маркзамер + оперучет",
  "month-delta": "Откл.",
  "month-productivity": "Произв. накоп.",
  "year-plan": "План с начала года",
  "year-fact": "Маркзамер + недостающий оперучет",
  "year-delta": "Откл.",
  "year-reason": "Причины с накоплением",
  "annual-plan": "Годовой план",
  "annual-fact": "Факт годового плана",
  "annual-remaining": "Остаток",
};

export const reportReasonColumnKeys = new Set<ReportColumnKey>(["day-reason", "year-reason"]);

export const reportFlexibleColumnKeys = new Set<ReportColumnKey>(["work-name", "day-reason", "year-reason"]);

export const reportNumericColumnKeys = new Set<ReportColumnKey>([
  "day-plan",
  "day-fact",
  "day-delta",
  "day-productivity",
  "month-total-plan",
  "month-plan",
  "month-fact",
  "month-delta",
  "month-productivity",
  "year-plan",
  "year-fact",
  "year-delta",
  "annual-plan",
  "annual-fact",
  "annual-remaining",
]);

export type ReportNumericColumnSizing = {
  headerChars: number;
  digitPx: number;
  groupSpacePx: number;
  signPx: number;
  percentPx: number;
  labelPx: number;
  paddingPx: number;
};

export const reportNumericColumnSizing: Partial<Record<ReportColumnKey, ReportNumericColumnSizing>> = {
  "day-plan": { headerChars: 5, digitPx: 6.5, groupSpacePx: 3, signPx: 4, percentPx: 7, labelPx: 5, paddingPx: 18 },
  "day-fact": { headerChars: 7, digitPx: 6.5, groupSpacePx: 3, signPx: 4, percentPx: 7, labelPx: 5, paddingPx: 18 },
  "day-delta": { headerChars: 5, digitPx: 6.5, groupSpacePx: 3, signPx: 5, percentPx: 7, labelPx: 5, paddingPx: 20 },
  "day-productivity": { headerChars: 6, digitPx: 6.2, groupSpacePx: 2.8, signPx: 4, percentPx: 6.5, labelPx: 5, paddingPx: 18 },
  "month-total-plan": { headerChars: 5, digitPx: 6.6, groupSpacePx: 3, signPx: 4, percentPx: 7, labelPx: 5, paddingPx: 19 },
  "month-plan": { headerChars: 5, digitPx: 6.6, groupSpacePx: 3, signPx: 4, percentPx: 7, labelPx: 5, paddingPx: 19 },
  "month-fact": { headerChars: 8, digitPx: 6.6, groupSpacePx: 3, signPx: 4, percentPx: 7, labelPx: 4.6, paddingPx: 21 },
  "month-delta": { headerChars: 5, digitPx: 6.6, groupSpacePx: 3, signPx: 5, percentPx: 7, labelPx: 5, paddingPx: 21 },
  "month-productivity": { headerChars: 6, digitPx: 6.3, groupSpacePx: 2.8, signPx: 4, percentPx: 6.5, labelPx: 5, paddingPx: 19 },
  "year-plan": { headerChars: 5, digitPx: 6.7, groupSpacePx: 3.1, signPx: 4, percentPx: 7, labelPx: 5, paddingPx: 20 },
  "year-fact": { headerChars: 8, digitPx: 6.7, groupSpacePx: 3.1, signPx: 4, percentPx: 7, labelPx: 4.6, paddingPx: 22 },
  "year-delta": { headerChars: 5, digitPx: 6.7, groupSpacePx: 3.1, signPx: 5, percentPx: 7, labelPx: 5, paddingPx: 22 },
  "annual-plan": { headerChars: 7, digitPx: 6.8, groupSpacePx: 3.2, signPx: 4, percentPx: 7, labelPx: 5, paddingPx: 21 },
  "annual-fact": { headerChars: 7, digitPx: 6.8, groupSpacePx: 3.2, signPx: 4, percentPx: 7, labelPx: 5, paddingPx: 21 },
  "annual-remaining": { headerChars: 7, digitPx: 6.8, groupSpacePx: 3.2, signPx: 5, percentPx: 7, labelPx: 5, paddingPx: 23 },
};

export const reportCompactColumnKeys = new Set<ReportColumnKey>([
  "area",
  "unit",
  "day-plan",
  "day-fact",
  "day-delta",
  "day-productivity",
  "month-total-plan",
  "month-plan",
  "month-fact",
  "month-delta",
  "month-productivity",
  "year-plan",
  "year-fact",
  "year-delta",
  "annual-plan",
  "annual-fact",
  "annual-remaining",
]);

export const reportColumnTextCaps: Record<ReportColumnKey, number> = {
  area: 12,
  "work-name": 28,
  unit: 4,
  "day-plan": 12,
  "day-fact": 12,
  "day-delta": 12,
  "day-productivity": 12,
  "day-reason": 70,
  "month-total-plan": 12,
  "month-plan": 12,
  "month-fact": 18,
  "month-delta": 12,
  "month-productivity": 12,
  "year-plan": 12,
  "year-fact": 18,
  "year-delta": 12,
  "year-reason": 70,
  "annual-plan": 12,
  "annual-fact": 12,
  "annual-remaining": 12,
};

export const reportColumnAutoMaxWidths: Record<ReportColumnKey, number> = {
  area: 92,
  "work-name": 240,
  unit: 34,
  "day-plan": 78,
  "day-fact": 78,
  "day-delta": 76,
  "day-productivity": 72,
  "day-reason": 260,
  "month-total-plan": 86,
  "month-plan": 86,
  "month-fact": 96,
  "month-delta": 88,
  "month-productivity": 78,
  "year-plan": 92,
  "year-fact": 104,
  "year-delta": 94,
  "year-reason": 300,
  "annual-plan": 96,
  "annual-fact": 96,
  "annual-remaining": 104,
};

export const reportColumnAutoMinWidths: Record<ReportColumnKey, number> = {
  area: 76,
  "work-name": 180,
  unit: 30,
  "day-plan": 44,
  "day-fact": 44,
  "day-delta": 42,
  "day-productivity": 48,
  "day-reason": 120,
  "month-total-plan": 54,
  "month-plan": 54,
  "month-fact": 62,
  "month-delta": 50,
  "month-productivity": 50,
  "year-plan": 56,
  "year-fact": 64,
  "year-delta": 52,
  "year-reason": 140,
  "annual-plan": 58,
  "annual-fact": 58,
  "annual-remaining": 62,
};

export const defaultReportColumnWidths = [
  82,
  220,
  32,
  50,
  50,
  46,
  56,
  150,
  58,
  58,
  64,
  46,
  56,
  58,
  64,
  46,
  150,
  58,
  58,
  56,
];
