# Dispatch Service Architecture

## Domain purity boundary

`lib/domain` is the pure business layer of the modular monolith. Domain files
may define types, validation, workflow transitions, query policies, patch
commands, readiness summaries, and rollout contracts, but they must not import
React, Next, feature UI, shared UI, server database code, `lib/data`, MySQL,
Supabase, or browser APIs. They also must not call `fetch`, `/api/database`,
`window`, `document`, `localStorage`, or `process.env`.

`tests/domain-purity-guardrails-checks.ts` keeps that boundary executable. If a
future module needs UI state, browser behavior, SQL, files, or server runtime
work, that code belongs in the lazy feature screen, shared data helper, or
server database layer. The domain module should receive bounded inputs and
return plain objects.

Senior taxer control is prepared in `lib/domain/taxation/supervisorControl.ts`. The function consumes already bounded shift/watch/period data and returns section-level signals: missing waybills by active assignment, fuel issue without waybill, waybill without fuel, overconsumption, suspicious economy, open contractor debt, and non-closed fuel periods. It is a prepared-control layer, not a browser Excel recalculation over all rows.

Senior taxer substitution is prepared in `lib/domain/taxation/substitution.ts`. A substitution session stores who entered documents, which section was covered, the active period, basis (`sick_leave`, `vacation`, `vacancy`, `order`, `other`), approval context, and `version`/history requirements so future waybills, fuel records, and acts can keep a clear "worked in substitution mode" audit trail.

Contractor monitoring access control is prepared in `lib/domain/smts/contractorAccess.ts`. It checks only already bounded access rows and flags active access after `validTo`, access before `validFrom`, access without approval, contractor visibility outside the allowed vehicle scope, and access that expires soon.

Eco-driving mailing preparation is in `lib/domain/smts/ecoDriving.ts`. It aggregates already bounded events by period, section, driver, and vehicle, then creates a draft mailing with unique recipients and a queued-send marker; it does not run a permanent background AI/GPS analysis.

Fuel drain checks are prepared in `lib/domain/smts/fuelDrainChecks.ts`. It classifies bounded drain events by risk, builds review rows, and creates versioned status patch commands through the shared workflow; it does not load all Wialon fuel events at startup.

Service vehicle reminders are prepared in `lib/domain/fleet/serviceVehicleReminders.ts`. The helper checks only selected service vehicle rows, latest maintenance, current insurance, and active tire sets, then returns compact reminders for UI/API without a permanent background process.

Service vehicle repairs are prepared in `lib/domain/fleet/serviceVehicleRepairs.ts`. Repair rows are versioned entities with field-level patch commands, validation for mileage/cost/completed work, and required reasons for closing or cancelling records.

Common process reminders are prepared in `lib/domain/common-processes/processReminders.ts`. They evaluate only bounded overtime, business trip, and trip task rows to surface overdue approvals, missing trip reports, and unfinished trip tasks without scanning the whole personnel history.

Prepared report readiness is checked in `lib/domain/reports/reportReadiness.ts`. It blocks exports when the query violates the build policy, aggregates are missing, prepared data is stale, or source versions are absent, keeping heavy recalculation out of the browser.

Prepared aggregate refresh is queued through `lib/domain/reports/aggregateRefresh.ts`. Refresh jobs must be bounded by period/section/source ids, carry `sourceVersion`, declare row/runtime limits, and use `upsert-affected-aggregates`; full report rebuilds and continuous background recalculation are rejected for the 2 GB RAM server.

Report refresh sources are mapped in `lib/domain/reports/aggregateRefreshSources.ts`. Each source module must already have a bounded server list-query plan and mapped filters before it can feed prepared aggregates, so reports cannot quietly fall back to scanning all source tables.

Report aggregate invalidation is prepared in `lib/domain/reports/aggregateInvalidation.ts`. A source create/patch/workflow/import event invalidates only one changed entity inside its affected period and section, then queues a bounded prepared aggregate refresh; whole-table invalidation is rejected.

Report invalidation plans are mapped in `lib/domain/reports/aggregateInvalidationPlans.ts`. They connect future create, patch, workflow transition, and import-accepted actions to aggregate invalidation, so a source write cannot silently skip the prepared-report refresh contract.

Access matrix review is prepared in `lib/domain/access-control/accessMatrixReview.ts`. It does not change authorization; it flags risky grants such as contractor edit access, elevated rights without audit reason, unsupported module capabilities, missing section scope, and duplicate grants for the admin UI.

AI assistant workload policy is prepared in `lib/domain/ai-assistant/workloadPolicy.ts`. It allows manual, event-driven, and scheduled runs only when context is bounded, row limits are declared, required approvals are present, and continuous background scans are blocked for the 2 GB RAM server.

## Текущий кодовый каркас

- `lib/domain/workspaces/workspaces.ts` хранит карту рабочих зон и будущие поддоменные маршруты.
- `lib/domain/access-control/accessMatrix.ts` хранит типы будущей матрицы доступа и легкий preview по рабочим зонам.
- `lib/domain/access-control/moduleAccessPolicies.ts` связывает будущие модули с действиями `open/list/create/edit/approve/export/admin` и требуемыми capability `view/edit/approve/export/admin`.
- `features/admin/access/AdminAccessMatrixSection.tsx` показывает placeholder матрицы доступа без изменения текущей авторизации.
- `lib/domain/editing/patchEditing.ts` фиксирует общий контракт version-based patch-сохранения и conflict response.
- `lib/domain/audit/changeHistory.ts` фиксирует будущий audit trail изменений по полям.
- `lib/domain/dispatch/service-contracts.ts` фиксирует будущие документы горной диспетчеризации: сменные сводки, строки, планы, маркшейдерские корректировки и GPS-сверку.
- `lib/domain/taxation/service-contracts.ts` фиксирует путевые листы, закрепления, ходатайства, топливные периоды, движения топлива и долги подрядчиков.
- `lib/domain/smts/service-contracts.ts` фиксирует карточку СМТС по технике, терминалы, SIM-карты, монтажи, экодрайвинг, сливы и доступы подрядчиков.
- `lib/domain/fleet/service-contracts.ts` фиксирует перемещения техники и учет служебного автомобиля.
- `lib/domain/common-processes/service-contracts.ts` фиксирует переработки, командировки, задачи командировок и общий журнал событий.
- `lib/domain/reports/aggregation-contracts.ts` фиксирует подготовленные агрегаты отчетов и экспорт по запросу.
- `lib/domain/data-access/persistenceContracts.ts` фиксирует будущие persistent entities по модулям: где нужен `version`, patch-only save, change history, prepared aggregates и on-demand export.
- `lib/domain/workspaces/guardrails.ts` объединяет catalog/access/query/persistence в проверяемый отчет готовности модулей к реализации.
- `lib/domain/workspaces/moduleActionPreflight.ts` задает общий preflight будущих действий модуля: права, bounded query и persistence contract проверяются до чтения/записи.
- `lib/domain/data-access/moduleDataRoutes.ts` фиксирует будущие `resource/action` для единого `/api/database`, чтобы рабочие зоны не превращались в отдельные backend-приложения.
- `lib/domain/data-access/moduleLiveHandlerRegistry.ts` держит будущие обработчики в статусе `planned-only`, пока отдельный маленький backend-шаг не переведет конкретный `resource/action` в `live` после runtime gate.
- `lib/domain/data-access/moduleHandlerActivation.ts` описывает review-конверт такого backend-шага: один action, ответственный, причина, путь реализации, `npm run verify` и rollback-план.
- `lib/server/database/module-live-handlers.ts` подготавливает единственную точку подключения live-обработчиков внутри существующего `/api/database`; сейчас она пустая и не меняет поведение planned actions.
- `lib/server/database/module-handler-execution.ts` готовит guarded context для будущих live read-handlers: server pagination для списков и `id + scope + maxRows: 1` для карточек.
- `lib/server/database/module-write-execution.ts` готовит guarded context для будущих live write-handlers: create/patch/workflow проходят duplicate/version/patch-only/change-history/post-commit требования до SQL. Section-scoped writes also require `sectionId`/`section_id` before the future handler can update a row by `id`.
- `lib/server/database/module-file-execution.ts` готовит guarded context для будущих live export/import handlers: queued export, file reference, stored import files, staged validation and bounded issue pages.
- `lib/server/database/module-handler-factories.ts` дает wrapper API для будущих live handlers, чтобы guard context создавался до бизнес-логики модуля.
- `lib/server/database/module-live-handlers.ts` хранит registration metadata для будущих live handlers: `resource/action`, `factoryKind`, `implementationPath`, guarded handler, проверки дублей, factory/handler alignment и one-to-one alignment между live-key и server registration.

## Цель

Система диспетчерской службы AA Mining развивается как модульный монолит: один Next.js проект, единая авторизация, единый data layer и одна база данных. Первый этап не переносит все процессы из Excel сразу. Он фиксирует рабочие зоны, правила доступа, безопасное редактирование, производительные таблицы и будущие доменные границы.

## Аудит текущего состояния

- `app/page.tsx` уже маленький: он проверяет авторизацию и открывает `features/app/AppRoot.tsx`.
- `features/app/AppRoot.tsx` собирает `useAppStateBundle`, runtime/controllers, derived models, header и primary content.
- `features/app/AppPrimaryContent.tsx` уже разделяет основные вкладки и подключает тяжелые зоны через `features/app/lazyPrimaryContent.tsx`.
- `features/app/useAppStateBundle.ts` не является гигантским файлом логики, но агрегирует много hooks. Риск роста остается: новые модули нельзя добавлять прямо в bundle, им нужны отдельные hooks/providers.
- `features/dispatch`, `features/pto`, `features/fleet`, `features/fuel`, `features/reports`, `features/admin`, `features/ai-assistant` уже отделены по feature folders.
- `lib/domain` хранит доменную логику без JSX, это хороший фундамент для модульного монолита.
- `lib/data`, `lib/server/database`, `lib/server/mysql`, `lib/supabase` уже образуют data layer и маршрутизацию к базе.
- В проекте принята практика source-check тестов в `tests/*.ts`.

## Рабочие зоны

Верхний слой рабочих зон:

1. Главная.
2. Горная диспетчеризация.
3. Таксировка.
4. СМТС / GPS.
5. Техника.
6. Общие процессы.
7. Отчеты.
8. Администрирование.
9. AI-ассистент.

Сопоставление с текущими модулями:

- `dispatch` -> Горная диспетчеризация, сменные сводки, консолидация.
- `fuel` -> Таксировка, топливо, ведомости, акты.
- `fleet` -> Техника, карточки, перемещения, обслуживание.
- `pto` -> ПТО, планы, оперучет, маркшейдерский замер.
- `tb` / `safety-driving` -> СМТС / GPS, экодрайвинг, безопасное вождение.
- `reports` -> Отчеты и контроль.
- `admin` -> Администрирование, справочники, права, логи.
- `ai-assistant` -> AI-ассистент по задачам, документам и подсказкам.

Существующие вкладки не удаляются резко. Старые контуры могут оставаться доступными, пока новые рабочие зоны получают свои экраны и data contracts.

## Горная диспетчеризация

Центр производственной сводки: звено `экскаватор + самосвалы`.

Будущие сущности:

- сменная сводка участка;
- строка сменной сводки;
- звено;
- экскаватор;
- самосвалы;
- рейсы;
- коэффициент;
- объем;
- единица измерения;
- весовая;
- план/факт;
- причина невыполнения;
- простой;
- ремонт;
- GPS-сверка;
- маркшейдерский замер;
- диспетчерский отчет.

Статусы сменной сводки:

- черновик;
- отправлено горному диспетчеру;
- на проверке;
- возвращено;
- принято;
- закрыто.

Оперучет формируется из принятых сменных сводок. Маркшейдерский замер является корректирующим слоем и не затирает исходные рейсы. План имеет версии и историю корректировок.

Pure-domain расчет оперучета находится в `lib/domain/dispatch/operationalAccounting.ts`. Он берет только сменные сводки в статусах `accepted` и `closed`, агрегирует строки по участку, дате, смене, виду работ и звену, хранит исходный объем отдельно от `finalVolume` и применяет последний маркшейдерский замер как корректирующий слой.

Plan/fact слой находится в `lib/domain/dispatch/planFact.ts`. Он сравнивает строки оперучета с утвержденными/закрытыми версиями плана, игнорирует draft/superseded версии, считает отклонение, процент выполнения и статусы `behind_plan`, `on_plan`, `over_plan`, `missing_fact`, `unplanned_fact`.

Причины невыполнения плана контролируются в `lib/domain/dispatch/nonCompletionReasons.ts`. Строки со статусами `behind_plan` и `missing_fact` требуют причину или комментарий; этот слой нужен, чтобы будущий диспетчерский отчет нельзя было закрыть с отставанием без объяснения.

Готовность диспетчерского отчета к закрытию определяется в `lib/domain/dispatch/reportReadiness.ts`. Он объединяет контроль сдачи сводок, GPS-сверку, причины невыполнения и plan/fact, возвращает `canClose`, blockers и warnings для будущего рабочего стола горного диспетчера.

Закрытие диспетчерского отчета вынесено в `lib/domain/dispatch/reportClosure.ts`. Слой проверяет readiness, право `can_approve`/`can_admin`, наличие принятых сменных сводок и возвращает только version-based patch-команды `accepted -> closed`, чтобы будущий UI не закрывал отчет в обход blockers и истории изменений.

Контроль сдачи сменных сводок находится в `lib/domain/dispatch/submissionControl.ts`. Он строит строки контроля по ожидаемым участкам и сменам, показывает отсутствующие и просроченные сводки, а также агрегирует счетчики `missing`, `overdue`, `returned`, `accepted`, `closed` для будущего рабочего стола горного диспетчера.

GPS-сверка рейсов находится в `lib/domain/dispatch/gpsReconciliation.ts`. Она сравнивает рейсы из принятых сменных сводок с GPS-рейсами по самосвалам в выбранном периоде/смене, считает расхождение и отдельно показывает отсутствующие GPS-данные по технике. GPS/Wialon данные должны передаваться в этот слой уже ограниченными фильтрами, а не полной выгрузкой.

Первый доменный слой для строки сменной сводки вынесен в `lib/domain/dispatch/shiftReportLineModel.ts`. Он фиксирует расчет `рейсы * коэффициент`, валидацию производственного звена, запрет дублей самосвалов в одном звене и patch-команду для сохранения только измененных полей. Текущие экраны диспетчерской сводки пока не переподключаются к этому слою, чтобы не ломать работающую вкладку.

Контракт будущего списка сменных сводок находится в `lib/domain/dispatch/shiftReportQueries.ts`: серверная пагинация, фильтры по периоду, участку, смене и статусу, нормализация `pageSize` и будущие индексы `date+section_id+shift`, `section_id+status`, `updated_at`.

Командный слой сменной сводки находится в `lib/domain/dispatch/shiftReportCommands.ts`. Он связывает workflow-переходы, effective access и patch-команду статуса, чтобы будущие кнопки `отправить`, `вернуть`, `принять`, `закрыть` не содержали бизнес-правила прямо в React.

## Таксировка

Будущие блоки:

- пакетная выдача путевых листов;
- одиночная выдача с обязательным основанием при отсутствии закрепления;
- закрепления работников за техникой;
- ходатайства на временное закрепление;
- заправочные ведомости;
- учет топлива по технике;
- учет топлива в топливозаправщиках;
- акты приема-передачи и сверки топлива;
- накладные поставщика;
- сверка с накладной;
- периоды 1С `01-15` и `16-30/31`;
- должники по топливу;
- контроль старшего диспетчера-таксировщика.

Топливозаправщик моделируется одновременно как техника и мини-склад на колесах: остаток на начало, получено, выдано, передано, списано, расчетный остаток, фактический остаток, расхождение.

Будущие таблицы: `supplier_fuel_invoices`, `fuel_accounting_periods`, `fuel_1c_movements`, `fuel_transfer_acts`, `fuel_reconciliation_acts`, `contractor_fuel_debts`.

Первый pure-domain слой выдачи путевых листов находится в `lib/domain/taxation/waybillIssuance.ts`. Он строит план пакетной выдачи по действующим закреплениям, отдает `already_created` вместо дубля, разрешает повторную печать уже созданного путевого листа, учитывает приоритет временного закрепления над основным и требует `basis` для одиночной выдачи без действующего закрепления.

Ходатайства на временное закрепление подготовлены в `lib/domain/taxation/assignmentPetitions.ts`. Approved petition превращается в команду создания temporary assignment только после проверки пересечений: один водитель не может получить две техники на период, и одна техника не может быть закреплена за двумя водителями.

Топливный учет таксировки подготовлен в `lib/domain/taxation/fuelAccounting.ts`. Слой определяет периоды `01-15` и `16-30/31`, считает топливозаправщик как мини-склад: остаток на начало, поступление от поставщика, выдача технике, передача подрядчику, списание, корректировка, расчетный остаток, фактический остаток и расхождение. Расчет работает по уже ограниченному `periodId`, поэтому не требует загружать всю топливную историю в браузер.

## СМТС / GPS

Будущие подразделы:

- рабочий стол СМТС;
- техника и подключение;
- терминалы;
- SIM-карты;
- ДУТ;
- монтажи, демонтажи, переносы;
- заявки 1С;
- склад оборудования;
- монтажники;
- командировки;
- экодрайвинг;
- сливы топлива;
- доступы подрядчиков;
- отчеты;
- настройки СМТС.

Терминалы и SIM-карты являются отдельными сущностями. История хранит связи `терминал -> техника`, `терминал -> SIM`, `SIM -> терминал`, установку, снятие, перенос и замену.

Первый pure-domain слой жизненного цикла оборудования находится в `lib/domain/smts/equipmentLifecycle.ts`. Он готовит version-based patch-команды для карточки СМТС по технике, терминала и SIM-карты, а также отдельное событие монтажа/снятия. Установка запрещена, если техника уже имеет терминал, терминал не доступен или SIM уже установлена; снятие запрещено, если терминал фактически не числится на этой технике. Это сохраняет историю и не требует менять весь список техники целиком.

GPS/Wialon не загружается целиком. Любой запрос должен ограничиваться датой, участком, техникой и типом события.

## Техника

Перемещение техники оформляется документом, а не прямой заменой участка в карточке. Карточка техники показывает текущий участок и историю: где была, когда перемещена, на каком основании, кто согласовал.

Документ перемещения влияет на путевые листы, закрепления, горную сводку, GPS, ремонты, топливо и отчеты.

Доменный слой перемещений техники находится в `lib/domain/fleet/vehicleMovements.ts`. Он валидирует документ, проверяет workflow-переходы и права согласования, а также формирует две маленькие команды для истории участка: закрыть предыдущую запись `validTo` и открыть новую запись `vehicle_section_history`. История участка теперь versioned, поэтому перемещение не должно выполняться прямой правкой карточки техники.

Служебный автомобиль ведется отдельным контуром внутри модуля техники: ТО, страховка, пробег, резина, ремонты, документы и напоминания.

## Общие процессы

Модуль покрывает:

- переработки;
- совмещение;
- отзыв с межвахтового отдыха;
- выход в выходной день;
- работа за вакансию;
- сверхурочные;
- командировки;
- согласования;
- документы;
- напоминания;
- журнал событий.

Командировки должны быть общими для начальника ДС, монтажников СМТС, горных диспетчеров, таксировщиков, перемещения техники и проверок участков.

Доменный слой общих процессов находится в `lib/domain/common-processes/processCommands.ts`. Он валидирует переработки и командировки, применяет общий workflow `common-process`, проверяет `can_approve` для согласования и возвращает только version-based patch-команды статусов. Для командировки есть readiness: перед закрытием нужен отчет и все задачи командировки должны быть approved/closed.

## Отчеты

Отчеты используют агрегаты или подготовленные наборы. Клиент не должен каждый раз пересчитывать большие массивы. Разрезы для будущих отчетов: смена, сутки, вахта, `01-15`, `16-30/31`, месяц, год.

Доменный слой подготовленных отчетов находится в `lib/domain/reports/preparedReports.ts`. Он проверяет политику отчета: `usesPreparedAggregates`, допустимый `grain`, обязательные фильтры и максимальный диапазон дат. Выборка работает только по подготовленным агрегатам, а Excel/PDF/CSV создаются через queued `report_export_request` по кнопке пользователя, без постоянной генерации файлов и без пересчета больших массивов в браузере.

## Роли

Базовые роли:

- начальник диспетчерской службы;
- горный диспетчер;
- горный мастер;
- начальник участка;
- диспетчер-таксировщик;
- старший диспетчер-таксировщик;
- технический администратор СМТС;
- монтажник СМТС;
- специалист ТБ;
- администратор системы;
- подрядчик с ограниченным доступом.

## Права доступа

Права строятся как гибкая матрица, а не только жесткая роль:

- `user_id`;
- `role_id`;
- `section_id`;
- `workspace/module/tab`;
- `can_view`;
- `can_edit`;
- `can_approve`;
- `can_delete`;
- `can_export`;
- `can_admin`.

Текущая авторизация уже умеет ограничивать видимость вкладок и редактирование через `tabPermissions`. Следующий этап расширяет модель до участка, роли, действия и workflow-статуса без поломки текущего login/session слоя.

Первый pure-domain расчет эффективного доступа находится в `lib/domain/access-control/effectivePermissions.ts`. Он объединяет grants по пользователю, роли, участку, workspace, module и tab, но не подключается напрямую к текущему session/auth runtime. Это безопасный слой для будущей админской матрицы прав.

Командный слой матрицы прав находится в `lib/domain/access-control/grantCommands.ts`. Он валидирует grant, нормализует capabilities (`edit`/`approve`/`export` подразумевают `view`, `admin` подразумевает все права), требует основание для `delete`/`admin` и формирует только version-based patch-команды по измененным флагам. Текущая авторизация остается нетронутой.

## Безопасное редактирование

Режим по умолчанию: просмотр. Редактирование включается кнопкой `Редактировать`.

Для важных строк обязательны поля:

- `id`;
- `version`;
- `updated_at`;
- `updated_by`;
- `status`.

Сохранение работает как patch: клиент отправляет `id`, открытую `version` и только измененные поля. Если версия не совпала, UI показывает конфликт.

Workflow-статусы будущих документов описываются централизованно в `lib/domain/workflows/statusTransitions.ts`. Этот слой фиксирует, что сменные сводки, ходатайства, топливные периоды, перемещения техники, проверки сливов и общие процессы должны переходить между статусами только через разрешенные переходы, с проверкой `version`, patch-сохранением и записью истории изменений.

## История изменений

Для планов, сменных сводок, топлива, ходатайств, закреплений, перемещений техники, терминалов, SIM-карт, ДУТ, актов, ремонтов, переработок и командировок нужна история:

- кто изменил;
- когда;
- поле;
- старое значение;
- новое значение;
- основание;
- связанный документ/workflow.

Undo не заменяет audit log. Undo помогает пользователю, audit log защищает производственную историю.

## Ограничение 2 GB RAM

Сервер имеет 2 GB RAM. Архитектура не должна порождать несколько постоянных backend-процессов или отдельные приложения под модули.

Обязательные правила:

- один Next.js процесс;
- один проект;
- один data layer;
- одна база;
- lazy loading рабочих зон;
- server-side pagination для таблиц;
- фильтрация, сортировка и поиск на сервере;
- лимиты выборок;
- отчеты через агрегаты;
- Excel/PDF по запросу;
- AI по запросу, событию или расписанию, но не постоянным фоном.

## Поддомены

Будущие поддомены открывают рабочую зону в том же Next.js проекте:

- `gd.aam-dispatch.kz` -> Горная диспетчеризация;
- `dt.aam-dispatch.kz` -> Таксировка;
- `smts.aam-dispatch.kz` -> СМТС / GPS;
- `pto.aam-dispatch.kz` -> ПТО;
- `reports.aam-dispatch.kz` -> Отчеты;
- `admin.aam-dispatch.kz` -> Администрирование.

Поддомены не создают отдельные приложения и не создают отдельные базы. Они являются маршрутизационным слоем над тем же модульным монолитом.
