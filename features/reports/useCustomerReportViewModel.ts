import { useMemo } from "react";

import { defaultReportCustomers } from "@/lib/domain/reports/defaults";
import type { ReportCustomerConfig, ReportRow } from "@/lib/domain/reports/types";
import {
  createCustomerReportRows,
  createReportAreaGroups,
  createReportAreaTabs,
  filterReportAreaGroups,
  flattenReportAreaGroups,
} from "./customerReportRowsModel";

type UseCustomerReportViewModelOptions = {
  needsDerivedReportRows: boolean;
  reportCustomers: ReportCustomerConfig[];
  reportCustomerId: string;
  derivedReportRows: ReportRow[];
  reportArea: string;
};

export function useCustomerReportViewModel({
  needsDerivedReportRows,
  reportCustomers,
  reportCustomerId,
  derivedReportRows,
  reportArea,
}: UseCustomerReportViewModelOptions) {
  const activeReportCustomer = useMemo(() => (
    reportCustomers.find((customer) => customer.id === reportCustomerId)
    ?? reportCustomers.find((customer) => customer.visible)
    ?? reportCustomers[0]
    ?? defaultReportCustomers[0]
  ), [reportCustomerId, reportCustomers]);

  const customerReportRows = useMemo(() => (
    createCustomerReportRows(derivedReportRows, activeReportCustomer, needsDerivedReportRows)
  ), [activeReportCustomer, derivedReportRows, needsDerivedReportRows]);

  const customerReportAreaGroups = useMemo(() => createReportAreaGroups(customerReportRows), [customerReportRows]);

  const reportAreaTabs = useMemo(() => (
    createReportAreaTabs(customerReportAreaGroups, activeReportCustomer.areaOrder, needsDerivedReportRows)
  ), [activeReportCustomer.areaOrder, customerReportAreaGroups, needsDerivedReportRows]);

  const filteredReportAreaGroups = useMemo(() => (
    filterReportAreaGroups(customerReportAreaGroups, reportArea, needsDerivedReportRows)
  ), [customerReportAreaGroups, needsDerivedReportRows, reportArea]);

  const filteredReports = useMemo(() => (
    flattenReportAreaGroups(filteredReportAreaGroups)
  ), [filteredReportAreaGroups]);

  return {
    activeReportCustomer,
    customerReportRows,
    reportAreaTabs,
    filteredReports,
    filteredReportAreaGroups,
  };
}
