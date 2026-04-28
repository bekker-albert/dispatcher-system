"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { defaultReportCustomerId } from "@/lib/domain/reports/defaults";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";
import { normalizeLookupValue } from "@/lib/utils/text";

type ReportSelectionGuardsOptions = {
  active: boolean;
  reportCustomers: ReportCustomerConfig[];
  reportCustomerId: string;
  setReportCustomerId: Dispatch<SetStateAction<string>>;
  reportArea: string;
  reportAreaTabs: string[];
  setReportArea: Dispatch<SetStateAction<string>>;
};

export function useReportSelectionGuards({
  active,
  reportCustomers,
  reportCustomerId,
  setReportCustomerId,
  reportArea,
  reportAreaTabs,
  setReportArea,
}: ReportSelectionGuardsOptions) {
  useEffect(() => {
    if (!active) return;

    const visibleCustomers = reportCustomers.filter((customer) => customer.visible);
    if (visibleCustomers.some((customer) => customer.id === reportCustomerId)) return;

    setReportCustomerId(visibleCustomers[0]?.id ?? reportCustomers[0]?.id ?? defaultReportCustomerId);
  }, [active, reportCustomerId, reportCustomers, setReportCustomerId]);

  useEffect(() => {
    if (!active) return;

    const hasArea = reportAreaTabs.some((area) => (
      normalizeLookupValue(area) === normalizeLookupValue(reportArea)
    ));
    if (hasArea) return;

    setReportArea("Все участки");
  }, [active, reportArea, reportAreaTabs, setReportArea]);
}
