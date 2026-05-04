import type { AiAssistantDevelopmentIdea, AiAssistantCodexPromptDraft } from "@/features/ai-assistant/types";

export const aiAssistantDevelopmentIdeasMock: AiAssistantDevelopmentIdea[] = [
    {
      id: "idea-whatsapp-trip",
      title: "Создание командировки из WhatsApp-сообщения",
      description: "Ассистент распознает сообщение о поездке, создает задачу, готовит служебную записку и выводит действие на согласование.",
      benefit: "Сокращает ручную подготовку командировок и уменьшает риск забыть поручение из чата.",
      risks: ["Неверное распознавание даты", "Запуск официального документа без подтверждения запрещен"],
      affectedModules: ["AI-ассистент", "Планировщик", "Documentolog", "WhatsApp"],
      businessLogic: [
        "WhatsApp используется только как источник события и канал уведомления.",
        "Официальный документ создается только после подтверждения на сайте.",
      ],
      accessRoles: ["supervisor", "admin"],
      missingQuestions: ["Кто согласует командировки по участкам?", "Какие поля обязательны для Documentolog?"],
      acceptanceCriteria: [
        "Сообщение попадает в кандидаты WhatsApp.",
        "Пользователь видит задачу в блоке Требуют моего решения.",
        "Documentolog не запускается без подтверждения.",
      ],
      status: "reviewing",
      codexPromptDraftId: "codex-prompt-whatsapp-trip",
      updatedAt: "2026-04-24T10:20:00.000Z",
    },
  ];

export const aiAssistantCodexPromptDraftsMock: AiAssistantCodexPromptDraft[] = [
    {
      id: "codex-prompt-whatsapp-trip",
      title: "Промт Codex: командировка из WhatsApp",
      body: "Добавить backend-safe поток: WhatsApp candidate -> task -> approval -> document draft -> Documentolog dry-run. Не подключать реальные ключи, не выполнять внешние действия без approval.",
      linkedIdeaId: "idea-whatsapp-trip",
      status: "draft",
      updatedAt: "2026-04-24T10:25:00.000Z",
    },
  ];
