import type { WorkspaceGuardrailIssue } from "./guardrailTypes";
import {
  dispatchServiceWorkspaces,
  type DispatchWorkspaceDefinition,
  type DispatchWorkspaceId,
} from "./workspaces";
import { validateDispatchWorkspaceRegistry } from "./workspaceRegistry";

export function getWorkspaceRegistryGuardrailIssues(
  workspaceId?: DispatchWorkspaceId,
  workspaces: readonly DispatchWorkspaceDefinition[] = dispatchServiceWorkspaces,
): WorkspaceGuardrailIssue[] {
  return validateDispatchWorkspaceRegistry(workspaces)
    .filter((issue) => workspaceId ? issue.workspaceId === workspaceId : true)
    .map((issue) => ({
      moduleId: `workspace:${issue.workspaceId ?? issue.topTab ?? "registry"}`,
      workspaceId: issue.workspaceId ?? "home",
      code: issue.code,
      severity: "blocker",
      message: issue.message,
    }));
}
