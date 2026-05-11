import { defaultTopTabs, type TopTab } from "../navigation/tabs";
import {
  dispatchServiceWorkspaces,
  type DispatchWorkspaceDefinition,
  type DispatchWorkspaceId,
} from "./workspaces";

export const requiredDispatchWorkspaceIds = [
  "home",
  "mining-dispatch",
  "taxation",
  "smts-gps",
  "fleet",
  "common-processes",
  "reports",
  "admin",
  "ai-assistant",
] as const satisfies readonly DispatchWorkspaceId[];

export type WorkspaceRegistryIssueCode =
  | "missing_required_workspace"
  | "duplicate_workspace_id"
  | "duplicate_workspace_top_tab"
  | "workspace_top_tab_missing"
  | "workspace_top_tab_hidden"
  | "workspace_missing_operational_context"
  | "workspace_missing_future_scope"
  | "workspace_missing_performance_rule";

export type WorkspaceRegistryIssue = {
  code: WorkspaceRegistryIssueCode;
  workspaceId?: DispatchWorkspaceId;
  topTab?: TopTab;
  message: string;
};

export function validateDispatchWorkspaceRegistry(
  workspaces: readonly DispatchWorkspaceDefinition[] = dispatchServiceWorkspaces,
  topTabs: readonly Pick<(typeof defaultTopTabs)[number], "id" | "visible">[] = defaultTopTabs,
): WorkspaceRegistryIssue[] {
  const issues: WorkspaceRegistryIssue[] = [];
  const workspaceIdCounts = countBy(workspaces, (workspace) => workspace.id);
  const workspaceTopTabCounts = countBy(workspaces, (workspace) => workspace.topTab);
  const visibleTopTabs = new Map(topTabs.map((tab) => [tab.id, tab.visible]));

  for (const requiredWorkspaceId of requiredDispatchWorkspaceIds) {
    if (!workspaceIdCounts.has(requiredWorkspaceId)) {
      issues.push({
        code: "missing_required_workspace",
        workspaceId: requiredWorkspaceId,
        message: "Dispatch service workspace registry must include every top-level workspace.",
      });
    }
  }

  for (const [workspaceId, count] of workspaceIdCounts) {
    if (count > 1) {
      issues.push({
        code: "duplicate_workspace_id",
        workspaceId,
        message: "Workspace id must be unique in the registry.",
      });
    }
  }

  for (const [topTab, count] of workspaceTopTabCounts) {
    if (count > 1) {
      issues.push({
        code: "duplicate_workspace_top_tab",
        topTab,
        message: "Only one workspace may own a top-level navigation tab.",
      });
    }
  }

  for (const workspace of workspaces) {
    if (!visibleTopTabs.has(workspace.topTab as never)) {
      issues.push({
        code: "workspace_top_tab_missing",
        workspaceId: workspace.id,
        topTab: workspace.topTab,
        message: "Workspace references an unknown top-level navigation tab.",
      });
    } else if (!visibleTopTabs.get(workspace.topTab as never)) {
      issues.push({
        code: "workspace_top_tab_hidden",
        workspaceId: workspace.id,
        topTab: workspace.topTab,
        message: "Workspace references a hidden top-level navigation tab.",
      });
    }

    if (workspace.currentModules.length === 0) {
      issues.push({
        code: "workspace_missing_operational_context",
        workspaceId: workspace.id,
        message: "Workspace must point to existing modules or shell context before expansion.",
      });
    }

    if (workspace.futureModules.length === 0) {
      issues.push({
        code: "workspace_missing_future_scope",
        workspaceId: workspace.id,
        message: "Workspace must declare future module scope before implementation.",
      });
    }

    if (workspace.performanceRule.trim().length === 0) {
      issues.push({
        code: "workspace_missing_performance_rule",
        workspaceId: workspace.id,
        message: "Workspace must declare a performance rule for the 2 GB RAM architecture.",
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
