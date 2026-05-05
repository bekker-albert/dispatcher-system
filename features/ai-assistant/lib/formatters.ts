import type {
  AiAssistantApprovalAction,
  AiAssistantNotificationChannel,
} from "@/features/ai-assistant/types";

export function formatAiAssistantChannel(channel: AiAssistantNotificationChannel) {
  const labels: Record<AiAssistantNotificationChannel, string> = {
    app: "Система",
    whatsapp: "WhatsApp",
    documentolog: "Documentolog",
    mail: "Почта",
    calendar: "Календарь",
    push: "Push",
  };

  return labels[channel];
}

export function formatAiAssistantConnector(connector: AiAssistantApprovalAction["targetConnector"]) {
  const labels: Record<AiAssistantApprovalAction["targetConnector"], string> = {
    "ai-api": "Сайт",
    whatsapp: "WhatsApp",
    documentolog: "Documentolog",
    mail: "Почта",
    calendar: "Календарь",
    push: "Push",
    "knowledge-base": "База знаний",
  };

  return labels[connector];
}

export function formatAiAssistantApprovalStatus(status: AiAssistantApprovalAction["status"]) {
  const labels: Record<AiAssistantApprovalAction["status"], string> = {
    required: "Ожидает решения",
    approved: "Одобрено",
    rejected: "Отклонено",
  };

  return labels[status];
}
