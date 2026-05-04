import type { AiAssistantKnowledgeRule, AiAssistantKnowledgeBaseItem, AiAssistantKnowledgeSource } from "@/features/ai-assistant/types";

export const aiAssistantKnowledgeRulesMock: AiAssistantKnowledgeRule[] = [
    {
      id: "rule-rented-equipment-no-operators",
      category: "Техника",
      rule: "Если техника арендована без операторов, ассистент не предлагает закрепление водителей без ручного подтверждения.",
      exceptions: ["Разовое ходатайство", "Временное перемещение по приказу"],
      example: "Арендованный самосвал без экипажа попадает в список проверки, а не в автоматическую выдачу путевого листа.",
      status: "active",
      createdBy: "Администратор",
      updatedAt: "2026-04-24T08:30:00.000Z",
    },
  ];

export const aiAssistantKnowledgeBaseItemsMock: AiAssistantKnowledgeBaseItem[] = [
    {
      id: "kb-item-trip-rule",
      title: "Порядок подготовки командировки",
      content: "Командировка создается из события только после подтверждения пользователя на сайте.",
      source: "manual",
      access: "internal",
      tags: ["командировка", "согласование", "Documentolog"],
      updatedAt: "2026-04-24T08:45:00.000Z",
    },
  ];

export const aiAssistantKnowledgeSourcesMock: AiAssistantKnowledgeSource[] = [
    {
      id: "kb-001",
      title: "Правила заполнения причин невыполнения плана",
      source: "manual",
      access: "internal",
      owner: "Диспетчерская служба",
      updatedAt: "2026-04-23T10:00:00.000Z",
      tags: ["отчетность", "причины", "план"],
    },
    {
      id: "kb-002",
      title: "Регламент согласования сообщений подрядчикам",
      source: "file",
      access: "restricted",
      owner: "Администрация",
      updatedAt: "2026-04-20T09:30:00.000Z",
      tags: ["подрядчики", "whatsapp", "согласование"],
    },
    {
      id: "kb-003",
      title: "Порядок учета маркзамера и оперучета",
      source: "system",
      access: "internal",
      owner: "ПТО",
      updatedAt: "2026-04-18T08:15:00.000Z",
      tags: ["ПТО", "замер", "оперучет"],
    },
  ];
