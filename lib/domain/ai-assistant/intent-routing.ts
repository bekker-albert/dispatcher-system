import type { AiAssistantTab } from "@/lib/domain/ai-assistant/types";

export type AiAssistantRequestIntent =
  | "document"
  | "message"
  | "report-reason"
  | "equipment"
  | "task";

const documentKeywords = ["служеб", "командиров"];
const messageKeywords = ["сообщ", "подряд"];
const reportReasonKeywords = ["причин", "невыполн"];
const equipmentKeywords = ["техник", "ремонт"];

export function classifyAiAssistantRequestIntent(text: string): AiAssistantRequestIntent {
  const normalizedText = normalizeAiAssistantIntentText(text);

  if (containsAnyKeyword(normalizedText, documentKeywords)) return "document";
  if (containsAnyKeyword(normalizedText, messageKeywords)) return "message";
  if (containsAnyKeyword(normalizedText, reportReasonKeywords)) return "report-reason";
  if (containsAnyKeyword(normalizedText, equipmentKeywords)) return "equipment";

  return "task";
}

export function resolveAiAssistantRequestResultTarget(text: string): AiAssistantTab {
  const intent = classifyAiAssistantRequestIntent(text);
  if (intent === "document" || intent === "message") return "drafts";
  return "inbox";
}

export function resolveAiAssistantPresetTab(text: string): AiAssistantTab | null {
  const normalizedText = normalizeAiAssistantIntentText(text);
  if (!normalizedText) return null;
  const mentionsTasks = normalizedText.includes("задач");

  if (
    normalizedText.includes("входящ")
    || normalizedText.includes("решени")
    || (mentionsTasks && hasAiAssistantNavigationCue(normalizedText))
  ) {
    return "inbox";
  }

  if (
    normalizedText.includes("чернов")
    || normalizedText.includes("документ")
  ) {
    return "drafts";
  }

  if (
    normalizedText.includes("истори")
    || normalizedText.includes("последн")
    || normalizedText.includes("аудит")
    || normalizedText.includes("действ")
  ) {
    return "history";
  }

  if (
    normalizedText.includes("настрой")
    || normalizedText.includes("интеграц")
    || normalizedText.includes("агент")
  ) {
    return "settings";
  }

  if (
    normalizedText.includes("главн")
    || normalizedText.includes("сводк")
  ) {
    return "main";
  }

  return null;
}

function normalizeAiAssistantIntentText(text: string) {
  return text.trim().toLowerCase();
}

function hasAiAssistantNavigationCue(text: string) {
  return (
    text.includes("покаж")
    || text.includes("откры")
    || text.includes("перейд")
    || text.includes("переключ")
  );
}

function containsAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}
