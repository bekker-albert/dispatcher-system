import { reportRowDisplayKey } from "./keys";
import type { ReportCustomerConfig, ReportRow } from "./types";

export function applyReportCustomerRowLabel(row: ReportRow, customer: Pick<ReportCustomerConfig, "rowLabels">): ReportRow {
  const rowKey = reportRowDisplayKey(row);
  const customerLabel = customer.rowLabels[rowKey]?.trim();

  return customerLabel ? { ...row, displayKey: rowKey, name: customerLabel } : row;
}
