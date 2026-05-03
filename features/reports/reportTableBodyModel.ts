import { reportRowDisplayKey } from "../../lib/domain/reports/display";
import { reportReasonEntryKey, reportYearReasonTextWithManualOverride } from "../../lib/domain/reports/reasons";
import type { ReportRow } from "../../lib/domain/reports/types";

export type ReportAreaGroup = {
  area: string;
  rows: ReportRow[];
};

export type ReportTableBodyRowDescriptor = {
  dayReasonText?: string;
  groupRowCount: number;
  row: ReportRow;
  rowIndexInGroup: number;
  rowKey: string;
  rowPrintIndex: number;
  yearReasonText?: string;
};

export type ReportTableBodyGroupDescriptor = {
  area: string;
  rows: ReportTableBodyRowDescriptor[];
};

type CreateReportTableBodyGroupsOptions = {
  filteredReportAreaGroups: ReportAreaGroup[];
  reportDate: string;
  reportGroupStartIndexes: readonly number[];
  reportReasons: Record<string, string>;
};

function reportTableYearReasonText(row: ReportRow, rowKey: string, reportDate: string, reportReasons: Record<string, string>) {
  if (!rowKey.startsWith("summary:")) return row.yearReason;

  return reportYearReasonTextWithManualOverride(reportReasons, rowKey, reportDate, row.yearReason);
}

export function createReportTableBodyGroups({
  filteredReportAreaGroups,
  reportDate,
  reportGroupStartIndexes,
  reportReasons,
}: CreateReportTableBodyGroupsOptions): ReportTableBodyGroupDescriptor[] {
  return filteredReportAreaGroups.map((group, groupIndex) => {
    const groupStartIndex = reportGroupStartIndexes[groupIndex] ?? 0;
    const groupRowCount = group.rows.length;

    return {
      area: group.area,
      rows: group.rows.map((row, index) => {
        const rowPrintIndex = groupStartIndex + index;
        const rowKey = reportRowDisplayKey(row);

        return {
          dayReasonText: reportReasons[reportReasonEntryKey(reportDate, rowKey)],
          groupRowCount,
          row,
          rowIndexInGroup: index,
          rowKey,
          rowPrintIndex,
          yearReasonText: reportTableYearReasonText(row, rowKey, reportDate, reportReasons),
        };
      }),
    };
  });
}
