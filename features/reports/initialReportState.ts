import { defaultAreaShiftScheduleArea, normalizeAreaShiftCutoffs } from "@/lib/domain/admin/area-schedule";
import { normalizeStoredReportCustomers } from "@/lib/domain/reports/customers";
import { defaultReportCustomers } from "@/lib/domain/reports/defaults";
import { normalizeNumberRecord, normalizeStringList, normalizeStringListRecord, normalizeStringRecord } from "@/lib/utils/normalizers";
import { readClientReportDateSelection } from "@/features/reports/lib/reportDateSelection";

type InitialReportStateInput = {
  savedAreaShiftCutoffs: unknown;
  savedReportAreaOrder: unknown;
  savedReportWorkOrder: unknown;
  savedReportCustomers: unknown;
  savedReportHeaderLabels: unknown;
  savedReportColumnWidths: unknown;
  savedReportReasons: unknown;
};

export function buildInitialReportState({
  savedAreaShiftCutoffs,
  savedReportAreaOrder,
  savedReportWorkOrder,
  savedReportCustomers,
  savedReportHeaderLabels,
  savedReportColumnWidths,
  savedReportReasons,
}: InitialReportStateInput) {
  const areaShiftCutoffs = normalizeAreaShiftCutoffs(savedAreaShiftCutoffs);
  const preferredReportDate = readClientReportDateSelection(areaShiftCutoffs, defaultAreaShiftScheduleArea);
  const reportAreaOrder = normalizeStringList(savedReportAreaOrder);
  const reportWorkOrder = normalizeStringListRecord(savedReportWorkOrder);
  const reportCustomers = normalizeStoredReportCustomers(savedReportCustomers, defaultReportCustomers).map((customer) => {
    const hasCustomerWorkOrder = Object.values(customer.workOrder).some((rowKeys) => rowKeys.length > 0);

    return {
      ...customer,
      areaOrder: customer.areaOrder.length > 0 ? customer.areaOrder : [...reportAreaOrder],
      workOrder: hasCustomerWorkOrder
        ? customer.workOrder
        : Object.fromEntries(Object.entries(reportWorkOrder).map(([area, rowKeys]) => [area, [...rowKeys]])),
    };
  });

  return {
    areaShiftCutoffs,
    preferredReportDate,
    reportAreaOrder,
    reportWorkOrder,
    reportCustomers,
    reportHeaderLabels: normalizeStringRecord(savedReportHeaderLabels),
    reportColumnWidths: normalizeNumberRecord(savedReportColumnWidths, 42, 520),
    reportReasons: normalizeStringRecord(savedReportReasons),
  };
}

export type InitialReportState = ReturnType<typeof buildInitialReportState>;
