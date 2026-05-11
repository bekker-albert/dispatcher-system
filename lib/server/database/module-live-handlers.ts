import {
  getModuleLiveHandlerStatus,
  listConfiguredLiveModuleHandlerKeys,
  type ModuleLiveHandlerKey,
} from "../../domain/data-access/moduleLiveHandlerRegistry";
import type { DispatchWorkspaceId } from "../../domain/workspaces/workspaces";
import { getGuardedLiveModuleHandlerFactoryKind } from "./module-handler-factories";
import type { DatabaseJsonResponse, DatabaseRequest } from "./types";

export const liveModuleHandlerMissingCode = "live_module_handler_missing";
export const liveModuleHandlerBlockedCode = "live_module_handler_blocked";

export type LiveModuleDatabaseHandlerContext = {
  resource: string;
  action: string;
  payload?: unknown;
  request: Request;
  json: DatabaseJsonResponse;
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
};

export type LiveModuleDatabaseHandler = (
  context: LiveModuleDatabaseHandlerContext,
) => Promise<Response | undefined> | Response | undefined;

export type LiveModuleDatabaseHandlers = Record<string, LiveModuleDatabaseHandler>;
export type LiveModuleDatabaseHandlerFactoryKind =
  | "list"
  | "detail"
  | "create"
  | "patch"
  | "export"
  | "import-batch"
  | "import-validation";

export type LiveModuleDatabaseHandlerRegistration = ModuleLiveHandlerKey & {
  factoryKind: LiveModuleDatabaseHandlerFactoryKind;
  implementationPath: string;
  handler: LiveModuleDatabaseHandler;
};

export type LiveModuleDatabaseHandlerRegistrationIssue = ModuleLiveHandlerKey & {
  code:
    | "duplicate_live_handler_registration"
    | "handler_factory_guard_required"
    | "handler_factory_kind_mismatch"
    | "implementation_path_required"
    | "live_key_without_registration"
    | "registration_without_live_key"
    | "unknown_factory_kind";
};

export class LiveModuleDatabaseHandlerRegistrationError extends Error {
  constructor(readonly issues: readonly LiveModuleDatabaseHandlerRegistrationIssue[]) {
    super(`Live module handler registrations are invalid: ${issues.map((issue) => (
      `${issue.resource}/${issue.databaseAction}:${issue.code}`
    )).join(", ")}`);
    this.name = "LiveModuleDatabaseHandlerRegistrationError";
  }
}

const liveModuleDatabaseHandlerRegistrations: readonly LiveModuleDatabaseHandlerRegistration[] = [];

const factoryKinds: readonly LiveModuleDatabaseHandlerFactoryKind[] = [
  "list",
  "detail",
  "create",
  "patch",
  "export",
  "import-batch",
  "import-validation",
];

const liveModuleDatabaseHandlers = createLiveModuleDatabaseHandlersFromRegistrations(
  liveModuleDatabaseHandlerRegistrations,
);

export function createLiveModuleHandlerKey(resource: string, databaseAction: string) {
  return `${resource}:${databaseAction}`;
}

export function listRegisteredLiveModuleDatabaseHandlerKeys(
  handlers: LiveModuleDatabaseHandlers = liveModuleDatabaseHandlers,
): ModuleLiveHandlerKey[] {
  return Object.keys(handlers).map((key) => {
    const [resource = "", databaseAction = ""] = key.split(":");
    return { resource, databaseAction };
  });
}

export function listLiveModuleDatabaseHandlerRegistrations(
  registrations: readonly LiveModuleDatabaseHandlerRegistration[] = liveModuleDatabaseHandlerRegistrations,
) {
  return [...registrations];
}

export function createLiveModuleDatabaseHandlersFromRegistrations(
  registrations: readonly LiveModuleDatabaseHandlerRegistration[] = liveModuleDatabaseHandlerRegistrations,
  liveHandlerKeys: readonly ModuleLiveHandlerKey[] = listConfiguredLiveModuleHandlerKeys(),
): LiveModuleDatabaseHandlers {
  const issues = getLiveModuleDatabaseHandlerRegistrationIssues(registrations, liveHandlerKeys);
  if (issues.length > 0) {
    throw new LiveModuleDatabaseHandlerRegistrationError(issues);
  }

  return Object.fromEntries(
    registrations.map((registration) => [
      createLiveModuleHandlerKey(registration.resource, registration.databaseAction),
      registration.handler,
    ]),
  );
}

export function getLiveModuleDatabaseHandlerRegistrationIssues(
  registrations: readonly LiveModuleDatabaseHandlerRegistration[] = liveModuleDatabaseHandlerRegistrations,
  liveHandlerKeys: readonly ModuleLiveHandlerKey[] = listConfiguredLiveModuleHandlerKeys(),
): LiveModuleDatabaseHandlerRegistrationIssue[] {
  const seenKeys = new Set<string>();
  const registrationKeys = new Set(registrations.map((registration) => (
    createLiveModuleHandlerKey(registration.resource, registration.databaseAction)
  )));
  const liveKeys = new Set(liveHandlerKeys.map((key) => (
    createLiveModuleHandlerKey(key.resource, key.databaseAction)
  )));
  const missingRegistrationIssues = liveHandlerKeys.flatMap((key): LiveModuleDatabaseHandlerRegistrationIssue[] => (
    registrationKeys.has(createLiveModuleHandlerKey(key.resource, key.databaseAction))
      ? []
      : [{
          resource: key.resource,
          databaseAction: key.databaseAction,
          code: "live_key_without_registration",
        }]
  ));

  const registrationIssues = registrations.flatMap((registration): LiveModuleDatabaseHandlerRegistrationIssue[] => {
    const key = createLiveModuleHandlerKey(registration.resource, registration.databaseAction);
    const issues: LiveModuleDatabaseHandlerRegistrationIssue[] = [];

    if (!liveKeys.has(key)) {
      issues.push({
        resource: registration.resource,
        databaseAction: registration.databaseAction,
        code: "registration_without_live_key",
      });
    }

    if (seenKeys.has(key)) {
      issues.push({
        resource: registration.resource,
        databaseAction: registration.databaseAction,
        code: "duplicate_live_handler_registration",
      });
    }
    seenKeys.add(key);

    if (!registration.implementationPath.trim()) {
      issues.push({
        resource: registration.resource,
        databaseAction: registration.databaseAction,
        code: "implementation_path_required",
      });
    }

    if (!factoryKinds.includes(registration.factoryKind)) {
      issues.push({
        resource: registration.resource,
        databaseAction: registration.databaseAction,
        code: "unknown_factory_kind",
      });
    } else {
      const guardedFactoryKind = getGuardedLiveModuleHandlerFactoryKind(registration.handler);
      if (!guardedFactoryKind) {
        issues.push({
          resource: registration.resource,
          databaseAction: registration.databaseAction,
          code: "handler_factory_guard_required",
        });
      } else if (guardedFactoryKind !== registration.factoryKind) {
        issues.push({
          resource: registration.resource,
          databaseAction: registration.databaseAction,
          code: "handler_factory_kind_mismatch",
        });
      }
    }

    return issues;
  });

  return [...missingRegistrationIssues, ...registrationIssues];
}

export async function tryHandleLiveModuleDatabaseAction(
  body: DatabaseRequest,
  request: Request,
  json: DatabaseJsonResponse,
  handlers: LiveModuleDatabaseHandlers = liveModuleDatabaseHandlers,
  liveHandlerKeys: readonly ModuleLiveHandlerKey[] = listConfiguredLiveModuleHandlerKeys(),
) {
  if (!body.resource || !body.action) return undefined;

  const liveHandler = getModuleLiveHandlerStatus(body.resource, body.action, liveHandlerKeys);
  if (!liveHandler || liveHandler.status !== "live") return undefined;

  if (!liveHandler.readyToConnectHandler || liveHandler.activationIssues.length > 0) {
    return json({
      error: "Live module handler is blocked by activation guardrails.",
      code: liveModuleHandlerBlockedCode,
      moduleId: liveHandler.moduleId,
      workspaceId: liveHandler.workspaceId,
      activationIssues: liveHandler.activationIssues,
    }, 409);
  }

  const handler = handlers[createLiveModuleHandlerKey(body.resource, body.action)];
  if (!handler) {
    return json({
      error: "Module handler is marked live but no server handler is registered.",
      code: liveModuleHandlerMissingCode,
      moduleId: liveHandler.moduleId,
      workspaceId: liveHandler.workspaceId,
    }, 501);
  }

  return await handler({
    resource: body.resource,
    action: body.action,
    payload: body.payload,
    request,
    json,
    moduleId: liveHandler.moduleId,
    workspaceId: liveHandler.workspaceId,
  });
}
