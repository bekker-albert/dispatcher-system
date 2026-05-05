import type { AiAssistantIntegration, AiAssistantPermission } from "@/features/ai-assistant/types";

export type IntegrationDraft = Omit<AiAssistantIntegration, "key">;

export function createIntegrationDraft(): IntegrationDraft {
  return {
    title: "",
    status: "planned",
    mode: "read-write",
    description: "",
    requiredScopes: [],
    availableCapabilities: [],
    stubNotes: "",
    nextStep: "",
  };
}

export function toIntegrationDraft(integration: AiAssistantIntegration): IntegrationDraft {
  return {
    title: integration.title,
    status: integration.status,
    mode: integration.mode,
    description: integration.description,
    requiredScopes: integration.requiredScopes,
    availableCapabilities: integration.availableCapabilities ?? [],
    stubNotes: integration.stubNotes ?? "",
    nextStep: integration.nextStep ?? "",
    usedByAgentIds: integration.usedByAgentIds,
    lastSyncAt: integration.lastSyncAt,
  };
}

export function normalizeIntegrationDraft(draft: IntegrationDraft): IntegrationDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description.trim(),
    availableCapabilities: (draft.availableCapabilities ?? []).map((item) => item.trim()).filter(Boolean),
    stubNotes: draft.stubNotes?.trim() ?? "",
    nextStep: draft.nextStep?.trim() ?? "",
    requiredScopes: draft.requiredScopes.map((scope) => scope.trim()).filter(Boolean) as AiAssistantPermission[],
  };
}

export function splitScopes(value: string) {
  return value.split(",").map((scope) => scope.trim()).filter(Boolean) as AiAssistantPermission[];
}

export function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function formatMode(mode: AiAssistantIntegration["mode"]) {
  const labels: Record<AiAssistantIntegration["mode"], string> = {
    read: "Чтение",
    write: "Запись",
    "read-write": "Чтение и запись",
  };

  return labels[mode];
}
