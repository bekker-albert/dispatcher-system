import type { ModuleDatabaseIndexContract } from "./indexContracts";

export const moduleDatabaseIndexContracts: ModuleDatabaseIndexContract[] = [
  {
    moduleId: "mining-shift-reports",
    workspaceId: "mining-dispatch",
    primaryEntity: "mining_shift_reports",
    indexes: [
      {
        name: "mining_shift_reports_date_section_shift_status_idx",
        fields: ["report_date", "section_id", "shift", "status"],
        coversFilters: ["date", "section_id", "shift", "status"],
        reason: "Shift report control opens by day/night, section and workflow status.",
      },
    ],
    notes: "Keeps shift report lists bounded for dispatch acceptance screens.",
  },
  {
    moduleId: "mining-operational-accounting",
    workspaceId: "mining-dispatch",
    primaryEntity: "mining_operational_accounting_rows",
    indexes: [
      {
        name: "mining_operational_rows_date_section_shift_idx",
        fields: ["report_date", "section_id", "shift"],
        coversFilters: ["date", "section_id", "shift"],
        reason: "Operational accounting reads accepted report rows for one bounded production slice.",
      },
    ],
    notes: "Aggregates should be prepared from accepted shift reports, not recalculated in the browser.",
  },
  {
    moduleId: "taxation-waybills",
    workspaceId: "taxation",
    primaryEntity: "taxation_waybills",
    indexes: [
      {
        name: "taxation_waybills_date_section_shift_status_idx",
        fields: ["work_date", "section_id", "shift", "status"],
        coversFilters: ["date", "section_id", "shift", "status"],
        reason: "Batch waybill issue and repeat print are opened by date, section, shift and status.",
      },
      {
        name: "taxation_waybills_driver_date_idx",
        fields: ["driver_id", "work_date"],
        coversFilters: ["driver_id", "date"],
        reason: "Driver lookup must not scan the whole waybill register.",
      },
      {
        name: "taxation_waybills_vehicle_date_idx",
        fields: ["vehicle_id", "work_date"],
        coversFilters: ["vehicle_id", "date"],
        reason: "Vehicle lookup is required for duplicate prevention and exception issue.",
      },
    ],
    notes: "Waybill tables must stay paged and duplicate checks must be indexed.",
  },
  {
    moduleId: "taxation-fuel-periods",
    workspaceId: "taxation",
    primaryEntity: "fuel_accounting_periods",
    indexes: [
      {
        name: "fuel_periods_section_period_status_idx",
        fields: ["section_id", "period_id", "status"],
        coversFilters: ["section_id", "period_id", "status"],
        reason: "1C fuel periods are opened by section, half-month period and workflow status.",
      },
      {
        name: "contractor_fuel_debts_contractor_period_idx",
        fields: ["contractor_id", "period_id"],
        coversFilters: ["contractor_id", "period_id"],
        reason: "Contractor debts and reconciliation acts are queried by contractor and accounting period.",
      },
    ],
    notes: "Fuel reconciliation must not require scanning accumulated fuel rows for every period screen.",
  },
  {
    moduleId: "smts-vehicle-cards",
    workspaceId: "smts-gps",
    primaryEntity: "smts_vehicle_cards",
    indexes: [
      {
        name: "smts_vehicle_cards_section_vehicle_terminal_status_idx",
        fields: ["section_id", "vehicle_id", "terminal_id", "status"],
        coversFilters: ["section_id", "vehicle_id", "terminal_id", "status"],
        reason: "SMTS cards are opened by equipment, terminal and connection status.",
      },
    ],
    notes: "Terminal/SIM history should be joined from bounded card scope.",
  },
  {
    moduleId: "smts-fuel-drains",
    workspaceId: "smts-gps",
    primaryEntity: "smts_fuel_drain_events",
    indexes: [
      {
        name: "smts_fuel_drains_date_section_vehicle_status_idx",
        fields: ["event_date", "section_id", "vehicle_id", "status"],
        coversFilters: ["date", "section_id", "vehicle_id", "status"],
        reason: "GPS/Wialon drain checks must stay inside a short period and selected vehicle scope.",
      },
    ],
    notes: "Large GPS/Wialon event pulls are not allowed for default screens.",
  },
  {
    moduleId: "fleet-movements",
    workspaceId: "fleet",
    primaryEntity: "vehicle_movements",
    indexes: [
      {
        name: "vehicle_movements_section_vehicle_status_idx",
        fields: ["section_id", "vehicle_id", "status"],
        coversFilters: ["section_id", "vehicle_id", "status"],
        reason: "Movement documents and history are opened by current section, vehicle and document status.",
      },
    ],
    notes: "Vehicle section history must be queried, not overwritten on the vehicle card.",
  },
  {
    moduleId: "service-vehicle",
    workspaceId: "fleet",
    primaryEntity: "service_vehicle_records",
    indexes: [
      {
        name: "service_vehicle_records_vehicle_status_idx",
        fields: ["vehicle_id", "status"],
        coversFilters: ["vehicle_id", "status"],
        reason: "Service vehicle maintenance, insurance and repair records are opened by vehicle and status.",
      },
    ],
    notes: "Reminder screens should read bounded service vehicle records.",
  },
  {
    moduleId: "common-overtime",
    workspaceId: "common-processes",
    primaryEntity: "common_overtime_requests",
    indexes: [
      {
        name: "common_overtime_date_section_status_idx",
        fields: ["work_date", "section_id", "status"],
        coversFilters: ["date", "section_id", "status"],
        reason: "Overtime requests are controlled by period, section and approval state.",
      },
    ],
    notes: "Common workflow lists use server pagination with bounded periods.",
  },
  {
    moduleId: "common-business-trips",
    workspaceId: "common-processes",
    primaryEntity: "common_business_trips",
    indexes: [
      {
        name: "common_business_trips_date_section_status_idx",
        fields: ["start_date", "section_id", "status"],
        coversFilters: ["date", "section_id", "status"],
        reason: "Business trip lists are opened by period, destination section and approval state.",
      },
    ],
    notes: "Installer trip task lists should be loaded after the bounded trip query.",
  },
  {
    moduleId: "prepared-reports",
    workspaceId: "reports",
    primaryEntity: "prepared_report_aggregates",
    indexes: [
      {
        name: "prepared_reports_date_section_status_idx",
        fields: ["report_date", "section_id", "status"],
        coversFilters: ["date", "section_id", "status"],
        reason: "Reports should read prepared aggregates for a bounded period and section.",
      },
    ],
    notes: "Exports are created on demand from prepared aggregate slices.",
  },
  {
    moduleId: "access-matrix",
    workspaceId: "admin",
    primaryEntity: "access_matrix_grants",
    indexes: [
      {
        name: "access_matrix_grants_section_status_idx",
        fields: ["section_id", "status"],
        coversFilters: ["section_id", "status"],
        reason: "Admin matrix screens page grants by section and active status.",
      },
    ],
    notes: "Access grants also keep user/role fields for future exact-match lookups.",
  },
];
