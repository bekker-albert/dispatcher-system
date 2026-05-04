import type { AiAssistantPlannerItem } from "@/features/ai-assistant/types";

export type PlannerDraft = Pick<
  AiAssistantPlannerItem,
  | "title"
  | "description"
  | "plannedDate"
  | "plannedTime"
  | "status"
  | "priority"
  | "target"
  | "channel"
  | "actionType"
  | "preparedText"
  | "requireApproval"
  | "recurrence"
>;

export function createPlannerDraft(currentWorkDate: string): PlannerDraft {
  return {
    title: "",
    description: "",
    plannedDate: currentWorkDate,
    plannedTime: "",
    status: "planned",
    priority: "normal",
    target: "",
    channel: "app",
    actionType: "ask-assistant",
    preparedText: "",
    requireApproval: true,
    recurrence: { type: "none" },
  };
}

export function normalizePlannerDraft(draft: PlannerDraft): PlannerDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description.trim(),
    target: draft.target.trim(),
    plannedTime: draft.plannedTime?.trim() || undefined,
    recurrence: normalizeRecurrence(draft.recurrence ?? { type: "none" }),
  };
}

function normalizeRecurrence(recurrence: NonNullable<AiAssistantPlannerItem["recurrence"]>) {
  if (recurrence.type === "none") return { type: "none" as const };
  if (recurrence.type === "every-n-days" || recurrence.type === "custom") {
    return {
      ...recurrence,
      interval: Math.max(1, recurrence.interval ?? 1),
    };
  }

  return recurrence;
}
