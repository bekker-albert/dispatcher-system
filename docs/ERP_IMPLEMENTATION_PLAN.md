# План превращения dispatcher-system в ERP/ERM диспетчерской службы

Дата плана: 2026-05-10
Основа: аудит `docs/ERP_SYSTEM_AUDIT.md`

## Принципы внедрения

- Не переписывать рабочие контуры с нуля без необходимости.
- Не переносить будущие ERP-массивы в `useAppStateBundle`.
- Не добавлять новые `app/api/<module>` routes: все модульные данные идут через единый `/api/database`.
- Не считать preview/mock экран готовым модулем.
- Сначала стабилизировать данные, права и миграции, затем строить документы и аналитику.
- Все write-сценарии делать через versioned patch/workflow, с audit trail.
- Все тяжелые списки открывать bounded query: период, участок, статус, техника, пользователь, page/pageSize.

## Этап 1. Стабилизация текущего сайта

| Пункт | Описание |
|---|---|
| Цель | Зафиксировать рабочий черновик, убрать риск потери данных, сделать текущий сайт безопасной базой для дальнейших модулей. |
| Какие файлы/модули затрагиваются | `app/page.tsx`, `features/app/*`, `lib/data/*`, `lib/server/database/*`, `lib/server/mysql/*`, `lib/supabase/*`, `features/admin/database/*`, `docs/*`, `scripts/*`, `.env.example`. |
| Что нужно сделать | Подтвердить MySQL как production source of truth; описать explicit migration workflow; включить видимый раздел базы или убрать мертвую ветку; документировать localStorage recovery; запретить автоматическое продвижение локальных данных поверх базы без подтверждения; проверить env и smoke сценарии. |
| Риски | Можно случайно сломать текущую ПТО-синхронизацию или восстановление snapshots; можно преждевременно удалить полезный fallback. |
| Какие тесты нужны | `scripts/check-project-health.mjs`, `tests/database-router-checks.ts`, `tests/database-rpc-checks.ts`, `tests/security-runtime-config-checks.ts`, `tests/release-safety-checks.ts`, smoke load/save PTO и vehicles. |
| Ожидаемый результат | Текущий сайт открывается, ПТО и техника сохраняются предсказуемо, администратор понимает источник данных и способ восстановления. |

## Этап 2. Нормализация архитектуры

| Пункт | Описание |
|---|---|
| Цель | Удержать модульный монолит и подготовить место для реальных ERP-модулей без разрастания app shell. |
| Какие файлы/модули затрагиваются | `features/app/useAppStateBundle.ts`, `features/app/AppPrimaryContent.tsx`, `features/app/lazyPrimaryContent.tsx`, `lib/domain/workspaces/*`, `lib/domain/data-access/*`, `lib/domain/access-control/*`, `tests/*guardrails*`. |
| Что нужно сделать | Ввести правило module-level hooks/providers; оформить единый registry для PTO tabs; отделить справочники от demo defaults; перевести planned module contracts в пошаговый backlog live handlers; зафиксировать границы UI/data/domain/server. |
| Риски | Слишком ранний рефакторинг может затронуть ПТО и отчеты; нельзя делать массовое перемещение файлов без продуктовой причины. |
| Какие тесты нужны | `scripts/refactor-audit.mjs`, `tests/app-shell-architecture-checks.ts`, `tests/modular-monolith-guardrails-checks.ts`, `tests/single-data-layer-boundary-checks.ts`, `tests/module-data-routes-checks.ts`, `tests/domain-purity-guardrails-checks.ts`. |
| Ожидаемый результат | Новые модули добавляются через каталог, lazy screen, domain contract и shared data route, а не через глобальный state и ad hoc fetch. |

## Этап 3. Ядро ERP: техника, участки, пользователи, роли

| Пункт | Описание |
|---|---|
| Цель | Создать единые справочники, на которых будут держаться сводки, ПТО, топливо, GPS, ремонты и права. |
| Какие файлы/модули затрагиваются | `features/admin/vehicles/*`, `features/fleet/*`, `features/users/*`, `features/admin/access/*`, `features/admin/structure/*`, `lib/domain/vehicles/*`, `lib/domain/auth/*`, `lib/domain/access-control/*`, `lib/server/auth/*`, `lib/server/database/vehicles.ts`, `lib/server/mysql/schema-definitions.ts`. |
| Что нужно сделать | Разделить `vehicles` на карточку техники и справочные/исторические сущности; создать `sections`; связать users/roles/section scope; сделать серверную access matrix; добавить историю перемещения техники; нормализовать owners/contractors/drivers. |
| Риски | Текущий справочник техники уже используется ПТО, отчетами, диспетчерской сводкой и fleet view; миграция должна быть совместимой. |
| Какие тесты нужны | Vehicles persistence tests, auth permissions tests, access-control tests, migration tests, import/export Excel regression, permission checks на чтение/запись по section. |
| Ожидаемый результат | Есть надежное ядро ERP: техника, участки, пользователи, роли и базовые права, без дублирования справочников в defaults. |

## Этап 4. Производственная отчетность: сменная и суточная сводка

| Пункт | Описание |
|---|---|
| Цель | Превратить текущую диспетчерскую вкладку в нормализованный документ сменной сводки и суточного закрытия. |
| Какие файлы/модули затрагиваются | `features/dispatch/*`, `lib/domain/dispatch/*`, `lib/domain/data-access/moduleDataRouteCatalog.ts`, `lib/server/database/module-live-handlers.ts`, `lib/server/database/module-handler-factories.ts`, будущие MySQL migrations для `shift_reports`, `shift_report_lines`. |
| Что нужно сделать | Реализовать list/detail/create/patch/transition для сменных сводок; добавить статусы draft/submitted/returned/accepted/closed; связать строки с техникой, участком, сменой, рейсами, причинами; суточную сводку строить из принятых смен. |
| Риски | Нельзя сломать текущий экран Сутки/Ночь/День; нужен период совместимости между app_state rows и новыми документами. |
| Какие тесты нужны | Domain tests для `shiftReportLineModel`, `submissionControl`, `reportClosure`; API tests list/detail/patch/transition; UI smoke добавления строки; conflict/version tests. |
| Ожидаемый результат | Сменная сводка становится ERP-документом с правами, статусами, версией и историей, а суточная сводка собирается из принятых смен. |

## Этап 5. ПТО: план, оперучет, маркшейдерия

| Пункт | Описание |
|---|---|
| Цель | Связать ПТО с производственными документами и сохранить сильные стороны текущих таблиц. |
| Какие файлы/модули затрагиваются | `features/pto/*`, `features/app/Pto*`, `lib/domain/pto/*`, `lib/data/pto.ts`, `lib/server/database/pto.ts`, `lib/server/mysql/pto-*`, `lib/domain/reports/pto-*`. |
| Что нужно сделать | Ввести версии плана; сделать оперучет производным от accepted shift reports; оформить маркшейдерский замер как корректирующий документ; нормализовать ковши/кузова/производительность; добавить audit per field/cell; внедрить PTO tab registry. |
| Риски | ПТО самый рабочий и самый сложный контур; нельзя ломать Excel import/export, формулы, carryover и year-scoped load. |
| Какие тесты нужны | PTO persistence, PTO MySQL, formula selection, Excel import/export, buckets grid/virtualization, report derivation tests, migration tests. |
| Ожидаемый результат | ПТО остается удобной таблицей, но данные становятся версионированными, связанными со сменными сводками и пригодными для отчетности. |

## Этап 6. GPS/Wialon

| Пункт | Описание |
|---|---|
| Цель | Подключить GPS/Wialon как bounded integration, не загружая весь Wialon в браузер. |
| Какие файлы/модули затрагиваются | `features/safety-driving/*`, будущий `features/smts/*`, `lib/domain/smts/*`, `lib/domain/dispatch/gpsReconciliation.ts`, `lib/domain/data-access/moduleDataRouteCatalog.ts`, `lib/server/database/*`, будущие tables `gps_events`, `wialon_units`, `smts_vehicle_cards`, `terminals`, `sim_cards`, `fuel_drain_events`. |
| Что нужно сделать | Создать справочник СМТС по технике; добавить терминалы/SIM/ДУТ/монтажи; сделать Wialon sync по периоду и технике; реализовать сверку рейсов сменной сводки с GPS; подготовить события сливов и экодрайвинг. |
| Риски | Интеграция может стать тяжелой и дорогой; нужен строгий лимит периода, кеширование и фоновые queued jobs только по запросу/расписанию. |
| Какие тесты нужны | Domain tests для lifecycle/reconciliation/ecoDriving/fuelDrainChecks, API bounded query tests, connector contract tests, smoke на пустой/ошибочный Wialon ответ. |
| Ожидаемый результат | GPS становится проверочным слоем для рейсов, топлива и безопасного вождения, без постоянного полного сканирования. |

## Этап 7. Топливо и договоры

| Пункт | Описание |
|---|---|
| Цель | Заменить hardcoded таксировку на реальные путевые листы, топливо, договоры и взаиморасчеты. |
| Какие файлы/модули затрагиваются | `features/fuel/*`, `features/contractors/*`, будущий `features/taxation/*`, `lib/domain/taxation/*`, `lib/domain/smts/contractorAccess.ts`, `lib/domain/data-access/moduleDataRouteCatalog.ts`, будущие tables `waybills`, `assignments`, `fuel_periods`, `fuel_movements`, `fuel_invoices`, `fuel_transfer_acts`, `contractors`, `contracts`, `contractor_fuel_debts`. |
| Что нужно сделать | Реализовать путевые листы; закрепления водитель-техника; топливные периоды 01-15 и 16-30/31; учет ТЗ как мини-склада; акты сверки; договоры и лимиты подрядчиков; долги по топливу. |
| Риски | Топливо связано с техникой, путевыми листами, подрядчиками и GPS; без ядра ERP будут дубли и ручные обходы. |
| Какие тесты нужны | Waybill issuance tests, fuel accounting period tests, duplicate assignment tests, contractor debt tests, API workflow tests, print/export tests. |
| Ожидаемый результат | Таксировка становится операционным модулем, а не информационной карточкой. |

## Этап 8. Ремонты, простои и ответственность

| Пункт | Описание |
|---|---|
| Цель | Перевести ремонт/простой из числовых полей и комментариев в события с причиной, ответственным и влиянием на отчеты. |
| Какие файлы/модули затрагиваются | `features/fleet/*`, `features/admin/vehicles/*`, `features/dispatch/*`, `lib/domain/fleet/serviceVehicleRepairs.ts`, `lib/domain/fleet/serviceVehicleReminders.ts`, `lib/domain/fleet/vehicleMovements.ts`, будущие tables `vehicle_repairs`, `vehicle_downtimes`, `vehicle_section_history`, `responsibility_events`. |
| Что нужно сделать | Создать документы ремонта и простоя; связать их со сменными сводками; фиксировать начало/конец, причину, ответственного, статус; добавить напоминания по служебному автомобилю; обновить fleet view. |
| Риски | Можно получить расхождения между текущими полями `repair/downtime` и новыми событиями; нужен совместимый read model. |
| Какие тесты нужны | Fleet domain tests, downtime overlap tests, repair workflow tests, report aggregate invalidation tests, UI smoke readonly/edit mode. |
| Ожидаемый результат | Ремонт и простой становятся управляемыми процессами, влияющими на доступность техники, сменные сводки и ответственность. |

## Этап 9. Журнал изменений и контроль правок

| Пункт | Описание |
|---|---|
| Цель | Сделать audit trail обязательным для всех производственных изменений. |
| Какие файлы/модули затрагиваются | `features/admin/logs/*`, `lib/domain/audit/*`, `lib/domain/editing/*`, `lib/server/database/module-write-execution.ts`, `lib/server/mysql/schema-definitions.ts`, все будущие write handlers. |
| Что нужно сделать | Централизовать server-side audit; писать old/new values, user, role, section, reason, entity, version; связать undo/local logs только как UI-помощник; добавить просмотр и фильтры журнала. |
| Риски | Слишком подробный audit может разрастись; нужны индексы, retention policy и bounded queries. |
| Какие тесты нужны | Change history envelope tests, write execution tests, authorization tests, audit insert tests, log list pagination tests. |
| Ожидаемый результат | Любая правка в ERP проверяема: кто, когда, что изменил, почему и из какой версии. |

## Этап 10. AI-ассистент

| Пункт | Описание |
|---|---|
| Цель | Подключить AI только после появления стабильных данных, прав и audit, сохранив on-demand модель. |
| Какие файлы/модули затрагиваются | `features/ai-assistant/*`, `lib/domain/ai-assistant/*`, `lib/domain/ai-assistant/connectors/*`, будущий backend AI route/handler внутри существующей архитектуры, `lib/domain/data-access/moduleDataRouteCatalog.ts`. |
| Что нужно сделать | Заменить mock/session-only dataset на persistent artifacts; дать AI bounded runtime context; подключить backend AI API без ключей в браузере; требовать approval для действий; сохранять prompts/results/audit; добавить политики workload. |
| Риски | AI легко превратить в постоянный фоновый сканер или источник несанкционированных правок; это нужно запретить архитектурно. |
| Какие тесты нужны | AI workload policy tests, connector dry-run/real-boundary tests, permission tests, approval workflow tests, audit tests, prompt artifact tests. |
| Ожидаемый результат | AI помогает готовить черновики, объяснения, проверки и задачи, но не меняет ERP без прав, контекста и подтверждения. |

## Этап 11. Аналитика и дашборды

| Пункт | Описание |
|---|---|
| Цель | Построить полноценную главную аналитику на подготовленных агрегатах, а не на client-side пересчете всех таблиц. |
| Какие файлы/модули затрагиваются | `features/workspaces/WorkspaceOverviewSection.tsx`, будущий `features/analytics/*`, `features/reports/*`, `lib/domain/reports/*`, `lib/domain/workspaces/*`, future prepared aggregate handlers. |
| Что нужно сделать | Создать dashboard KPI: смены сданы/просрочены, план/факт, техника в работе/ремонте/простое, топливо, GPS нарушения, долги подрядчиков, открытые согласования, свежесть данных; добавить drill-down в модули. |
| Риски | Ранний dashboard без prepared aggregates станет тяжелым и неточным; нельзя строить аналитику поверх mock/default data. |
| Какие тесты нужны | Prepared report readiness tests, aggregate refresh/invalidation tests, dashboard query policy tests, UI smoke на пустых/частичных данных, performance budget tests. |
| Ожидаемый результат | Главная становится реальным ERP-диспетчерским центром, показывающим состояние службы и ведущим к конкретным действиям. |

## Рекомендуемая последовательность старта

Начинать нужно с Этапа 1 и Этапа 3. Без стабилизации источника данных и ядра справочников дальнейшие модули будут дублировать технику, участки, пользователей и права. После этого логичный первый production-модуль - сменная сводка из Этапа 4, потому что от нее зависят оперучет, суточный отчет, GPS-сверка, простои и аналитика.
