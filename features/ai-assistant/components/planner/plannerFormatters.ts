import type { AiAssistantPlannerItem } from "@/features/ai-assistant/types";

export function formatPlannerDateLabel(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

export function formatPlannerPriority(priority: AiAssistantPlannerItem["priority"]) {
  const labels: Record<AiAssistantPlannerItem["priority"], string> = {
    low: "Низкий",
    normal: "Обычный",
    high: "Высокий",
  };

  return labels[priority];
}

export function formatPlannerStatus(status: AiAssistantPlannerItem["status"]) {
  const labels: Record<AiAssistantPlannerItem["status"], string> = {
    planned: "Запланировано",
    "needs-decision": "Ожидает решения",
    "in-progress": "В работе",
    done: "Выполнено",
    cancelled: "Отменено",
  };

  return labels[status];
}

export function formatPlannerActionType(actionType: AiAssistantPlannerItem["actionType"]) {
  const labels: Record<AiAssistantPlannerItem["actionType"], string> = {
    "ask-assistant": "Поставить задачу",
    draft: "Черновик",
    "prepare-document": "Документ",
    "send-whatsapp": "WhatsApp",
    "send-mail": "Письмо",
    "create-calendar-event": "Календарь",
    "start-documentolog": "Documentolog",
    "create-push-notification": "Push",
    "update-report-reason": "Поставить задачу",
    "update-knowledge-rule": "Правило знаний",
    "create-business-trip": "Командировка",
    "delete-data": "Удаление",
  };

  return labels[actionType];
}

export function formatPlannerRecurrence(recurrence: NonNullable<AiAssistantPlannerItem["recurrence"]>) {
  const labels: Record<NonNullable<AiAssistantPlannerItem["recurrence"]>["type"], string> = {
    none: "Без повтора",
    daily: "Ежедневно",
    weekly: "Еженедельно",
    monthly: "Ежемесячно",
    "every-n-days": `Каждые ${recurrence.interval ?? 1} дн.`,
    custom: `Повтор: ${recurrence.interval ?? 1}`,
  };

  return labels[recurrence.type];
}
