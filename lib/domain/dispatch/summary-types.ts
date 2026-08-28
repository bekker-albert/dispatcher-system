export type DispatchShift = "daily" | "night" | "day";

export type DispatchDailyReportTab = "volumes" | "summary";

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
  material?: string;
  planVolume: number;
  factVolume: number;
  workHours: number;
  rentHours: number;
  repairHours: number;
  downtimeHours: number;
  trips: number;
  downtimeReasonGroup: string;
  downtimeReason: string;
  repairReasonGroup: string;
  repairReason: string;
  repairReasonDetail: string;
  reason: string;
  comment: string;
};

export type DispatchSummaryTextField =
  | "vehicleName"
  | "area"
  | "location"
  | "workType"
  | "excavator"
  | "material"
  | "downtimeReasonGroup"
  | "downtimeReason"
  | "repairReasonGroup"
  | "repairReason"
  | "repairReasonDetail"
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
