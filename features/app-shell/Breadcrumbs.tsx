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
  const parts = leafLabel && leafLabel !== workspace ? [workspace, leafLabel] : [workspace];

  return (
    <nav className="erp-topbar__subtitle" aria-label="Breadcrumbs">
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {index > 0 && " / "}
          {part}
        </span>
      ))}
    </nav>
  );
}
