"use client";

import type { NavigationTrail } from "./navigationMapping";

type BreadcrumbsProps = {
  activeReportCustomerCode?: string;
  trail: NavigationTrail;
};

const reportCustomerCodeLabels: Record<string, string> = {
  AA: "АА",
  AAE: "ААЕ",
  AAM: "ААМ",
};

export function Breadcrumbs({ activeReportCustomerCode, trail }: BreadcrumbsProps) {
  const workspace = trail.workspace;
  const leaf = trail.child ?? trail.item;
  const reportCustomerCode = activeReportCustomerCode
    ? reportCustomerCodeLabels[activeReportCustomerCode.toUpperCase()] ?? activeReportCustomerCode
    : "";
  const leafLabel = trail.workspaceId === "reports" && leaf && reportCustomerCode && !leaf.includes(reportCustomerCode)
    ? `${leaf} ${reportCustomerCode}`
    : leaf;
  const title = leafLabel || workspace;

  return (
    <div className="erp-topbar__heading">
      <div className="erp-topbar__title" title={title}>{title}</div>
    </div>
  );
}
