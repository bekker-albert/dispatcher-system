import type { PtoPersistenceDayValueRecord } from "./persistence-types";

export function ptoYearDateRange(year: string) {
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
}

export function ptoDayValueRecordInYear(
  record: Pick<PtoPersistenceDayValueRecord, "work_date">,
  year: string,
  normalizeDate: (value: string) => string | null = (value) => value,
) {
  const dateKey = normalizeDate(record.work_date);
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;

  const { start, end } = ptoYearDateRange(year);
  return dateKey >= start && dateKey <= end;
}

export function ptoDayValueRecordsForYear<RecordType extends Pick<PtoPersistenceDayValueRecord, "work_date">>(
  records: RecordType[],
  year: string,
  normalizeDate: (value: string) => string | null = (value) => value,
) {
  return records.filter((record) => ptoDayValueRecordInYear(record, year, normalizeDate));
}
