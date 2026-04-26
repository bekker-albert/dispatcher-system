import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { AdminLogEntry } from "@/lib/domain/admin/logs";
import {
  reportCustomerUsesSummaryRows,
  reportRowKey,
} from "@/lib/domain/reports/display";
import type { ReportCustomerConfig, ReportRow, ReportSummaryRowConfig } from "@/lib/domain/reports/types";
import { createId } from "@/lib/utils/id";
import { normalizeLookupValue } from "@/lib/utils/text";

type AdminLogInput = Omit<AdminLogEntry, "id" | "at" | "user">;

type SummaryEditableField = Exclude<keyof ReportSummaryRowConfig, "id" | "rowKeys">;

type UseAdminReportSummaryRowsEditorOptions = {
  reportCustomers: ReportCustomerConfig[];
  baseRows: ReportRow[];
  summaryAreaOptions: string[];
  setReportCustomers: Dispatch<SetStateAction<ReportCustomerConfig[]>>;
  setExpandedSummaryIds: Dispatch<SetStateAction<string[]>>;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function useAdminReportSummaryRowsEditor({
  reportCustomers,
  baseRows,
  summaryAreaOptions,
  setReportCustomers,
  setExpandedSummaryIds,
  addAdminLog,
}: UseAdminReportSummaryRowsEditorOptions) {
  const reportRowsForSummaryArea = useCallback((area: string) => {
    const areaKey = normalizeLookupValue(area);
    return baseRows.filter((row) => normalizeLookupValue(row.area) === areaKey);
  }, [baseRows]);

  const reportRowKeysForSummaryArea = useCallback((area: string) => (
    reportRowsForSummaryArea(area).map(reportRowKey)
  ), [reportRowsForSummaryArea]);

  const addReportSummaryRow = useCallback((customerId: string) => {
    const customer = reportCustomers.find((item) => item.id === customerId);
    if (!customer || !reportCustomerUsesSummaryRows(customer)) return;
    const area = summaryAreaOptions[0] ?? baseRows[0]?.area ?? "";
    const summaryId = createId();

    setReportCustomers((current) => current.map((customer) => (
      customer.id === customerId
        ? {
          ...customer,
          summaryRows: [
            ...customer.summaryRows,
            { id: summaryId, label: "Итоговая строка", unit: "", area, planRowKey: "", rowKeys: reportRowKeysForSummaryArea(area) },
          ],
        }
        : customer
    )));
    setExpandedSummaryIds((current) => Array.from(new Set([...current, summaryId])));
    addAdminLog({
      action: "Добавление",
      section: "Отчетность",
      details: "Добавлена итоговая строка для заказчика.",
    });
  }, [addAdminLog, baseRows, reportCustomers, reportRowKeysForSummaryArea, setExpandedSummaryIds, setReportCustomers, summaryAreaOptions]);

  const startReportSummaryEdit = useCallback((summaryId: string) => {
    setExpandedSummaryIds((current) => (
      current.includes(summaryId) ? current : [...current, summaryId]
    ));
  }, [setExpandedSummaryIds]);

  const finishReportSummaryEdit = useCallback((summaryId: string) => {
    setExpandedSummaryIds((current) => current.filter((id) => id !== summaryId));
    addAdminLog({
      action: "Сохранение",
      section: "Отчетность",
      details: "Завершено редактирование состава итоговой строки.",
    });
  }, [addAdminLog, setExpandedSummaryIds]);

  const updateReportSummaryRow = useCallback((
    customerId: string,
    summaryId: string,
    field: SummaryEditableField,
    value: string,
  ) => {
    setReportCustomers((current) => current.map((customer) => (
      customer.id === customerId
        ? {
          ...customer,
          summaryRows: customer.summaryRows.map((summary) => {
            if (summary.id !== summaryId) return summary;

            if (field === "area") {
              return { ...summary, area: value, planRowKey: "", rowKeys: reportRowKeysForSummaryArea(value) };
            }

            return { ...summary, [field]: value };
          }),
        }
        : customer
    )));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменена итоговая строка заказчика.",
    });
  }, [addAdminLog, reportRowKeysForSummaryArea, setReportCustomers]);

  const toggleReportSummaryRowKey = useCallback((customerId: string, summaryId: string, rowKey: string) => {
    setReportCustomers((current) => current.map((customer) => (
      customer.id === customerId
        ? {
          ...customer,
          summaryRows: customer.summaryRows.map((summary) => {
            if (summary.id !== summaryId) return summary;
            const rowKeys = summary.rowKeys.includes(rowKey)
              ? summary.rowKeys.filter((key) => key !== rowKey)
              : [...summary.rowKeys, rowKey];
            return { ...summary, rowKeys };
          }),
        }
        : customer
    )));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменен состав итоговой строки заказчика.",
    });
  }, [addAdminLog, setReportCustomers]);

  const removeReportSummaryRow = useCallback((customerId: string, summaryId: string) => {
    if (!window.confirm("Удалить итоговую строку из отчетности заказчика?")) return;

    setExpandedSummaryIds((current) => current.filter((id) => id !== summaryId));
    setReportCustomers((current) => current.map((customer) => (
      customer.id === customerId
        ? { ...customer, summaryRows: customer.summaryRows.filter((summary) => summary.id !== summaryId) }
        : customer
    )));
    addAdminLog({
      action: "Удаление",
      section: "Отчетность",
      details: "Удалена итоговая строка заказчика.",
    });
  }, [addAdminLog, setExpandedSummaryIds, setReportCustomers]);

  return {
    reportRowsForSummaryArea,
    addReportSummaryRow,
    startReportSummaryEdit,
    finishReportSummaryEdit,
    updateReportSummaryRow,
    toggleReportSummaryRowKey,
    removeReportSummaryRow,
  };
}
