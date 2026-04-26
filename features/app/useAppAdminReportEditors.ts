import type { Dispatch, SetStateAction } from "react";
import { useAdminReportCustomerEditor } from "@/features/reports/useAdminReportCustomerEditor";
import { useAdminReportFactSourceEditor } from "@/features/reports/useAdminReportFactSourceEditor";
import { useAdminReportRowLabelEditor } from "@/features/reports/useAdminReportRowLabelEditor";
import { useAdminReportSummaryRowsEditor } from "@/features/reports/useAdminReportSummaryRowsEditor";
import type { AdminLogEntry } from "@/lib/domain/admin/logs";
import type { ReportCustomerConfig, ReportRow } from "@/lib/domain/reports/types";

type AdminLogInput = Omit<AdminLogEntry, "id" | "at" | "user">;

type UseAppAdminReportEditorsOptions = {
  activeAdminReportAreaOptions: string[];
  activeAdminReportBaseRows: ReportRow[];
  activeAdminReportCustomer: ReportCustomerConfig;
  activeAdminReportOrderRows: ReportRow[];
  activeAdminReportRowsByKey: ReadonlyMap<string, ReportRow>;
  activeAdminReportSummaryAreaOptions: string[];
  addAdminLog: (entry: AdminLogInput) => void;
  adminReportBaseRows: ReportRow[];
  reportAutoRowKeysForCustomer: (customer: ReportCustomerConfig) => Set<string>;
  reportCustomers: ReportCustomerConfig[];
  setAdminReportCustomerId: Dispatch<SetStateAction<string>>;
  setEditingReportRowLabelKeys: Dispatch<SetStateAction<string[]>>;
  setExpandedReportSummaryIds: Dispatch<SetStateAction<string[]>>;
  setReportCustomerId: Dispatch<SetStateAction<string>>;
  setReportCustomers: Dispatch<SetStateAction<ReportCustomerConfig[]>>;
};

export function useAppAdminReportEditors({
  activeAdminReportAreaOptions,
  activeAdminReportBaseRows,
  activeAdminReportCustomer,
  activeAdminReportOrderRows,
  activeAdminReportRowsByKey,
  activeAdminReportSummaryAreaOptions,
  addAdminLog,
  adminReportBaseRows,
  reportAutoRowKeysForCustomer,
  reportCustomers,
  setAdminReportCustomerId,
  setEditingReportRowLabelKeys,
  setExpandedReportSummaryIds,
  setReportCustomerId,
  setReportCustomers,
}: UseAppAdminReportEditorsOptions) {
  const customerEditor = useAdminReportCustomerEditor({
    reportCustomers,
    activeCustomer: activeAdminReportCustomer,
    areaOptions: activeAdminReportAreaOptions,
    orderRows: activeAdminReportOrderRows,
    setReportCustomers,
    setAdminReportCustomerId,
    setReportCustomerId,
    reportAutoRowKeysForCustomer,
    addAdminLog,
  });

  const rowLabelEditor = useAdminReportRowLabelEditor({
    reportCustomers,
    baseRows: adminReportBaseRows,
    rowsByKey: activeAdminReportRowsByKey,
    setReportCustomers,
    setEditingRowLabelKeys: setEditingReportRowLabelKeys,
    reportAutoRowKeysForCustomer,
    addAdminLog,
  });

  const factSourceEditor = useAdminReportFactSourceEditor({
    setReportCustomers,
    addAdminLog,
  });

  const summaryRowsEditor = useAdminReportSummaryRowsEditor({
    reportCustomers,
    baseRows: activeAdminReportBaseRows,
    summaryAreaOptions: activeAdminReportSummaryAreaOptions,
    setReportCustomers,
    setExpandedSummaryIds: setExpandedReportSummaryIds,
    addAdminLog,
  });

  return {
    ...customerEditor,
    ...rowLabelEditor,
    ...factSourceEditor,
    ...summaryRowsEditor,
  };
}
