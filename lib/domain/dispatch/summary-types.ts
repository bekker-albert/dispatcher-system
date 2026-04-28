export type DispatchShift = "daily" | "night" | "day";

export type DispatchSummaryRow = {
  id: string;
  date: string;
  shift: DispatchShift;
  vehicleId: number | null;
  vehicleName: string;
  area: string;
  location: string;
  workType: string;
  excavator: string;
  planVolume: number;
  factVolume: number;
  workHours: number;
  rentHours: number;
  repairHours: number;
  downtimeHours: number;
  trips: number;
  reason: string;
  comment: string;
};

export type DispatchSummaryTextField =
  | "vehicleName"
  | "area"
  | "location"
  | "workType"
  | "excavator"
  | "reason"
  | "comment";

export type DispatchSummaryNumberField =
  | "planVolume"
  | "factVolume"
  | "workHours"
  | "rentHours"
  | "repairHours"
  | "downtimeHours"
  | "trips";

export type DispatchSummaryRowView = {
  totalHours: number;
  productivity: number;
  delta: number;
  hoursOk: boolean;
  isBehindPlan: boolean;
};
