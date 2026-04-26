import type { Dispatch, SetStateAction } from "react";
import type { AreaShiftCutoffMap } from "@/lib/domain/admin/area-schedule";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";
import type { InitialReportState } from "@/features/reports/initialReportState";

export type InitialReportStateSetters = {
  setReportCustomers: Dispatch<SetStateAction<ReportCustomerConfig[]>>;
  setReportAreaOrder: Dispatch<SetStateAction<string[]>>;
  setReportWorkOrder: Dispatch<SetStateAction<Record<string, string[]>>>;
  setReportHeaderLabels: Dispatch<SetStateAction<Record<string, string>>>;
  setReportColumnWidths: Dispatch<SetStateAction<Record<string, number>>>;
  setReportReasons: Dispatch<SetStateAction<Record<string, string>>>;
  setAreaShiftCutoffs: Dispatch<SetStateAction<AreaShiftCutoffMap>>;
};

export function applyInitialReportState(state: InitialReportState, setters: InitialReportStateSetters) {
  setters.setReportCustomers(state.reportCustomers);
  setters.setReportAreaOrder(state.reportAreaOrder);
  setters.setReportWorkOrder(state.reportWorkOrder);
  setters.setReportHeaderLabels(state.reportHeaderLabels);
  setters.setReportColumnWidths(state.reportColumnWidths);
  setters.setReportReasons(state.reportReasons);
  setters.setAreaShiftCutoffs(state.areaShiftCutoffs);
}
