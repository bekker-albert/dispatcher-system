import type {
  DispatchSummaryNumberField,
  DispatchSummaryRow,
  DispatchSummaryTextField,
} from "@/lib/domain/dispatch/summary";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

export type DispatchTotals = {
  plan: number;
  fact: number;
  workHours: number;
  repairHours: number;
  downtimeHours: number;
  trips: number;
  delta: number;
  percent: number;
  productivity: number;
};

export type DispatchVehicleSelectOption = {
  value: string;
  label: string;
};

export type DispatchSectionProps = {
  activeDispatchSubtabLabel: string;
  dispatchTab: string;
  activeDispatchSubtabContent: string;
  reportDate: string;
  isDailyDispatchShift: boolean;
  currentDispatchShift: "daily" | "night" | "day";
  dispatchSummaryTotals: DispatchTotals;
  search: string;
  onSearchChange: (value: string) => void;
  areaFilter: string;
  onAreaFilterChange: (value: string) => void;
  dispatchAreaOptions: string[];
  dispatchVehicleToAddId: string;
  onDispatchVehicleToAddIdChange: (value: string) => void;
  dispatchVehicleOptions: VehicleRow[];
  dispatchVehicleSelectOptions: DispatchVehicleSelectOption[];
  onAddSelectedDispatchVehicle: () => void;
  onAddFilteredVehiclesToDispatchSummary: () => void;
  dispatchAiSuggestion: string;
  filteredDispatchSummaryRows: DispatchSummaryRow[];
  onUpdateDispatchSummaryVehicle: (rowId: string, vehicleId: string) => void;
  onUpdateDispatchSummaryText: (rowId: string, field: DispatchSummaryTextField, value: string) => void;
  onUpdateDispatchSummaryNumber: (rowId: string, field: DispatchSummaryNumberField, value: string) => void;
  onDeleteDispatchSummaryRow: (rowId: string) => void;
  dispatchLocationOptions: string[];
  dispatchWorkTypeOptions: string[];
  dispatchExcavatorOptions: string[];
};
