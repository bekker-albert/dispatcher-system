import type { MiningPlanFactRow, MiningPlanFactStatus } from "./planFact";
import type { MiningShift } from "./service-contracts";

export type MiningNonCompletionReasonRequirementStatus =
  | "reason_not_required"
  | "reason_required"
  | "reason_provided";

export type MiningNonCompletionReasonRequirement = {
  id: string;
  planFactRowId: string;
  sectionId: string;
  reportDate: string;
  shift: MiningShift;
  workType: string;
  planFactStatus: MiningPlanFactStatus;
  plannedVolume: number;
  actualVolume: number;
  deltaVolume: number;
  reasonId?: string;
  comment?: string;
  status: MiningNonCompletionReasonRequirementStatus;
};

export type MiningNonCompletionReasonSummary = {
  totalRows: number;
  requiredCount: number;
  providedCount: number;
  missingCount: number;
};

export type MiningNonCompletionReasonInput = {
  planFactRowId: string;
  reasonId?: string;
  comment?: string;
};

const reasonRequiredStatuses: MiningPlanFactStatus[] = ["behind_plan", "missing_fact"];

export const requiresMiningNonCompletionReason = (
  row: Pick<MiningPlanFactRow, "status" | "deltaVolume">,
  minBehindVolume = 0,
): boolean => (
  reasonRequiredStatuses.includes(row.status)
  && Math.abs(row.deltaVolume) > minBehindVolume
);

export const createMiningNonCompletionReasonRequirements = (
  planFactRows: readonly MiningPlanFactRow[],
  reasons: readonly MiningNonCompletionReasonInput[] = [],
  minBehindVolume = 0,
): MiningNonCompletionReasonRequirement[] => {
  const reasonsByPlanFactId = new Map(reasons.map((reason) => [reason.planFactRowId, reason]));

  return planFactRows.map((row) => {
    const reason = reasonsByPlanFactId.get(row.id);
    const hasReason = Boolean(reason?.reasonId || reason?.comment?.trim());
    const isRequired = requiresMiningNonCompletionReason(row, minBehindVolume);

    return {
      id: `non-completion-${row.id}`,
      planFactRowId: row.id,
      sectionId: row.sectionId,
      reportDate: row.reportDate,
      shift: row.shift,
      workType: row.workType,
      planFactStatus: row.status,
      plannedVolume: row.plannedVolume,
      actualVolume: row.actualVolume,
      deltaVolume: row.deltaVolume,
      reasonId: reason?.reasonId,
      comment: reason?.comment,
      status: isRequired
        ? hasReason ? "reason_provided" : "reason_required"
        : "reason_not_required",
    };
  });
};

export const summarizeMiningNonCompletionReasons = (
  requirements: readonly MiningNonCompletionReasonRequirement[],
): MiningNonCompletionReasonSummary => ({
  totalRows: requirements.length,
  requiredCount: requirements.filter((row) => row.status === "reason_required" || row.status === "reason_provided").length,
  providedCount: requirements.filter((row) => row.status === "reason_provided").length,
  missingCount: requirements.filter((row) => row.status === "reason_required").length,
});
