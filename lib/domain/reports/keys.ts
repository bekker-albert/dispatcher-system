import { normalizePtoCustomerCode } from "../pto/date-table";
import { cleanAreaName, normalizeLookupValue } from "../../utils/text";
import type { ReportCustomerConfig, ReportRow } from "./types";

export function reportRowKeyFromParts(area: string, name: string, customerCode = "", options: { cleanArea?: boolean } = {}) {
  const normalizedArea = normalizeLookupValue(options.cleanArea ? cleanAreaName(area) : area);
  const baseKey = `${normalizedArea}::${normalizeLookupValue(name)}`;
  const normalizedCustomerCode = normalizePtoCustomerCode(customerCode);

  return normalizedCustomerCode ? `${baseKey}::${normalizeLookupValue(normalizedCustomerCode)}` : baseKey;
}

export function reportRowKey(row: Pick<ReportRow, "area" | "name"> & Partial<Pick<ReportRow, "customerCode">>) {
  return reportRowKeyFromParts(row.area, row.name, row.customerCode);
}

export function reportRowCustomerCode(row: Partial<Pick<ReportRow, "customerCode">>) {
  return normalizePtoCustomerCode(row.customerCode) || "AAM";
}

export function reportRowBasePtoKey(row: Pick<ReportRow, "area" | "name">) {
  return reportRowKeyFromParts(row.area, row.name);
}

export function reportRowMatchesCustomer(row: ReportRow, customer: ReportCustomerConfig) {
  const rowCode = reportRowCustomerCode(row);
  const customerCode = normalizePtoCustomerCode(customer.ptoCode) || "AAM";

  if (customerCode === "AAM") return rowCode === "AAM";

  return rowCode === customerCode || rowCode === "AAM";
}

export function reportRowsForCustomer(rows: ReportRow[], customer: ReportCustomerConfig) {
  const customerCode = normalizePtoCustomerCode(customer.ptoCode) || "AAM";
  const matchingRows = rows.filter((row) => reportRowMatchesCustomer(row, customer));

  if (customerCode === "AAM") return matchingRows;

  const assignedRowKeys = new Set(
    rows
      .filter((row) => reportRowCustomerCode(row) === customerCode)
      .map(reportRowBasePtoKey),
  );

  return matchingRows.filter((row) => {
    if (reportRowCustomerCode(row) !== "AAM") return true;

    return !assignedRowKeys.has(reportRowBasePtoKey(row));
  });
}

export function reportRowDisplayKey(row: ReportRow) {
  return row.displayKey ?? reportRowKey(row);
}

export function reportCustomerEffectiveRowKeys(customer: ReportCustomerConfig, autoRowKeys: Set<string>) {
  if (customer.autoShowRows) {
    const hiddenRowKeys = new Set(customer.hiddenRowKeys);
    return new Set(Array.from(autoRowKeys).filter((key) => !hiddenRowKeys.has(key)));
  }

  return new Set(customer.rowKeys);
}
