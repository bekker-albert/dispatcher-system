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
    factSourceRowKeys: Object.fromEntries(Object.entries(customer.factSourceRowKeys ?? {}).map(([rowKey, sourceRowKeys]) => [rowKey, [...sourceRowKeys]])),
    summaryRows: customer.summaryRows.map((row) => ({ ...row, rowKeys: [...row.rowKeys] })),
    areaOrder: [...customer.areaOrder],
    workOrder: Object.fromEntries(Object.entries(customer.workOrder).map(([area, rowKeys]) => [area, [...rowKeys]])),
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
          planRowKey: typeof summary.planRowKey === "string" && summary.planRowKey.trim() ? summary.planRowKey : "",
          rowKeys: summaryRowKeys,
        }];
      })
      : [];
    const factSourceRowKeys = isRecord(item.factSourceRowKeys)
      ? Object.fromEntries(
        Object.entries(item.factSourceRowKeys)
          .filter((entry): entry is [string, unknown[]] => entry[0].trim() !== "" && Array.isArray(entry[1]))
          .map(([rowKey, sourceRowKeys]) => [
            rowKey,
            Array.from(new Set(sourceRowKeys.filter((key): key is string => typeof key === "string" && key.trim().length > 0))),
          ])
          .filter(([, sourceRowKeys]) => sourceRowKeys.length > 0),
      )
      : {};
    const areaOrder = Array.isArray(item.areaOrder)
      ? Array.from(new Set(item.areaOrder.filter((area): area is string => typeof area === "string" && area.trim().length > 0)))
      : [];
    const workOrder = isRecord(item.workOrder)
      ? Object.fromEntries(
        Object.entries(item.workOrder)
          .filter((entry): entry is [string, unknown[]] => entry[0].trim() !== "" && Array.isArray(entry[1]))
          .map(([area, rowKeys]) => [
            area,
            Array.from(new Set(rowKeys.filter((key): key is string => typeof key === "string" && key.trim().length > 0))),
          ]),
      )
      : {};
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
      factSourceRowKeys,
      summaryRows,
      areaOrder,
      workOrder,
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
      factSourceRowKeys: Object.fromEntries(
        Object.entries(customer.factSourceRowKeys)
          .filter(([rowKey]) => rowKey.trim() !== "")
          .map(([rowKey, sourceRowKeys]) => [rowKey, Array.from(new Set(sourceRowKeys))])
          .filter(([, sourceRowKeys]) => sourceRowKeys.length > 0),
      ),
      areaOrder: Array.from(new Set(customer.areaOrder)),
      workOrder: Object.fromEntries(Object.entries(customer.workOrder).map(([area, rowKeys]) => [area, Array.from(new Set(rowKeys))])),
      summaryRows: customer.summaryRows.map((summary) => ({
        ...summary,
        label: summary.label.trim() || "Итоговая строка",
        planRowKey: summary.planRowKey?.trim() || "",
        rowKeys: Array.from(new Set(summary.rowKeys)),
      })),
    };
  });
}
