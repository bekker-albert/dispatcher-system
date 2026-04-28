import {
  reportColumnAutoMaxWidths,
  reportColumnAutoMinWidths,
  reportColumnTextCaps,
  reportCompactColumnKeys,
  reportNumericColumnKeys,
  reportNumericColumnSizing,
  reportReasonColumnKeys,
  type ReportColumnKey,
  type ReportNumericColumnSizing,
} from "./columns";

function reportTextLength(value: string) {
  return value.replace(/\s+/g, " ").trim().length;
}

function reportLongestWordLength(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}%+-]/gu, "").length)
    .reduce((max, length) => Math.max(max, length), 0);
}

function reportAutoWidthFromChars(chars: number) {
  return Math.round(chars * 5.8 + 22);
}

function reportCompactAutoWidthFromChars(chars: number) {
  return Math.round(chars * 5.2 + 16);
}

function reportCompactValueLength(value: string) {
  const compactedNumbers = value.replace(/(\d)[\s\u00a0]+(?=\d)/g, "$1");
  return Math.max(
    reportLongestWordLength(compactedNumbers),
    Math.min(reportTextLength(compactedNumbers), 4),
  );
}

function reportNumericLineWidth(value: string, sizing: ReportNumericColumnSizing) {
  return [...value].reduce((width, char) => {
    if (/\d/.test(char)) return width + sizing.digitPx;
    if (char === " " || char === "\u00a0" || char === "\u202f") return width + sizing.groupSpacePx;
    if (char === "-" || char === "+") return width + sizing.signPx;
    if (char === "%") return width + sizing.percentPx;
    if (char === "." || char === "," || char === ":") return width + sizing.groupSpacePx;
    return width + sizing.labelPx;
  }, sizing.paddingPx);
}

function reportNumericValueWidth(value: string, sizing: ReportNumericColumnSizing) {
  const lines = value
    .replace(/\u00a0/g, " ")
    .replace(/\u202f/g, " ")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return sizing.paddingPx;
  return Math.ceil(lines.reduce((max, line) => Math.max(max, reportNumericLineWidth(line, sizing)), 0));
}

function reportNumericHeaderWidth(header: string, sizing: ReportNumericColumnSizing) {
  const headerChars = Math.max(2, Math.min(reportLongestWordLength(header), sizing.headerChars));
  return Math.ceil(headerChars * sizing.digitPx + sizing.paddingPx);
}

export function reportAutoColumnWidth(key: ReportColumnKey, header: string, values: string[]) {
  const minWidth = reportColumnAutoMinWidths[key] ?? 42;
  const maxWidth = reportColumnAutoMaxWidths[key];

  if (reportNumericColumnKeys.has(key)) {
    const sizing = reportNumericColumnSizing[key];
    if (!sizing) return minWidth;

    const valueWidth = values.reduce((max, value) => Math.max(max, reportNumericValueWidth(value, sizing)), 0);
    return Math.min(maxWidth, Math.max(minWidth, reportNumericHeaderWidth(header, sizing), valueWidth));
  }

  if (reportCompactColumnKeys.has(key)) {
    const headerChars = Math.max(2, Math.min(reportLongestWordLength(header), key === "area" ? 8 : key === "unit" ? 3 : 5));
    const valueChars = values.reduce((max, value) => (
      Math.max(max, Math.min(reportCompactValueLength(value), key === "area" ? 14 : 8))
    ), 0);
    return Math.min(maxWidth, Math.max(minWidth, reportCompactAutoWidthFromChars(Math.max(headerChars, valueChars))));
  }

  const headerChars = Math.max(3, Math.min(reportLongestWordLength(header), 8));
  const valueCap = reportColumnTextCaps[key];
  const valueChars = values.reduce((max, value) => (
    Math.max(max, Math.min(reportTextLength(value), valueCap))
  ), 0);
  const maxChars = Math.max(headerChars, valueChars);

  if (reportReasonColumnKeys.has(key)) {
    const reasonWidth = Math.round(Math.max(reportAutoWidthFromChars(headerChars), 150 + valueChars * 3));
    return Math.min(maxWidth, Math.max(minWidth, reasonWidth));
  }

  return Math.min(maxWidth, Math.max(minWidth, reportAutoWidthFromChars(maxChars)));
}
