import type { PatchSaveCommand } from "../editing/patchEditing";
import type { ModulePatchMutationPlan } from "./modulePatchMutationPlans";

export type ModulePatchPayloadValidationIssue = {
  code: "patch_field_not_allowed";
  message: string;
  field: string;
  value?: string;
};

const patchFieldGroupAliases: Record<string, string[]> = {
  basis: ["basis", "basisDocument", "reason"],
  capabilities: ["capabilities", "canView", "canEdit", "canApprove", "canDelete", "canExport", "canAdmin"],
  comment: ["comment", "note"],
  contractor_debt: ["contractorDebt", "contractor_debt"],
  correction_reason: ["correctionReason", "correction_reason"],
  costs: ["costs", "cost"],
  driver: ["driver", "driverId", "driver_id"],
  dut: ["dut", "fuelSensor", "fuel_sensor"],
  ecodriving: ["ecodriving", "ecoDriving", "safeDriving"],
  employee: ["employee", "employeeId", "employee_id"],
  header: ["header", "date", "sectionId", "section_id", "shift"],
  hours: ["hours", "hoursCount"],
  insurance: ["insurance", "policy"],
  invoice_link: ["invoiceLink", "invoice_link"],
  lines: ["lines", "line", "productionLinks", "production_links"],
  maintenance: ["maintenance", "service"],
  movement_dates: ["movementDates", "departureDate", "arrivalDate"],
  non_completion_reason: ["nonCompletionReason", "non_completion_reason"],
  period: ["period", "periodId", "period_id"],
  period_totals: ["periodTotals", "period_totals", "totals"],
  print_state: ["printState", "print_state"],
  reason: ["reason", "basis"],
  reminder: ["reminder", "remindAt"],
  repair: ["repair", "repairs"],
  report: ["report", "reportText"],
  route: ["route", "routeHash"],
  scope: ["scope", "sectionId", "section_id", "moduleId", "module_id"],
  sections: ["sections", "fromSectionId", "toSectionId"],
  shift: ["shift"],
  sim: ["sim", "simCard", "sim_card"],
  status: ["status"],
  survey_adjustment: ["surveyAdjustment", "survey_adjustment"],
  tasks: ["tasks", "task"],
  terminal: ["terminal", "terminalId", "terminal_id"],
  tires: ["tires", "tyres"],
  vehicle: ["vehicle", "vehicleId", "vehicle_id"],
  verification: ["verification", "verifiedBy", "verified_at"],
};

function normalizePatchField(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isPatchFieldInGroup(field: string, group: string) {
  const normalizedField = normalizePatchField(field);
  const aliases = [group, ...(patchFieldGroupAliases[group] ?? [])];

  return aliases.some((alias) => {
    const normalizedAlias = normalizePatchField(alias);
    return normalizedField === normalizedAlias || normalizedField.startsWith(normalizedAlias);
  });
}

export function validateModulePatchPayload(
  plan: ModulePatchMutationPlan,
  patch: PatchSaveCommand,
): ModulePatchPayloadValidationIssue[] {
  return patch.changes.flatMap((change): ModulePatchPayloadValidationIssue[] => (
    plan.allowedFieldGroups.some((group) => isPatchFieldInGroup(change.field, group))
      ? []
      : [{
          code: "patch_field_not_allowed",
          message: "Patch payload contains a field outside the mutation plan allowed groups.",
          field: change.field,
          value: plan.allowedFieldGroups.join(","),
        }]
  ));
}
