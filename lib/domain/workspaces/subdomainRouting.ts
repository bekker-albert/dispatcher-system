import {
  dispatchServiceWorkspaces,
  getLegacyWorkspaceTopTabBridge,
  getWorkspaceById,
  getWorkspaceByTopTab,
  workspaceSubdomainRoutes,
  type DispatchWorkspaceDefinition,
  type DispatchWorkspaceId,
  type WorkspaceSubdomainRoute,
} from "./workspaces";
import { defaultTopTabs, type TopTab } from "../navigation/tabs";

export type ResolvedWorkspaceRoute = {
  route: WorkspaceSubdomainRoute;
  workspace: DispatchWorkspaceDefinition;
};

export type WorkspaceNavigationIntent = {
  source: "subdomain" | "fallback";
  host: string;
  workspaceId: DispatchWorkspaceId;
  topTab: TopTab;
  sameNextProject: true;
  separateBackend: false;
  separateDatabase: false;
};

export type WorkspaceSubdomainRouteIssueCode =
  | "duplicate_host"
  | "workspace_missing"
  | "top_tab_missing"
  | "top_tab_hidden";

export type WorkspaceSubdomainRouteIssue = {
  code: WorkspaceSubdomainRouteIssueCode;
  host: string;
  message: string;
};

export type WorkspaceTopTabIssueCode = "workspace_top_tab_missing" | "workspace_top_tab_hidden";

export type WorkspaceTopTabIssue = {
  code: WorkspaceTopTabIssueCode;
  workspaceId: DispatchWorkspaceId;
  topTab: TopTab;
  message: string;
};

export function normalizeWorkspaceHost(host: string) {
  const primaryHost = host.split(",")[0]?.trim().toLowerCase() ?? "";
  return primaryHost.replace(/^https?:\/\//, "").split(":")[0] ?? "";
}

export function resolveWorkspaceRouteByHost(host: string) {
  const normalizedHost = normalizeWorkspaceHost(host);
  return workspaceSubdomainRoutes.find((route) => route.host === normalizedHost) ?? null;
}

export function resolveWorkspaceByHost(host: string): ResolvedWorkspaceRoute | null {
  const route = resolveWorkspaceRouteByHost(host);
  if (!route) return null;

  const workspace = getWorkspaceById(route.workspaceId);
  return workspace ? { route, workspace } : null;
}

export function resolveWorkspaceNavigationIntent(
  host: string,
  fallbackTopTab: TopTab = "home",
): WorkspaceNavigationIntent {
  const resolved = resolveWorkspaceByHost(host);
  if (resolved) {
    return createNavigationIntent("subdomain", normalizeWorkspaceHost(host), resolved.route.workspaceId, resolved.route.topTab);
  }

  const fallbackBridge = getLegacyWorkspaceTopTabBridge(fallbackTopTab);
  if (fallbackBridge) {
    return createNavigationIntent(
      "fallback",
      normalizeWorkspaceHost(host),
      fallbackBridge.workspaceId,
      fallbackBridge.topTab,
    );
  }

  const fallbackWorkspace = getWorkspaceByTopTab(fallbackTopTab) ?? getWorkspaceById("home");
  return createNavigationIntent(
    "fallback",
    normalizeWorkspaceHost(host),
    fallbackWorkspace?.id ?? "home",
    fallbackWorkspace?.topTab ?? "home",
  );
}

export function validateWorkspaceSubdomainRoutes(
  routes: readonly WorkspaceSubdomainRoute[] = workspaceSubdomainRoutes,
): WorkspaceSubdomainRouteIssue[] {
  const issues: WorkspaceSubdomainRouteIssue[] = [];
  const seenHosts = new Set<string>();
  const visibleTopTabs = new Map(defaultTopTabs.map((tab) => [tab.id, tab.visible]));

  for (const route of routes) {
    const normalizedHost = normalizeWorkspaceHost(route.host);
    if (seenHosts.has(normalizedHost)) {
      issues.push({
        code: "duplicate_host",
        host: normalizedHost,
        message: "Workspace subdomain route host must be unique.",
      });
    }
    seenHosts.add(normalizedHost);

    if (!getWorkspaceById(route.workspaceId)) {
      issues.push({
        code: "workspace_missing",
        host: normalizedHost,
        message: "Workspace subdomain route references an unknown workspace.",
      });
    }

    if (!visibleTopTabs.has(route.topTab as never)) {
      issues.push({
        code: "top_tab_missing",
        host: normalizedHost,
        message: "Workspace subdomain route references an unknown top tab.",
      });
    } else if (!visibleTopTabs.get(route.topTab as never)) {
      issues.push({
        code: "top_tab_hidden",
        host: normalizedHost,
        message: "Workspace subdomain route references a hidden top tab.",
      });
    }
  }

  return issues;
}

export function validateWorkspaceTopTabRoutes(
  workspaces: readonly DispatchWorkspaceDefinition[] = dispatchServiceWorkspaces,
  topTabs: readonly Pick<(typeof defaultTopTabs)[number], "id" | "visible">[] = defaultTopTabs,
): WorkspaceTopTabIssue[] {
  const visibleTopTabs = new Map(topTabs.map((tab) => [tab.id, tab.visible]));

  return workspaces.flatMap((workspace): WorkspaceTopTabIssue[] => {
    if (!visibleTopTabs.has(workspace.topTab as never)) {
      return [{
        code: "workspace_top_tab_missing",
        workspaceId: workspace.id,
        topTab: workspace.topTab,
        message: "Workspace references an unknown top tab.",
      }];
    }

    if (!visibleTopTabs.get(workspace.topTab as never)) {
      return [{
        code: "workspace_top_tab_hidden",
        workspaceId: workspace.id,
        topTab: workspace.topTab,
        message: "Workspace references a hidden top tab.",
      }];
    }

    return [];
  });
}

function createNavigationIntent(
  source: WorkspaceNavigationIntent["source"],
  host: string,
  workspaceId: DispatchWorkspaceId,
  topTab: TopTab,
): WorkspaceNavigationIntent {
  return {
    source,
    host,
    workspaceId,
    topTab,
    sameNextProject: true,
    separateBackend: false,
    separateDatabase: false,
  };
}
