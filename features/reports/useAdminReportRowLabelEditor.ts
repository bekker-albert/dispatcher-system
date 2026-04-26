import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { AdminLogEntry } from "@/lib/domain/admin/logs";
import {
  reportCustomerEffectiveRowKeys,
  reportRowKey,
  reportRowsForCustomer,
} from "@/lib/domain/reports/display";
import type { ReportCustomerConfig, ReportRow } from "@/lib/domain/reports/types";

type AdminLogInput = Omit<AdminLogEntry, "id" | "at" | "user">;

type UseAdminReportRowLabelEditorOptions = {
  reportCustomers: ReportCustomerConfig[];
  baseRows: ReportRow[];
  rowsByKey: ReadonlyMap<string, ReportRow>;
  setReportCustomers: Dispatch<SetStateAction<ReportCustomerConfig[]>>;
  setEditingRowLabelKeys: Dispatch<SetStateAction<string[]>>;
  reportAutoRowKeysForCustomer: (customer: ReportCustomerConfig) => Set<string>;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function useAdminReportRowLabelEditor({
  reportCustomers,
  baseRows,
  rowsByKey,
  setReportCustomers,
  setEditingRowLabelKeys,
  reportAutoRowKeysForCustomer,
  addAdminLog,
}: UseAdminReportRowLabelEditorOptions) {
  const startReportRowLabelEdit = useCallback((rowKey: string) => {
    setEditingRowLabelKeys((current) => (
      current.includes(rowKey) ? current : [...current, rowKey]
    ));
  }, [setEditingRowLabelKeys]);

  const finishReportRowLabelEdit = useCallback((rowKey: string) => {
    setEditingRowLabelKeys((current) => current.filter((key) => key !== rowKey));
    addAdminLog({
      action: "Сохранение",
      section: "Отчетность",
      details: "Завершено редактирование переименования строки.",
    });
  }, [addAdminLog, setEditingRowLabelKeys]);

  const updateReportCustomerRowLabel = useCallback((customerId: string, rowKey: string, value: string, fallback: string) => {
    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      const nextLabels = { ...customer.rowLabels };
      const nextLabel = value.trim();
      if (!nextLabel || nextLabel === fallback.trim()) {
        delete nextLabels[rowKey];
      } else {
        nextLabels[rowKey] = value;
      }

      return { ...customer, rowLabels: nextLabels };
    }));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменено название строки отчета для заказчика.",
    });
  }, [addAdminLog, setReportCustomers]);

  const addReportCustomerRowLabel = useCallback((customerId: string) => {
    const customer = reportCustomers.find((item) => item.id === customerId);
    if (!customer) return;

    const customerAutoRowKeys = reportAutoRowKeysForCustomer(customer);
    const customerRows = reportRowsForCustomer(baseRows, customer);
    const customerVisibleRowKeys = reportCustomerEffectiveRowKeys(customer, customerAutoRowKeys);
    const selectedRows = customerRows.filter((row) => customerVisibleRowKeys.has(reportRowKey(row)));
    const sourceRows = selectedRows.length > 0 ? selectedRows : customerRows;
    const targetRow = sourceRows.find((item) => !customer.rowLabels[reportRowKey(item)]) ?? sourceRows[0];
    if (!targetRow) return;

    const targetRowKey = reportRowKey(targetRow);

    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      return {
        ...customer,
        rowKeys: customer.rowKeys.includes(targetRowKey) ? customer.rowKeys : [...customer.rowKeys, targetRowKey],
        rowLabels: { ...customer.rowLabels, [targetRowKey]: customer.rowLabels[targetRowKey] ?? targetRow.name },
      };
    }));
    startReportRowLabelEdit(targetRowKey);
    addAdminLog({
      action: "Добавление",
      section: "Отчетность",
      details: "Добавлено переименование строки для заказчика.",
    });
  }, [addAdminLog, baseRows, reportAutoRowKeysForCustomer, reportCustomers, setReportCustomers, startReportRowLabelEdit]);

  const changeReportCustomerRowLabelSource = useCallback((customerId: string, currentRowKey: string, nextRowKey: string) => {
    if (currentRowKey === nextRowKey) return;

    const currentRow = rowsByKey.get(currentRowKey);
    const nextRow = rowsByKey.get(nextRowKey);
    if (!nextRow) return;

    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      const nextLabels = { ...customer.rowLabels };
      const currentLabel = nextLabels[currentRowKey];
      const labelIsDefault = !currentLabel || currentLabel.trim() === currentRow?.name.trim();
      delete nextLabels[currentRowKey];
      nextLabels[nextRowKey] = labelIsDefault ? nextRow.name : currentLabel;

      return {
        ...customer,
        rowKeys: customer.rowKeys.includes(nextRowKey) ? customer.rowKeys : [...customer.rowKeys, nextRowKey],
        rowLabels: nextLabels,
      };
    }));
    setEditingRowLabelKeys((current) => (
      current.includes(currentRowKey)
        ? Array.from(new Set([...current.filter((key) => key !== currentRowKey), nextRowKey]))
        : current
    ));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменена строка для переименования заказчика.",
    });
  }, [addAdminLog, rowsByKey, setEditingRowLabelKeys, setReportCustomers]);

  const removeReportCustomerRowLabel = useCallback((customerId: string, rowKey: string) => {
    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      const nextLabels = { ...customer.rowLabels };
      delete nextLabels[rowKey];
      return { ...customer, rowLabels: nextLabels };
    }));
    setEditingRowLabelKeys((current) => current.filter((key) => key !== rowKey));
    addAdminLog({
      action: "Удаление",
      section: "Отчетность",
      details: "Удалено переименование строки для заказчика.",
    });
  }, [addAdminLog, setEditingRowLabelKeys, setReportCustomers]);

  return {
    updateReportCustomerRowLabel,
    addReportCustomerRowLabel,
    changeReportCustomerRowLabelSource,
    removeReportCustomerRowLabel,
    startReportRowLabelEdit,
    finishReportRowLabelEdit,
  };
}
