import { workspaceAccessMatrixPreview } from "../access-control/accessMatrix";
import { listModuleDataRouteContracts } from "../data-access/moduleDataRoutes";
import { createWorkspaceGuardrailReport } from "./guardrails";
import { createWorkspaceHandlerRolloutSummary } from "./handlerRolloutSummary";
import { getWorkspaceModuleCatalog } from "./moduleCatalog";
import type { DispatchWorkspaceDefinition, DispatchWorkspaceId } from "./workspaces";

export type WorkspaceReadinessState = "ready" | "in-progress" | "planned";

export type WorkspaceReadinessItem = {
  id: string;
  label: string;
  state: WorkspaceReadinessState;
  detail: string;
};

export type WorkspaceReadinessSummary = {
  workspaceId: DispatchWorkspaceId;
  score: number;
  readyCount: number;
  totalCount: number;
  items: WorkspaceReadinessItem[];
  nextStep: string;
};

const serviceContractFiles: Partial<Record<DispatchWorkspaceId, string[]>> = {
  "mining-dispatch": ["lib/domain/dispatch/service-contracts.ts"],
  taxation: ["lib/domain/taxation/service-contracts.ts"],
  "smts-gps": ["lib/domain/smts/service-contracts.ts"],
  fleet: ["lib/domain/fleet/service-contracts.ts"],
  "common-processes": ["lib/domain/common-processes/service-contracts.ts"],
  reports: ["lib/domain/reports/aggregation-contracts.ts"],
  admin: ["lib/domain/access-control/accessMatrix.ts"],
};

export function createWorkspaceReadinessSummary(
  workspace: DispatchWorkspaceDefinition,
): WorkspaceReadinessSummary {
  const accessPreview = workspaceAccessMatrixPreview.find((row) => row.workspaceId === workspace.id);
  const contractFiles = serviceContractFiles[workspace.id] ?? [];
  const catalogModules = getWorkspaceModuleCatalog(workspace.id);
  const guardrailReport = createWorkspaceGuardrailReport(workspace.id);
  const handlerRollout = createWorkspaceHandlerRolloutSummary(workspace.id);
  const dataRouteContracts = listModuleDataRouteContracts(workspace.id);
  const dataRouteCoverageReady = catalogModules.length > 0
    && dataRouteContracts.length === catalogModules.length;

  const items: WorkspaceReadinessItem[] = [
    {
      id: "lazy-loading",
      label: "Ленивая загрузка",
      state: workspace.id === "home" ? "ready" : "in-progress",
      detail: "Рабочая зона открывается через общий shell и не грузит все модули на старте.",
    },
    {
      id: "domain-contract",
      label: "Доменный контракт",
      state: contractFiles.length > 0 || catalogModules.some((module) => module.contractSource) ? "ready" : "planned",
      detail: contractFiles.length > 0 ? contractFiles.join(", ") : "Контракт будет добавлен перед реализацией таблиц.",
    },
    {
      id: "access-matrix",
      label: "Матрица доступа",
      state: accessPreview ? "in-progress" : "planned",
      detail: accessPreview ? "Есть preview user/role/section/workspace." : "Нужно описать права рабочей зоны.",
    },
    {
      id: "server-pagination",
      label: "Серверные выборки",
      state: accessPreview?.requiredServerFilters.length ? "in-progress" : "planned",
      detail: accessPreview?.requiredServerFilters.length
        ? `Фильтры: ${accessPreview.requiredServerFilters.join(", ")}.`
        : "Для легких экранов тяжелые выборки не требуются.",
    },
    {
      id: "safe-editing",
      label: "Patch-редактирование",
      state: contractFiles.length > 0 ? "in-progress" : "planned",
      detail: "Новые формы должны использовать version, patch-save, conflict response и audit trail.",
    },
    {
      id: "data-route-contract",
      label: "Data route",
      state: dataRouteCoverageReady ? "ready" : "planned",
      detail: `${dataRouteContracts.length}/${catalogModules.length} modules use the shared /api/database router.`,
    },
    {
      id: "guardrails",
      label: "Guardrails",
      state: guardrailReport.blockerCount === 0 && guardrailReport.warningCount === 0
        ? "ready"
        : guardrailReport.blockerCount > 0
          ? "planned"
          : "in-progress",
      detail: `Modules: ${guardrailReport.checkedModuleCount}; blockers: ${guardrailReport.blockerCount}; warnings: ${guardrailReport.warningCount}.`,
    },
    {
      id: "handler-rollout",
      label: "Handler rollout",
      state: handlerRollout.readyToStartImplementation ? "ready" : "planned",
      detail: `Actions: ${handlerRollout.readyActions}/${handlerRollout.totalActions}; next: ${handlerRollout.nextPhase ?? "none"} (${handlerRollout.nextBatchSize}); blockers: ${handlerRollout.blockedActions}.`,
    },
  ];

  const readyCount = items.filter((item) => item.state === "ready").length;
  const score = Math.round((readyCount / items.length) * 100);

  return {
    workspaceId: workspace.id,
    score,
    readyCount,
    totalCount: items.length,
    items,
    nextStep: nextReadinessStep(items),
  };
}

function nextReadinessStep(items: WorkspaceReadinessItem[]) {
  const nextItem = items.find((item) => item.state !== "ready");
  return nextItem ? nextItem.label : "Готово к следующему этапу реализации";
}
