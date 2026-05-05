import type {
  AiAssistantApprovalStatus,
  AiAssistantConnectorStatus,
  AiAssistantTaskStatus,
} from "./types";

export const aiAssistantTaskStatusLabels: Record<AiAssistantTaskStatus, string> = {
  draft: "Черновик",
  queued: "В очереди",
  running: "В работе",
  "needs-approval": "На согласовании",
  approved: "Согласовано",
  sent: "Отправлено",
  failed: "Ошибка",
  cancelled: "Отменено",
};

export const aiAssistantTaskStatusColors: Record<AiAssistantTaskStatus, {
  background: string;
  color: string;
  border: string;
}> = {
  draft: { background: "#f8fafc", color: "#334155", border: "#cbd5e1" },
  queued: { background: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  running: { background: "#ecfdf5", color: "#047857", border: "#bbf7d0" },
  "needs-approval": { background: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  approved: { background: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  sent: { background: "#ecfeff", color: "#0e7490", border: "#a5f3fc" },
  failed: { background: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
  cancelled: { background: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
};

export const aiAssistantConnectorStatusLabels: Record<AiAssistantConnectorStatus, string> = {
  planned: "Каркас готов",
  disabled: "Отключено",
  connected: "Подключено",
  error: "Требует проверки",
};

export const aiAssistantApprovalLabels: Record<AiAssistantApprovalStatus, string> = {
  "not-required": "Не требуется",
  required: "Нужно согласовать",
  approved: "Согласовано",
  returned: "Возвращено на доработку",
  rejected: "Отклонено",
};

export function getAiAssistantTaskStatusForApprovalDecision(
  decision: Extract<AiAssistantApprovalStatus, "approved" | "returned" | "rejected">,
): AiAssistantTaskStatus {
  if (decision === "approved") return "approved";
  if (decision === "returned") return "draft";
  return "cancelled";
}
