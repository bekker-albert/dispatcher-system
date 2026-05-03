# AI Assistant Architecture

## Purpose

`AI-ассистент` is a long-term working module for dispatcher analysis, global chat, action cards, approvals, notifications, knowledge search, and future integrations. It is not an admin-only sketch and not a single-screen prototype.

## Files And Boundaries

- `features/ai-assistant/` owns the user-facing tab, local screen state, static seed dataset, UI components, and connector contracts.
- `features/app/AiAssistantPrimaryContent.tsx` is the thin app adapter used by the lazy primary-content registry.
- `features/app/AiAssistantFloatingDockHost.tsx` mounts the global AI floating dock once in the app shell.
- `lib/domain/ai-assistant/` owns reusable business types, statuses, permissions, and pure view-model logic.
- `docs/ai-assistant-architecture.md` records the integration contract before real providers are connected.
- Future server routes must live under `app/api/*` and delegate to `lib/server/*`; client components must not call external AI, WhatsApp, mail, calendar, Documentolog, or push APIs directly.

## Core Entities

- `AiAssistantChatMessage`: site chat message between the user and assistant.
- `AiAssistantApprovalAction`: site approval queue item for critical actions.
- `AiAssistantTask`: request, draft, analysis, document lookup, or notification preparation.
- `AiAssistantNotification`: outbound or internal notification draft.
- `AiAssistantIntegration`: future connector status and required scopes.
- `AiAssistantKnowledgeSource`: regulated knowledge source with access level.
- `AiAssistantEvidence`: source-backed evidence attached to a task.
- `AiAssistantAuditEvent`: append-only action journal event.
- `AiAssistantPermission`: explicit permission scope used by roles and connectors.

## UI Structure

- `AiAssistantSection` composes the module.
- `AiAssistantTabs` controls internal subtabs: tasks, integrations, knowledge, audit.
- `AiAssistantFloatingDock` is the only fixed-position container for global AI widgets.
- `AiAssistantFloatingDock` owns the single floating panel. The panel title switches between `AI-ассистент` and `Уведомления`; child widgets must not create their own floating panels.
- `AiAssistantFloatingChat` is the global user-assistant communication content.
- `AiAssistantFloatingNotifications` is compact notification content inside the shared dock; clicking a notification opens `AI-ассистент -> Задачи`.
- `AiAssistantTasksPanel` combines current tasks and linked notifications in one row with separate `Текст` and `Решение` columns.
- `AiAssistantPlannerPanel` stores future work by date/time with target, channel, prepared text, action type, and approval requirement.
- `AiAssistantIntegrationStatus` shows future connector readiness.
- `AiAssistantKnowledgePanel` shows knowledge sources.
- `AiAssistantAuditLog` shows the action journal.

## Integration Contracts

All external providers must be hidden behind typed connector contracts:

```text
UI -> backend API -> permission check -> assistant service -> connector -> audit log
```

The browser layer can show connector state and request server actions, but it must not contain provider tokens, provider SDK clients, or direct network calls to external providers.

## Action Approval Flow

The assistant action model is:

1. Assistant detects an event.
2. Assistant creates a task or action card.
3. Critical action goes to `AI-ассистент -> Задачи`.
4. User receives a site notification and, if enabled, a WhatsApp notification with a link.
5. User opens the site, reviews evidence and draft text, edits if needed, then approves or rejects.
6. Only after site approval can the backend prepare a document, send a message, create mail, create a calendar item, or start Documentolog.

The floating site chat is the primary assistant communication interface. WhatsApp is not the primary assistant interface. It is a notification channel and quick link channel. Full approval, document review, text editing, Documentolog launch, and task management happen on the site.

Floating chat and floating notifications must be mounted through one dock. Child widgets must not create separate fixed or absolute floating panels, otherwise panels can overlap.

Planner entries can prepare an action before its execution time. A planner item keeps `plannedDate`, optional `plannedTime`, `target`, `channel`, `actionType`, `preparedText`, and `requireApproval`. When real backend scheduling is added, due planner items should become current tasks and approval actions without changing the frontend data shape.

Global AI widgets navigate through `appNavigationEventName`; this keeps the floating dock decoupled from the main app state while still allowing fast jumps into the task workspace.

Documentolog is not the assistant decision screen. It is used only for official document routing after the user confirms the document on the site.

## Future Implementation Order

1. Keep the current UI and domain skeleton stable with seed data.
2. Add server-side database tables and provider-neutral API functions.
3. Add AI API server connector.
4. Add WhatsApp connector with approval-first sending.
5. Add mail connector.
6. Add calendar connector.
7. Add Documentolog connector.
8. Add real push and in-app notifications.
9. Add controlled knowledge ingestion and source permissions.
10. Add automation, analytics, and assistant learning workflows.

## Safety Rules

- AI output is a draft until a human confirms it.
- Critical actions must never execute automatically from chat. They must become approval actions first.
- External writes require approval unless a future rule explicitly classifies the action as low-risk.
- Audit logs store summaries, source references, statuses, and correlation identifiers; raw secrets and full production snapshots must not be logged.
- Product assistant keys must be separate from local refactor-agent keys.
