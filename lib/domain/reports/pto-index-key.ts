import { normalizePtoCustomerCode } from "../pto/date-table";
import { reportRowKeyFromParts } from "./keys";
import type { ReportRow } from "./types";

export function reportPtoIndexKey(area: string, name: string, customerCode = "") {
  return reportRowKeyFromParts(area, name, normalizePtoCustomerCode(customerCode), { cleanArea: true });
}

export function reportIndexKey(
  row: Pick<ReportRow, "area" | "name"> & Partial<Pick<ReportRow, "customerCode">>,
  includeCustomerCode = true,
) {
  return reportPtoIndexKey(row.area, row.name, includeCustomerCode ? row.customerCode : "");
}
