import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { AdminLogEntry } from "@/lib/domain/admin/logs";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";

type AdminLogInput = Omit<AdminLogEntry, "id" | "at" | "user">;

type UseAdminReportFactSourceEditorOptions = {
  setReportCustomers: Dispatch<SetStateAction<ReportCustomerConfig[]>>;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function useAdminReportFactSourceEditor({
  setReportCustomers,
  addAdminLog,
}: UseAdminReportFactSourceEditorOptions) {
  const setReportCustomerFactSourceMode = useCallback((customerId: string, targetRowKey: string, enabled: boolean) => {
    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      const nextFactSourceRowKeys = { ...customer.factSourceRowKeys };
      if (enabled) {
        nextFactSourceRowKeys[targetRowKey] = nextFactSourceRowKeys[targetRowKey]?.length
          ? nextFactSourceRowKeys[targetRowKey]
          : [targetRowKey];
      } else {
        delete nextFactSourceRowKeys[targetRowKey];
      }

      return { ...customer, factSourceRowKeys: nextFactSourceRowKeys };
    }));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменен источник факта для строки отчета.",
    });
  }, [addAdminLog, setReportCustomers]);

  const toggleReportCustomerFactSourceRowKey = useCallback((customerId: string, targetRowKey: string, sourceRowKey: string) => {
    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      const currentSourceRowKeys = customer.factSourceRowKeys[targetRowKey] ?? [];
      const nextSourceRowKeys = currentSourceRowKeys.includes(sourceRowKey)
        ? currentSourceRowKeys.filter((key) => key !== sourceRowKey)
        : [...currentSourceRowKeys, sourceRowKey];
      const nextFactSourceRowKeys = { ...customer.factSourceRowKeys };

      if (nextSourceRowKeys.length > 0) {
        nextFactSourceRowKeys[targetRowKey] = Array.from(new Set(nextSourceRowKeys));
      } else {
        delete nextFactSourceRowKeys[targetRowKey];
      }

      return { ...customer, factSourceRowKeys: nextFactSourceRowKeys };
    }));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменен состав строк для суммы факта.",
    });
  }, [addAdminLog, setReportCustomers]);

  return {
    setReportCustomerFactSourceMode,
    toggleReportCustomerFactSourceRowKey,
  };
}
