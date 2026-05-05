import type { AiAssistantKnowledgeSource } from "@/features/ai-assistant/types";

export type KnowledgeDraft = Omit<AiAssistantKnowledgeSource, "id" | "updatedAt">;

export function createKnowledgeDraft(): KnowledgeDraft {
  return {
    title: "",
    source: "manual",
    access: "internal",
    owner: "",
    tags: [],
  };
}

export function toKnowledgeDraft(source: AiAssistantKnowledgeSource): KnowledgeDraft {
  return {
    title: source.title,
    source: source.source,
    access: source.access,
    owner: source.owner,
    tags: source.tags,
  };
}

export function normalizeKnowledgeDraft(draft: KnowledgeDraft): KnowledgeDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    owner: draft.owner.trim(),
    tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
  };
}

export function splitTags(value: string) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

export function formatSource(source: AiAssistantKnowledgeSource["source"]) {
  const labels: Record<AiAssistantKnowledgeSource["source"], string> = {
    manual: "Ручной ввод",
    file: "Файл",
    mail: "Почта",
    documentolog: "Documentolog",
    calendar: "Календарь",
    system: "Система",
  };

  return labels[source];
}

export function formatAccess(access: AiAssistantKnowledgeSource["access"]) {
  const labels: Record<AiAssistantKnowledgeSource["access"], string> = {
    public: "Общий",
    internal: "Внутренний",
    restricted: "Ограниченный",
  };

  return labels[access];
}
