import { dispatchServiceWorkspaces, type DispatchWorkspaceId } from "./workspaces";
import {
  workspaceModuleCatalog,
  type WorkspaceModuleCatalogItem,
} from "./moduleCatalog";

export type ModuleCatalogIssueCode =
  | "workspace_without_catalog_modules"
  | "duplicate_module_id"
  | "module_unknown_workspace"
  | "heavy_module_without_filters"
  | "none_strategy_with_filters"
  | "existing_module_without_current_source"
  | "scaffold_module_without_current_source"
  | "planned_module_without_contract_source"
  | "module_missing_next_step";

export type ModuleCatalogIssue = {
  code: ModuleCatalogIssueCode;
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  message: string;
};

const tableStrategiesThatNeedFilters = new Set<WorkspaceModuleCatalogItem["tableStrategy"]>([
  "server-paginated",
  "aggregate",
  "on-demand-export",
]);

export function validateWorkspaceModuleCatalog(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
  workspaceIds: readonly DispatchWorkspaceId[] = dispatchServiceWorkspaces.map((workspace) => workspace.id),
): ModuleCatalogIssue[] {
  const issues: ModuleCatalogIssue[] = [];
  const knownWorkspaceIds = new Set(workspaceIds);
  const moduleIdCounts = countBy(modules, (module) => module.id);
  const workspaceModuleCounts = countBy(modules, (module) => module.workspaceId);

  for (const workspaceId of workspaceIds) {
    if (workspaceId !== "home" && !workspaceModuleCounts.has(workspaceId)) {
      issues.push({
        code: "workspace_without_catalog_modules",
        moduleId: `workspace:${workspaceId}`,
        workspaceId,
        message: "Every non-home workspace must have at least one catalog module before expansion.",
      });
    }
  }

  for (const [moduleId, count] of moduleIdCounts) {
    if (count > 1) {
      const catalogItem = modules.find((item) => item.id === moduleId);
      if (catalogItem) {
        issues.push({
          code: "duplicate_module_id",
          moduleId,
          workspaceId: catalogItem.workspaceId,
          message: "Workspace module catalog ids must be unique across the modular monolith.",
        });
      }
    }
  }

  for (const catalogItem of modules) {
    if (!knownWorkspaceIds.has(catalogItem.workspaceId)) {
      issues.push({
        code: "module_unknown_workspace",
        moduleId: catalogItem.id,
        workspaceId: catalogItem.workspaceId,
        message: "Workspace module catalog item must reference a registered workspace.",
      });
    }

    if (tableStrategiesThatNeedFilters.has(catalogItem.tableStrategy) && catalogItem.requiredFilters.length === 0) {
      issues.push({
        code: "heavy_module_without_filters",
        moduleId: catalogItem.id,
        workspaceId: catalogItem.workspaceId,
        message: "Server, aggregate, and export modules must declare bounded filters before implementation.",
      });
    }

    if (catalogItem.tableStrategy === "none" && catalogItem.requiredFilters.length > 0) {
      issues.push({
        code: "none_strategy_with_filters",
        moduleId: catalogItem.id,
        workspaceId: catalogItem.workspaceId,
        message: "Modules without a table strategy should not declare server query filters.",
      });
    }

    if (catalogItem.status === "existing" && !catalogItem.currentSource) {
      issues.push({
        code: "existing_module_without_current_source",
        moduleId: catalogItem.id,
        workspaceId: catalogItem.workspaceId,
        message: "Existing modules must point to the current source they wrap.",
      });
    }

    if (catalogItem.status === "scaffold" && !catalogItem.currentSource) {
      issues.push({
        code: "scaffold_module_without_current_source",
        moduleId: catalogItem.id,
        workspaceId: catalogItem.workspaceId,
        message: "Scaffold modules must point to the current screen they safely wrap.",
      });
    }

    if (catalogItem.status !== "existing" && !catalogItem.contractSource) {
      issues.push({
        code: "planned_module_without_contract_source",
        moduleId: catalogItem.id,
        workspaceId: catalogItem.workspaceId,
        message: "Scaffold and planned modules must point to a domain contract before UI/API expansion.",
      });
    }

    if (catalogItem.nextStep.trim().length === 0) {
      issues.push({
        code: "module_missing_next_step",
        moduleId: catalogItem.id,
        workspaceId: catalogItem.workspaceId,
        message: "Workspace module catalog item must declare the next safe implementation step.",
      });
    }
  }

  return issues;
}

function countBy<TItem, TKey>(items: readonly TItem[], getKey: (item: TItem) => TKey) {
  const counts = new Map<TKey, number>();
  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
