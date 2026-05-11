# Editing And Conflicts

`lib/domain/data-access/modulePatchMutationPlans.ts` is the rollout contract for future patch/workflow handlers. Every edit, approve, delete, or admin action that writes versioned data must declare the target table, `id`, `version`, `updated_at`, `updated_by`, optional `status`, and `change_history_entries` before a real database handler is implemented.

Patch payloads are checked against `allowedFieldGroups` before a future `/api/database` handler runs. A module may edit only declared groups such as `shift`, `driver`, `vehicle`, `status`, `basis`, `comment`, or other groups named in its mutation plan; unknown fields are rejected before persistence.

`lib/domain/data-access/patchMutationEnvelope.ts` wraps future patch handlers in a server-only envelope: one entity id, the opened `version`, changed fields only, `patchOnly = true`, `writesChangeHistory = true`, and a hard block for whole-table fields such as `rows`, `allRows`, `table`, `dataset`, or `records`.

Workflow approve/transition payloads also pass `lib/domain/data-access/moduleWorkflowTransitions.ts`. A status transition must send the previous and next `status`, match the module workflow, include a reason when the transition requires it, and require `can_approve` when the workflow rule marks the transition as approval-only.

`lib/domain/data-access/workflowTransitionEnvelope.ts` combines workflow validation with the server patch envelope. Future status handlers get one `server-only` transition contract with entity `id`, opened `version`, current/next status, matched access grants, audit reason, and change-history writing.

`lib/domain/audit/changeHistoryEnvelope.ts` makes the history writer explicit: every server write must produce per-field history entries with entity id, written version, timestamp, author, capability, reason for approval/correction/import/return/undo, and no whole-table history payloads.

`lib/domain/data-access/writeTransactionEnvelope.ts` ties versioned writes and audit history together. Future handlers should execute one entity patch and its per-field history entries as a single server-only atomic transaction with `expectedVersion`, next version, actor id, and `maxEntityRowWrites = 1`. Creates use the same envelope family: duplicate check, entity insert, and initial per-field history must be one atomic transaction with `initialVersion = 1`.

`lib/server/database/mutation-transaction-plan.ts` maps those transaction envelopes to ordered SQL steps without executing them. Create transactions must run duplicate checks, then one entity insert, then per-field history. Patch transactions must run one version-scoped update, then per-field history. Every plan requires `commitCondition = all_steps_ok`, rollback on any step failure, and no post-commit side effects before commit.

`lib/server/database/module-write-execution.ts` exposes the same transaction-plan builder through `createWriteTransactionSqlPlan()` on guarded create and patch contexts. A future live handler should not assemble the transaction order itself; it should create the individual SQL plans, pass the matching domain transaction envelope, and let the guarded context produce the ordered checklist.

`lib/domain/data-access/writeSideEffectsEnvelope.ts` describes post-commit side effects for those writes. Change history must already be part of the transaction; report aggregate invalidation, when required by the source module, is queued after commit and cannot carry inline report rows or trigger a full report rebuild.

`lib/server/database/mutation-side-effects-plan.ts` maps that side-effect envelope to a post-commit checklist. It accepts only a committed atomic SQL transaction plan, queues prepared aggregate refresh work after `commitCondition = all_steps_ok`, and keeps report rows/file output out of the write request path. The guarded write execution context exposes it as `createPostCommitSideEffectsPlan()` so future handlers use the same boundary as transaction SQL.

`lib/server/database/mutation-response-plan.ts` defines compact future API write responses. Create/patch success returns only entity id/version/status, history and post-commit queue metadata; patch conflicts and duplicate creates return `409` with a single-row reload/duplicate hint. No response plan may return a full table. The guarded write context exposes these helpers as `createWriteSuccessResponsePlan()`, `createConflictResponsePlan()`, and `createDuplicateResponsePlan()`.

`lib/domain/data-access/moduleWritePipelinePlans.ts` derives the handler pipeline from create/patch mutation plans. Future handlers must pass access preflight, payload envelope validation, atomic transaction, change history, and post-commit side effects; report-producing writes are marked as aggregate-refresh sources.

`lib/server/database/module-write-execution.ts` also checks section-scoped write requests before the future SQL handler runs. A create, patch, or workflow transition for a section-scoped module must carry `sectionId`/`section_id` through request scope or document data; otherwise the guarded live handler rejects the write before it can update a row by `id` alone.

Patch mutation plans carry `scopeColumns.section_id` for section-scoped modules. When real SQL handlers are enabled, the update path must use that column alongside `id` and `version`, so an edit cannot update a row outside the user's allowed section even if the entity id is known.

Create mutation plans use the same `scopeColumns.section_id` boundary for section-scoped documents. The future handler must apply it to duplicate checks and inserted document scope instead of trusting a free-form payload or creating a document outside the access matrix section.

`lib/server/database/mutation-sql-builder.ts` prepares the server-side SQL guard shape for future live write handlers. Patch updates must build `WHERE id = ? AND version = ?` plus every declared scope column such as `section_id`; create duplicate checks are bounded `SELECT id ... LIMIT 1` queries generated from declared duplicate keys.

Patch updates also use `createDatabasePatchMutationSetSqlPlan()` for the `SET` side. Future handlers may pass only backend-mapped changed columns; the helper adds the next `version`, `updated_at`, and `updated_by`, and blocks reserved columns such as `id`, `version`, audit columns, and section scope columns from being patched as user data.

Change history inserts use `createDatabaseChangeHistoryInsertSqlPlan()`. The helper writes one audit row per changed field, keeps old/new values as JSON payloads, checks that `entryCount` matches the actual entries, caps a single patch history batch at 100 rows, and uses only the declared audit table such as `change_history_entries`.

Create entity inserts use `createDatabaseCreateEntityInsertSqlPlan()`. Future handlers pass a generated id plus backend-mapped document columns; the helper adds `version = 1`, initial `status`, `created_at/created_by`, `updated_at/updated_by`, checks declared section scope columns, and rejects payload attempts to override reserved system columns.

Create insert results must pass `evaluateDatabaseCreateEntityInsertResult()`: one affected row allows history writing and returning the created document id, zero rows blocks history and response success, and more than one affected row is a hard error.

Change-history insert results must pass `evaluateDatabaseChangeHistoryInsertResult()`: the affected row count must equal the per-field history `expectedRowCount`; otherwise the enclosing write transaction cannot commit.

Create duplicate-check results must pass `evaluateDatabaseCreateDuplicateCheckResults()`: all checks returning zero rows allow insert, one returned row blocks create as an existing operational document, and invalid or multi-row results are hard errors.

`lib/server/database/module-write-execution.ts` exposes those SQL plans through `createEntityInsertSqlPlan()`, `createDuplicateCheckSqlPlans()`, `createPatchWhereSqlPlan()`, `createPatchSetSqlPlan()`, and `createChangeHistoryInsertSqlPlan()`. It also exposes `evaluateEntityInsertResult()`, `evaluateDuplicateCheckResults()`, `evaluateChangeHistoryInsertResult()`, and `evaluatePatchResult()`, so future live handlers get both the guarded SQL shape and the required interpretation of database results from one execution context.

After the SQL patch executes, the future handler must evaluate `affectedRows`
through the execution context, backed by `evaluateDatabasePatchMutationResult()`: `1` allows change history,
`0` means version conflict or section-scope mismatch and should reload the
current row for the conflict response, and more than `1` is a hard error.

Planned `/api/database` write actions return HTTP 501 with compact `writePipeline` and `runtimeContract` payloads so backend work can see whether the future handler requires `version`, duplicate checks, change history, transaction boundaries, queued aggregate refresh, and compact write responses before it is implemented.

Before a future write handler is registered, `reviewWriteLiveHandlerRegistrationCandidate()` must pass. It keeps the check passive, requires the expected guarded factory (`create` or `patch`), `npm run verify`, rollback metadata, and the write runtime requirements that prevent full-table responses or inline report recalculation.

The same check is available as `npm run review:write-handler`. It produces a JSON review packet with no database connection and no registry mutation, so a future write rollout can be reviewed before any handler code is promoted.

`npm run plan:write-handler-activation` is the safer first operator step for create/patch handlers. It checks the activation envelope, current planned/live status, expected guarded factory, and `compact_write_response` requirement, but keeps `appliesChanges = false`, `handlerRegistrationMutation = false`, and `write_handler_not_registered` in the output.

`lib/domain/data-access/moduleCreateMutationPlans.ts` is the matching create-action contract. New documents must start with `version = 1`, explicit `created_at/created_by/updated_at/updated_by`, an initial status, duplicate-key checks, and a change-history entry instead of inserting ambiguous full-table payloads.

`lib/domain/data-access/createMutationEnvelope.ts` turns those create plans into server-only envelopes for future handlers. It rejects empty or whole-table payloads, keeps duplicate checks mandatory, and lets the server initialize `version`, status, timestamps, author fields, and the first history entry.

## Текущий кодовый контракт

`lib/domain/editing/patchEditing.ts` содержит базовые типы для будущих сохранений:

- `VersionedEntityReference`;
- `PatchSaveCommand`;
- `PatchSaveResult`;
- `PatchSaveConflict`;
- `ChangeHistoryEntry`.
- `createPatchFieldChanges`;
- `applyPatchFieldChanges`.

Эти типы пока не меняют существующие формы. Они задают общий язык для следующих модулей, чтобы новые таблицы сразу сохраняли только измененные поля и проверяли `version`.

`lib/domain/audit/changeHistory.ts` задает будущую историю изменений по полям. Это отдельный audit trail для производственных документов, не замена текущим admin logs.

`lib/domain/editing/patchSavePolicy.ts` связывает version-based patch и audit trail. Он проверяет открытую `version` против текущей записи, при совпадении готовит `PatchSaveResult` и `ChangeHistoryBatch`, а при несовпадении возвращает `PatchSaveConflict` с server-values по тем же полям. Этот слой нужен будущему API/data layer, чтобы UI не решал конфликты сам и не сохранял целые таблицы.

Новые service contracts в `lib/domain/dispatch`, `lib/domain/taxation`, `lib/domain/smts`, `lib/domain/fleet` и `lib/domain/common-processes` используют `VersionedEntityReference` для документов, которые будут редактироваться пользователями.

## Базовый принцип

Все производственные таблицы открываются в режиме просмотра. Редактирование включается только явным действием пользователя: кнопкой `Редактировать`, карандашом или открытием формы документа.

Это снижает нагрузку на браузер, уменьшает количество handlers и защищает от случайной перезаписи данных.

## Поля строки

Для каждой важной строки или документа обязательны:

- `id`;
- `version`;
- `updated_at`;
- `updated_by`;
- `status`.

Для workflow-документов добавляются:

- `created_at`;
- `created_by`;
- `approved_at`;
- `approved_by`;
- `closed_at`;
- `closed_by`;
- `cancelled_at`;
- `cancelled_by`;
- `reason`.

## Version-based editing

version-based editing работает так:

1. Пользователь открывает строку и получает текущую `version`.
2. Пользователь меняет локальный draft.
3. Клиент отправляет patch: `id`, исходную `version`, измененные поля.
4. Сервер сравнивает `version`.
5. Если версия совпала, сервер применяет patch и увеличивает `version`.
6. Если версия не совпала, сервер возвращает conflict response.

Клиент не отправляет всю таблицу целиком.

## Patch-сохранение

Patch содержит только измененные поля:

```json
{
  "id": "row_123",
  "version": 7,
  "changes": {
    "trips": 85,
    "coefficient": 18,
    "reason": "Ремонт самосвалов"
  }
}
```

Запрещено сохранять:

- весь массив строк при изменении одной строки;
- всю таблицу при изменении одной ячейки;
- большой localStorage snapshot как основной источник производственной истины;
- Excel-файл как replacement вместо структурных строк.

## Конфликт изменений

Если версия не совпала, UI показывает:

- что пользователь открыл;
- что изменил другой пользователь;
- что хочет сохранить текущий пользователь;
- доступные действия: обновить, применить только безопасные поля, создать новую версию, отменить.

`lib/domain/audit/undoHistory.ts` prepares field-level undo commands from change history. Undo is allowed only when the current record still contains the values written by the selected history entries; otherwise it returns `current_value_changed` instead of overwriting another user's edit.

Конфликт нельзя решать молча. Чужие изменения не затираются.

## Журнал изменений

Audit log обязателен для:

- планов;
- сменных сводок;
- топлива;
- ходатайств;
- закреплений;
- перемещений техники;
- терминалов;
- SIM-карт;
- ДУТ;
- актов сверки;
- ремонтов;
- переработок;
- командировок.

Запись журнала:

- `entity_type`;
- `entity_id`;
- `field`;
- `old_value`;
- `new_value`;
- `changed_at`;
- `changed_by`;
- `reason`;
- `workspace`;
- `source_document_id`.

## Undo

Undo помогает отменить локальное действие в текущей сессии, но не заменяет журнал изменений.

Правило:

- UI undo может хранить краткие snapshots для активной формы;
- серверный audit log хранит каждое подтвержденное изменение;
- восстановление старого значения тоже записывается как новое событие.

## Режим просмотра

Режим просмотра должен быть легким:

- нет тяжелого редактора;
- нет selection state для всей таблицы;
- нет drag state;
- нет массовых input handlers;
- строки приходят страницами;
- фильтры, поиск и сортировка выполняются на сервере.

## Режим редактирования

Режим редактирования включает:

- draft state только для активной строки/страницы;
- валидаторы;
- подсветку измененных полей;
- проверку прав `can_edit`;
- сохранение patch;
- обработку conflict response;
- запись audit log после успешного сохранения.

## Workflow-статусы

Документы нельзя редактировать одинаково во всех статусах. Пример:

- `draft`: можно менять поля;
- `submitted`: можно вернуть или принять;
- `approved`: можно только корректировать через отдельную версию;
- `closed`: нельзя менять без reopen/корректирующего документа;
- `cancelled`: нельзя использовать в расчетах.

Права должны проверяться по действию: `can_view`, `can_edit`, `can_approve`, `can_delete`, `can_export`, `can_admin`.

Первый общий контракт переходов лежит в `lib/domain/workflows/statusTransitions.ts`. Он не сохраняет данные и не меняет текущую авторизацию; он задает допустимые переходы, terminal statuses и обязательные признаки `requiresVersionCheck`, `savesPatchOnly`, `writesChangeHistory`.

Компоненты не должны самостоятельно решать, можно ли перевести документ из `draft` в `closed`. UI должен запрашивать allowed actions у domain/data слоя и отправлять patch-команду с текущей `version`.

## Применение по модулям

- Горная сводка: исходные рейсы не затираются маркшейдерским замером.
- Планы: каждый месячный и годовой план имеет версию.
- Таксировка: путевой лист нельзя дублировать без отметки `повторная печать`.
- Топливо: топливный период закрывается, изменения идут через корректировку.
- СМТС: перенос терминала создает историю, а не переписывает текущую строку.
- Техника: перемещение оформляется документом и влияет на текущий участок через историю.
