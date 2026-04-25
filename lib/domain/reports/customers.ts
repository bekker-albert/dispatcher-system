import { createId } from "../../utils/id";
import { isRecord } from "../../utils/normalizers";
import { normalizePtoCustomerCode } from "../pto/date-table";
import type { ReportCustomerConfig, ReportSummaryRowConfig } from "./types";

export function normalizeStoredReportCustomers(value: unknown, defaultReportCustomers: ReportCustomerConfig[]): ReportCustomerConfig[] {
  const cloneDefaults = () => defaultReportCustomers.map((customer) => ({
    ...customer,
    rowKeys: [...customer.rowKeys],
    hiddenRowKeys: [...customer.hiddenRowKeys],
    rowLabels: { ...customer.rowLabels },
    summaryRows: customer.summaryRows.map((row) => ({ ...row, rowKeys: [...row.rowKeys] })),
  }));

  if (!Array.isArray(value)) return cloneDefaults();

  const normalized = value.flatMap((item): ReportCustomerConfig[] => {
    if (!isRecord(item) || typeof item.id !== "string") return [];

    const rowKeys = Array.isArray(item.rowKeys)
      ? Array.from(new Set(item.rowKeys.filter((key): key is string => typeof key === "string" && key.trim().length > 0)))
      : [];
    const hiddenRowKeys = Array.isArray(item.hiddenRowKeys)
      ? Array.from(new Set(item.hiddenRowKeys.filter((key): key is string => typeof key === "string" && key.trim().length > 0)))
      : [];
    const rowLabels = isRecord(item.rowLabels)
      ? Object.fromEntries(
        Object.entries(item.rowLabels)
          .filter((entry): entry is [string, string] => entry[0].trim() !== "" && typeof entry[1] === "string")
          .map(([key, label]) => [key, label.trim()])
          .filter(([, label]) => label !== ""),
      )
      : {};
    const summaryRows = Array.isArray(item.summaryRows)
      ? item.summaryRows.flatMap((summary): ReportSummaryRowConfig[] => {
        if (!isRecord(summary)) return [];

        const summaryRowKeys = Array.isArray(summary.rowKeys)
          ? Array.from(new Set(summary.rowKeys.filter((key): key is string => typeof key === "string" && key.trim().length > 0)))
          : [];

        return [{
          id: typeof summary.id === "string" && summary.id.trim() ? summary.id : createId(),
          label: typeof summary.label === "string" && summary.label.trim() ? summary.label : "Итоговая строка",
          unit: typeof summary.unit === "string" ? summary.unit : "",
          area: typeof summary.area === "string" ? summary.area : "Итого",
          rowKeys: summaryRowKeys,
        }];
      })
      : [];
    const fallback = defaultReportCustomers.find((customer) => customer.id === item.id);

    return [{
      id: item.id,
      label: typeof item.label === "string" && item.label.trim() ? item.label : "Заказчик",
      ptoCode: normalizePtoCustomerCode(typeof item.ptoCode === "string" ? item.ptoCode : fallback?.ptoCode),
      visible: item.visible !== false,
      autoShowRows: typeof item.autoShowRows === "boolean" ? item.autoShowRows : fallback?.autoShowRows ?? false,
      rowKeys,
      hiddenRowKeys,
      rowLabels,
      summaryRows,
    }];
  });

  const defaults = cloneDefaults();
  const defaultById = new Map(defaults.map((customer) => [customer.id, customer]));
  const customers = normalized.length > 0 ? normalized : defaults;

  return customers.map((customer) => {
    const fallback = defaultById.get(customer.id);
    return {
      ...customer,
      label: customer.label.trim() || fallback?.label || "Заказчик",
      ptoCode: normalizePtoCustomerCode(customer.ptoCode || fallback?.ptoCode),
      visible: customer.visible !== false,
      autoShowRows: customer.autoShowRows === true,
      rowKeys: Array.from(new Set(customer.rowKeys)),
      hiddenRowKeys: Array.from(new Set(customer.hiddenRowKeys)),
      rowLabels: { ...customer.rowLabels },
      summaryRows: customer.summaryRows.map((summary) => ({
        ...summary,
        label: summary.label.trim() || "Итоговая строка",
        rowKeys: Array.from(new Set(summary.rowKeys)),
      })),
    };
  });
}
