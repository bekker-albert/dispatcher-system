import {
  getModuleHandlerImplementationPlanEntry,
  type ModuleHandlerImplementationPlanEntry,
} from "../../domain/data-access/moduleHandlerImplementationPlan";
import {
  createLiveModuleDatabaseHandlersFromRegistrations,
  getLiveModuleDatabaseHandlerRegistrationIssues,
  type LiveModuleDatabaseHandlerFactoryKind,
  type LiveModuleDatabaseHandlerRegistration,
  type LiveModuleDatabaseHandlerRegistrationIssue,
} from "./module-live-handlers";
import {
  createMysqlLiveModuleDetailReadModelHandler,
  createMysqlLiveModuleListReadModelHandler,
} from "./mysql-read-model-handlers";

export type MysqlReadModelLiveHandlerRegistrationCandidateIssueCode =
  | "missing_implementation_plan"
  | "unsupported_contract_kind"
  | LiveModuleDatabaseHandlerRegistrationIssue["code"];

export type MysqlReadModelLiveHandlerRegistrationCandidateReview = {
  resource: string;
  databaseAction: string;
  ready: boolean;
  moduleId?: string;
  workspaceId?: ModuleHandlerImplementationPlanEntry["workspaceId"];
  contractKind?: ModuleHandlerImplementationPlanEntry["contractKind"];
  phase?: ModuleHandlerImplementationPlanEntry["phase"];
  factoryKind?: LiveModuleDatabaseHandlerFactoryKind;
  implementationPath: string;
  issues: MysqlReadModelLiveHandlerRegistrationCandidateIssueCode[];
  registration?: LiveModuleDatabaseHandlerRegistration;
  registrationSummary?: Omit<LiveModuleDatabaseHandlerRegistration, "handler">;
};

const defaultMysqlReadModelImplementationPath = "lib/server/database/module-live-handlers.ts";

function getReadModelFactoryKind(entry: ModuleHandlerImplementationPlanEntry): "list" | "detail" | undefined {
  if (entry.phase !== "read-model") return undefined;
  if (entry.contractKind === "list" || entry.contractKind === "detail") return entry.contractKind;

  return undefined;
}

function createHandlerForFactoryKind(factoryKind: "list" | "detail") {
  return factoryKind === "list"
    ? createMysqlLiveModuleListReadModelHandler()
    : createMysqlLiveModuleDetailReadModelHandler();
}

export function createMysqlReadModelLiveHandlerRegistrationCandidate(input: {
  resource: string;
  databaseAction: string;
  implementationPath?: string;
}): LiveModuleDatabaseHandlerRegistration | undefined {
  const entry = getModuleHandlerImplementationPlanEntry(input.resource, input.databaseAction);
  if (!entry) return undefined;

  const factoryKind = getReadModelFactoryKind(entry);
  if (!factoryKind) return undefined;

  return {
    resource: input.resource,
    databaseAction: input.databaseAction,
    factoryKind,
    implementationPath: input.implementationPath ?? defaultMysqlReadModelImplementationPath,
    handler: createHandlerForFactoryKind(factoryKind),
  };
}

export function reviewMysqlReadModelLiveHandlerRegistrationCandidate(input: {
  resource: string;
  databaseAction: string;
  implementationPath?: string;
}): MysqlReadModelLiveHandlerRegistrationCandidateReview {
  const entry = getModuleHandlerImplementationPlanEntry(input.resource, input.databaseAction);
  const registration = createMysqlReadModelLiveHandlerRegistrationCandidate(input);
  const registrationIssues = registration
    ? getLiveModuleDatabaseHandlerRegistrationIssues([registration], [{
        resource: input.resource,
        databaseAction: input.databaseAction,
      }])
    : [];
  const issues: MysqlReadModelLiveHandlerRegistrationCandidateIssueCode[] = [
    ...(!entry ? ["missing_implementation_plan" as const] : []),
    ...(entry && !getReadModelFactoryKind(entry) ? ["unsupported_contract_kind" as const] : []),
    ...registrationIssues.map((issue) => issue.code),
  ];

  if (registration && issues.length === 0) {
    createLiveModuleDatabaseHandlersFromRegistrations([registration], [{
      resource: input.resource,
      databaseAction: input.databaseAction,
    }]);
  }

  return {
    resource: input.resource,
    databaseAction: input.databaseAction,
    ready: issues.length === 0,
    moduleId: entry?.moduleId,
    workspaceId: entry?.workspaceId,
    contractKind: entry?.contractKind,
    phase: entry?.phase,
    factoryKind: registration?.factoryKind,
    implementationPath: registration?.implementationPath
      ?? input.implementationPath
      ?? defaultMysqlReadModelImplementationPath,
    issues,
    ...(registration ? {
      registration,
      registrationSummary: {
        resource: registration.resource,
        databaseAction: registration.databaseAction,
        factoryKind: registration.factoryKind,
        implementationPath: registration.implementationPath,
      },
    } : {}),
  };
}
