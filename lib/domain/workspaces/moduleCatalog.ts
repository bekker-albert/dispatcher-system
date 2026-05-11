import type { RequiredFilterKey } from "../data-access/pagination";
import type { DispatchWorkspaceId } from "./workspaces";

export type WorkspaceModuleStatus = "existing" | "scaffold" | "planned";
export type WorkspaceTableStrategy = "none" | "server-paginated" | "aggregate" | "on-demand-export";
export type WorkspaceEditingStrategy = "readonly" | "versioned-patch" | "workflow";

export type WorkspaceModuleCatalogItem = {
  id: string;
  workspaceId: DispatchWorkspaceId;
  title: string;
  status: WorkspaceModuleStatus;
  currentSource?: string;
  contractSource?: string;
  tableStrategy: WorkspaceTableStrategy;
  editingStrategy: WorkspaceEditingStrategy;
  requiredFilters: RequiredFilterKey[];
  nextStep: string;
};

export const workspaceModuleCatalog: WorkspaceModuleCatalogItem[] = [
  {
    id: "mining-shift-reports",
    workspaceId: "mining-dispatch",
    title: "Сменные сводки участков",
    status: "scaffold",
    currentSource: "features/dispatch",
    contractSource: "lib/domain/dispatch/service-contracts.ts",
    tableStrategy: "server-paginated",
    editingStrategy: "workflow",
    requiredFilters: ["date", "section_id", "shift", "status"],
    nextStep: "Сделать API list/detail с version и статусами draft/submitted/accepted.",
  },
  {
    id: "mining-operational-accounting",
    workspaceId: "mining-dispatch",
    title: "Оперучет из принятых сводок",
    status: "planned",
    contractSource: "lib/domain/dispatch/service-contracts.ts",
    tableStrategy: "aggregate",
    editingStrategy: "versioned-patch",
    requiredFilters: ["date", "section_id", "shift"],
    nextStep: "Считать из принятых сводок, маркшейдерский замер держать корректирующим слоем.",
  },
  {
    id: "taxation-waybills",
    workspaceId: "taxation",
    title: "Путевые листы",
    status: "scaffold",
    currentSource: "features/fuel",
    contractSource: "lib/domain/taxation/service-contracts.ts",
    tableStrategy: "server-paginated",
    editingStrategy: "workflow",
    requiredFilters: ["date", "section_id", "shift", "driver_id", "vehicle_id", "status"],
    nextStep: "Разделить пакетную и одиночную выдачу, запретить дубли по driver/vehicle/shift.",
  },
  {
    id: "taxation-fuel-periods",
    workspaceId: "taxation",
    title: "Топливные периоды 1С",
    status: "planned",
    contractSource: "lib/domain/taxation/service-contracts.ts",
    tableStrategy: "server-paginated",
    editingStrategy: "workflow",
    requiredFilters: ["section_id", "period_id", "status"],
    nextStep: "Добавить периоды 01-15 и 16-30/31 со статусами сверки и передачи в 1С.",
  },
  {
    id: "smts-vehicle-cards",
    workspaceId: "smts-gps",
    title: "Карточки СМТС по технике",
    status: "scaffold",
    currentSource: "features/safety-driving",
    contractSource: "lib/domain/smts/service-contracts.ts",
    tableStrategy: "server-paginated",
    editingStrategy: "versioned-patch",
    requiredFilters: ["section_id", "vehicle_id", "terminal_id", "status"],
    nextStep: "Выделить терминалы и SIM-карты отдельными сущностями с историей установок.",
  },
  {
    id: "smts-fuel-drains",
    workspaceId: "smts-gps",
    title: "Проверка сливов топлива",
    status: "planned",
    contractSource: "lib/domain/smts/service-contracts.ts",
    tableStrategy: "server-paginated",
    editingStrategy: "workflow",
    requiredFilters: ["date", "section_id", "vehicle_id", "status"],
    nextStep: "Открывать события только за выбранный период и технику, без полного Wialon pull.",
  },
  {
    id: "fleet-movements",
    workspaceId: "fleet",
    title: "Перемещения техники",
    status: "planned",
    currentSource: "features/fleet",
    contractSource: "lib/domain/fleet/service-contracts.ts",
    tableStrategy: "server-paginated",
    editingStrategy: "workflow",
    requiredFilters: ["section_id", "vehicle_id", "status"],
    nextStep: "Создать документ перемещения и историю участков вместо перезаписи карточки.",
  },
  {
    id: "service-vehicle",
    workspaceId: "fleet",
    title: "Служебный автомобиль",
    status: "planned",
    contractSource: "lib/domain/fleet/service-contracts.ts",
    tableStrategy: "server-paginated",
    editingStrategy: "versioned-patch",
    requiredFilters: ["vehicle_id", "status"],
    nextStep: "Добавить ТО, страховку, резину, ремонты и напоминания.",
  },
  {
    id: "common-overtime",
    workspaceId: "common-processes",
    title: "Переработки и совмещения",
    status: "planned",
    contractSource: "lib/domain/common-processes/service-contracts.ts",
    tableStrategy: "server-paginated",
    editingStrategy: "workflow",
    requiredFilters: ["date", "section_id", "status"],
    nextStep: "Сделать общий workflow согласований с историей решений.",
  },
  {
    id: "common-business-trips",
    workspaceId: "common-processes",
    title: "Командировки",
    status: "planned",
    contractSource: "lib/domain/common-processes/service-contracts.ts",
    tableStrategy: "server-paginated",
    editingStrategy: "workflow",
    requiredFilters: ["date", "section_id", "status"],
    nextStep: "Связать командировки монтажников с задачами СМТС.",
  },
  {
    id: "prepared-reports",
    workspaceId: "reports",
    title: "Подготовленные агрегаты отчетов",
    status: "scaffold",
    currentSource: "features/reports",
    contractSource: "lib/domain/reports/aggregation-contracts.ts",
    tableStrategy: "aggregate",
    editingStrategy: "readonly",
    requiredFilters: ["date", "section_id", "status"],
    nextStep: "Перевести тяжелые отчеты на агрегаты и ограниченные периоды.",
  },
  {
    id: "access-matrix",
    workspaceId: "admin",
    title: "Матрица доступа",
    status: "scaffold",
    currentSource: "features/admin/access/AdminAccessMatrixSection.tsx",
    contractSource: "lib/domain/access-control/accessMatrix.ts",
    tableStrategy: "server-paginated",
    editingStrategy: "versioned-patch",
    requiredFilters: ["section_id", "status"],
    nextStep: "Подключить серверные grants с version и audit trail.",
  },
  {
    id: "ai-on-demand",
    workspaceId: "ai-assistant",
    title: "AI по запросу",
    status: "existing",
    currentSource: "features/ai-assistant",
    tableStrategy: "none",
    editingStrategy: "readonly",
    requiredFilters: [],
    nextStep: "Давать AI ограниченный runtime context, без постоянного фонового анализа.",
  },
];

export function getWorkspaceModuleCatalog(workspaceId: DispatchWorkspaceId) {
  return workspaceModuleCatalog.filter((item) => item.workspaceId === workspaceId);
}

export function countWorkspaceModulesByStatus(
  modules: readonly WorkspaceModuleCatalogItem[],
  status: WorkspaceModuleStatus,
) {
  return modules.filter((module) => module.status === status).length;
}
