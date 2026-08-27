"use client";

import { formatReportDate } from "@/lib/domain/reports/display";

import type { NavigationTrail } from "./navigationMapping";

type BreadcrumbsProps = {
  activeReportCustomerCode?: string;
  reportDate: string;
  trail: NavigationTrail;
};

const reportCustomerCodeLabels: Record<string, string> = {
  AA: "АА",
  AAE: "ААЕ",
  AAM: "ААМ",
};

const compactReportDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function compactReportDate(reportDate: string) {
  return compactReportDateFormatter.format(new Date(`${reportDate}T00:00:00`));
}

function dispatchShiftTitle(itemId: string | undefined, reportDate: string) {
  if (itemId === "dispatch-daily-volumes") {
    return `Суточные объемы за ${compactReportDate(reportDate)}`;
  }
  if (itemId === "dispatch-night") {
    return `Заполнение ночной сводки за ${formatReportDate(reportDate)}`;
  }
  if (itemId === "dispatch-day") {
    return `Заполнение дневной сводки за ${formatReportDate(reportDate)}`;
  }
  return "";
}

export function Breadcrumbs({ activeReportCustomerCode, reportDate, trail }: BreadcrumbsProps) {
  const workspace = trail.workspace;
  const leaf = trail.child ?? trail.item;
  const reportCustomerCode = activeReportCustomerCode
    ? reportCustomerCodeLabels[activeReportCustomerCode.toUpperCase()] ?? activeReportCustomerCode
    : "";
  const leafLabel = trail.workspaceId === "reports" && leaf && reportCustomerCode && !leaf.includes(reportCustomerCode)
    ? `${leaf} ${reportCustomerCode}`
    : leaf;
  const title = dispatchShiftTitle(trail.childId ?? trail.itemId, reportDate) || leafLabel || workspace;

  return (
    <div className="erp-topbar__heading">
      <div className="erp-topbar__title" title={title}>{title}</div>
    </div>
  );
}
