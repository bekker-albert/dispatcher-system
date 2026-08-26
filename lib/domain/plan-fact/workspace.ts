import type { ReportCustomerConfig } from "../reports/types";

export const builtInPlanFactReportIds = [
  "aa-mining",
  "ak-altynalmas",
  "aa-engineering",
] as const;

const builtInReportMeta: Record<string, { shortLabel: string; defaultLabel: string }> = {
  "aa-mining": { shortLabel: "ААМ", defaultLabel: "ТОО AA Mining" },
  "ak-altynalmas": { shortLabel: "АА", defaultLabel: "АО АК Алтыналмас" },
  "aa-engineering": { shortLabel: "ААЕ", defaultLabel: "ТОО AA Engineering" },
};

export function isBuiltInPlanFactReport(id: string) {
  return builtInPlanFactReportIds.includes(id as (typeof builtInPlanFactReportIds)[number]);
}

export function planFactReportTabLabel(customer: Pick<ReportCustomerConfig, "id" | "label">) {
  const meta = builtInReportMeta[customer.id];
  if (!meta) return customer.label;
  return customer.label === meta.defaultLabel ? meta.shortLabel : customer.label;
}

export function clonePlanFactReportCustomer(
  template: ReportCustomerConfig,
  options: { id: string; label: string },
): ReportCustomerConfig {
  return {
    ...template,
    id: options.id,
    label: options.label.trim(),
    visible: true,
    rowKeys: [...template.rowKeys],
    hiddenRowKeys: [...template.hiddenRowKeys],
    rowLabels: { ...template.rowLabels },
    factSourceRowKeys: Object.fromEntries(
      Object.entries(template.factSourceRowKeys).map(([key, values]) => [key, [...values]]),
    ),
    summaryRows: template.summaryRows.map((row) => ({ ...row, rowKeys: [...row.rowKeys] })),
    areaOrder: [...template.areaOrder],
    workOrder: Object.fromEntries(
      Object.entries(template.workOrder).map(([key, values]) => [key, [...values]]),
    ),
  };
}

export function movePlanFactReportCustomer(
  customers: ReportCustomerConfig[],
  id: string,
  direction: -1 | 1,
) {
  const index = customers.findIndex((customer) => customer.id === id);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= customers.length) return customers;

  const next = [...customers];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

export function firstVisiblePlanFactReport(
  customers: ReportCustomerConfig[],
  excludedId?: string,
) {
  return customers.find((customer) => customer.visible && customer.id !== excludedId) ?? null;
}
