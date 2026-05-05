import type {
  AiAssistantCodexPromptDraft,
  AiAssistantDevelopmentIdea,
  AiAssistantDocument,
  AiAssistantMailDraft,
} from "@/features/ai-assistant/types";

export function createAiAssistantCurrentDateTime(currentWorkDate: string) {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${currentWorkDate}T${hours}:${minutes}`;
}

export function upsertById<TItem extends { id: string }>(items: TItem[], nextItem: TItem) {
  const exists = items.some((item) => item.id === nextItem.id);
  if (!exists) return [...items, nextItem];

  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

export function getAiAssistantDocumentStatusForApprovalDecision(
  status: "approved" | "returned" | "rejected",
): AiAssistantDocument["status"] {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";

  return "review";
}

export function getAiAssistantMailDraftStatusForApprovalDecision(
  status: "approved" | "returned" | "rejected",
): AiAssistantMailDraft["status"] {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";

  return "draft";
}

export function createAiAssistantCodexPromptDraft(
  idea: AiAssistantDevelopmentIdea,
  updatedAt: string,
): AiAssistantCodexPromptDraft {
  return {
    id: idea.codexPromptDraftId || `codex-prompt-${Date.now()}`,
    title: `Промт Codex: ${idea.title}`,
    body: [
      `Задача: ${idea.title}`,
      "",
      idea.description,
      "",
      "Бизнес-логика:",
      ...idea.businessLogic.map((item) => `- ${item}`),
      "",
      "Критерии приемки:",
      ...idea.acceptanceCriteria.map((item) => `- ${item}`),
      "",
      "Ограничения: не подключать реальные внешние API, не хранить ключи в frontend, критические действия только через approval.",
    ].join("\n"),
    linkedIdeaId: idea.id,
    status: "ready",
    updatedAt,
  };
}
