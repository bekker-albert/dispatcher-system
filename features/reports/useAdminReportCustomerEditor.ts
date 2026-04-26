import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { AdminLogEntry } from "@/lib/domain/admin/logs";
import { normalizePtoCustomerCode } from "@/lib/domain/pto/date-table";
import { defaultReportCustomerId } from "@/lib/domain/reports/defaults";
import {
  reportCustomerEffectiveRowKeys,
  reportRowDisplayKey,
  sortReportRowsByAreaOrder,
} from "@/lib/domain/reports/display";
import type { ReportCustomerConfig, ReportRow } from "@/lib/domain/reports/types";
import { createId } from "@/lib/utils/id";
import { normalizeLookupValue } from "@/lib/utils/text";

type ReportCustomerPatch = Partial<Pick<ReportCustomerConfig, "label" | "ptoCode" | "visible" | "autoShowRows">>;

type AdminLogInput = Omit<AdminLogEntry, "id" | "at" | "user">;

type UseAdminReportCustomerEditorOptions = {
  reportCustomers: ReportCustomerConfig[];
  activeCustomer: ReportCustomerConfig;
  areaOptions: string[];
  orderRows: ReportRow[];
  setReportCustomers: Dispatch<SetStateAction<ReportCustomerConfig[]>>;
  setAdminReportCustomerId: Dispatch<SetStateAction<string>>;
  setReportCustomerId: Dispatch<SetStateAction<string>>;
  reportAutoRowKeysForCustomer: (customer: ReportCustomerConfig) => Set<string>;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function useAdminReportCustomerEditor({
  reportCustomers,
  activeCustomer,
  areaOptions,
  orderRows,
  setReportCustomers,
  setAdminReportCustomerId,
  setReportCustomerId,
  reportAutoRowKeysForCustomer,
  addAdminLog,
}: UseAdminReportCustomerEditorOptions) {
  const updateReportCustomer = useCallback((customerId: string, patch: ReportCustomerPatch) => {
    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      if (customer.autoShowRows && patch.autoShowRows === false) {
        const customerAutoRowKeys = reportAutoRowKeysForCustomer(customer);

        return {
          ...customer,
          ...patch,
          rowKeys: Array.from(reportCustomerEffectiveRowKeys(customer, customerAutoRowKeys)),
          hiddenRowKeys: [],
        };
      }

      return {
        ...customer,
        ...patch,
        ptoCode: patch.ptoCode !== undefined ? normalizePtoCustomerCode(patch.ptoCode) : customer.ptoCode,
      };
    }));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменены настройки заказчика отчета.",
    });
  }, [addAdminLog, reportAutoRowKeysForCustomer, setReportCustomers]);

  const addReportCustomer = useCallback(() => {
    const customerId = createId();
    const customer: ReportCustomerConfig = {
      id: customerId,
      label: `Заказчик ${reportCustomers.length + 1}`,
      ptoCode: `C${reportCustomers.length + 1}`,
      visible: true,
      autoShowRows: false,
      rowKeys: [],
      hiddenRowKeys: [],
      rowLabels: {},
      factSourceRowKeys: {},
      summaryRows: [],
      areaOrder: [],
      workOrder: {},
    };

    setReportCustomers((current) => [...current, customer]);
    setAdminReportCustomerId(customerId);
    setReportCustomerId(customerId);
    addAdminLog({
      action: "Добавление",
      section: "Отчетность",
      details: "Добавлен заказчик отчета.",
    });
  }, [addAdminLog, reportCustomers.length, setAdminReportCustomerId, setReportCustomerId, setReportCustomers]);

  const deleteReportCustomer = useCallback((customerId: string) => {
    const customer = reportCustomers.find((item) => item.id === customerId);
    if (!customer) return;

    if (reportCustomers.length <= 1) {
      window.alert("Нельзя удалить последнего заказчика.");
      return;
    }

    if (!window.confirm(`Удалить заказчика "${customer.label}"?`)) return;

    const customerIndex = reportCustomers.findIndex((item) => item.id === customerId);
    const nextCustomers = reportCustomers.filter((item) => item.id !== customerId);
    const nextCustomer = nextCustomers[Math.min(customerIndex, nextCustomers.length - 1)] ?? nextCustomers[0];
    const nextCustomerId = nextCustomer?.id ?? defaultReportCustomerId;

    setReportCustomers(nextCustomers);
    setAdminReportCustomerId(nextCustomerId);
    setReportCustomerId((current) => (current === customerId ? nextCustomerId : current));
    addAdminLog({
      action: "Удаление",
      section: "Отчетность",
      details: `Удален заказчик отчета: ${customer.label}.`,
    });
  }, [addAdminLog, reportCustomers, setAdminReportCustomerId, setReportCustomerId, setReportCustomers]);

  const moveReportAreaOrder = useCallback((area: string, direction: -1 | 1) => {
    const sourceIndex = areaOptions.findIndex((item) => normalizeLookupValue(item) === normalizeLookupValue(area));
    const targetIndex = sourceIndex + direction;
    if (sourceIndex === -1 || targetIndex < 0 || targetIndex >= areaOptions.length) return;

    const nextOrder = [...areaOptions];
    [nextOrder[sourceIndex], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[sourceIndex]];
    setReportCustomers((current) => current.map((customer) => (
      customer.id === activeCustomer.id
        ? { ...customer, areaOrder: nextOrder }
        : customer
    )));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: `Изменен порядок отображения участков для ${activeCustomer.label}.`,
    });
  }, [activeCustomer.id, activeCustomer.label, addAdminLog, areaOptions, setReportCustomers]);

  const moveReportWorkOrder = useCallback((area: string, rowKey: string, direction: -1 | 1) => {
    const areaKey = normalizeLookupValue(area);
    const areaRows = sortReportRowsByAreaOrder(
      orderRows.filter((row) => normalizeLookupValue(row.area) === areaKey),
      [area],
      activeCustomer.workOrder,
    );
    const rowKeys = areaRows.map(reportRowDisplayKey);
    const sourceIndex = rowKeys.indexOf(rowKey);
    const targetIndex = sourceIndex + direction;
    if (sourceIndex === -1 || targetIndex < 0 || targetIndex >= rowKeys.length) return;

    const nextRowKeys = [...rowKeys];
    [nextRowKeys[sourceIndex], nextRowKeys[targetIndex]] = [nextRowKeys[targetIndex], nextRowKeys[sourceIndex]];
    setReportCustomers((current) => current.map((customer) => (
      customer.id === activeCustomer.id
        ? { ...customer, workOrder: { ...customer.workOrder, [areaKey]: nextRowKeys } }
        : customer
    )));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: `Изменен порядок видов работ внутри участка для ${activeCustomer.label}.`,
    });
  }, [activeCustomer.id, activeCustomer.label, activeCustomer.workOrder, addAdminLog, orderRows, setReportCustomers]);

  const toggleReportCustomerRow = useCallback((customerId: string, rowKey: string) => {
    setReportCustomers((current) => current.map((customer) => {
      if (customer.id !== customerId) return customer;

      const customerAutoRowKeys = reportAutoRowKeysForCustomer(customer);
      const effectiveRowKeys = reportCustomerEffectiveRowKeys(customer, customerAutoRowKeys);
      const currentlyVisible = effectiveRowKeys.has(rowKey);
      const autoCanShow = customer.autoShowRows && customerAutoRowKeys.has(rowKey);
      const nextRowKeys = currentlyVisible
        ? customer.rowKeys.filter((key) => key !== rowKey)
        : Array.from(new Set([...customer.rowKeys, rowKey]));
      const nextHiddenRowKeys = currentlyVisible && autoCanShow
        ? Array.from(new Set([...customer.hiddenRowKeys, rowKey]))
        : customer.hiddenRowKeys.filter((key) => key !== rowKey);

      return { ...customer, rowKeys: nextRowKeys, hiddenRowKeys: nextHiddenRowKeys };
    }));
    addAdminLog({
      action: "Редактирование",
      section: "Отчетность",
      details: "Изменен показ строки для заказчика.",
    });
  }, [addAdminLog, reportAutoRowKeysForCustomer, setReportCustomers]);

  return {
    updateReportCustomer,
    addReportCustomer,
    deleteReportCustomer,
    moveReportAreaOrder,
    moveReportWorkOrder,
    toggleReportCustomerRow,
  };
}
