import { aggregateReportReasons } from "./reason-aggregation";
import { reportReasonEntryDate, reportReasonEntryRowKey } from "./reason-keys";

export type ReportReasonIndex = Map<string, Array<{ date: string; value: string }>>;

export function createReportReasonIndex(reasons: Record<string, string>): ReportReasonIndex {
  const index: ReportReasonIndex = new Map();

  Object.entries(reasons).forEach(([key, value]) => {
    const date = reportReasonEntryDate(key);
    if (!date || value.trim() === "") return;

    const rowKey = reportReasonEntryRowKey(key);
    if (!rowKey) return;

    const rows = index.get(rowKey);
    if (rows) {
      rows.push({ date, value: value.trim() });
    } else {
      index.set(rowKey, [{ date, value: value.trim() }]);
    }
  });

  index.forEach((values) => {
    values.sort((left, right) => left.date.localeCompare(right.date));
  });

  return index;
}

export function reportYearReasonFromMap(
  reasons: Record<string, string>,
  rowKey: string,
  reportDateValue: string,
  startDate: string,
) {
  const year = reportDateValue.slice(0, 4);
  const values = Object.entries(reasons)
    .filter(([key, value]) => {
      const date = reportReasonEntryDate(key);
      return date.startsWith(year)
        && date >= startDate
        && date <= reportDateValue
        && reportReasonEntryRowKey(key) === rowKey
        && value.trim() !== "";
    })
    .map(([, value]) => value.trim());

  return aggregateReportReasons(values);
}

export function reportYearReasonFromIndex(
  reasonIndex: ReportReasonIndex,
  rowKey: string,
  reportDateValue: string,
  startDate: string,
) {
  const year = reportDateValue.slice(0, 4);
  const values = (reasonIndex.get(rowKey) ?? [])
    .filter(({ date }) => date.startsWith(year) && date >= startDate && date <= reportDateValue)
    .map(({ value }) => value);

  return aggregateReportReasons(values);
}
