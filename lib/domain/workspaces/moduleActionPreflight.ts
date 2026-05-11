import {
  getModuleActionRequiredCapability,
  type WorkspaceModuleAccessAction,
} from "../access-control/moduleAccessPolicies";
import type { EffectiveAccessDecision } from "../access-control/effectivePermissions";
import { hasAccessCapability } from "../access-control/effectivePermissions";
import type { ServerPageQuery } from "../data-access/pagination";
import { validateServerPageQueryPolicy } from "../data-access/queryPolicy";
import {
  getModuleDataRouteAction,
  getModuleDataRouteContract,
  type ModuleDataRouteContract,
} from "../data-access/moduleDataRoutes";
import {
  getModuleExportPlan,
  validateModuleExportQuery,
} from "../data-access/moduleExportPlans";
import { getModulePersistenceContract, type ModulePersistenceContract } from "../data-access/persistenceContracts";
import { getWorkspaceModuleQueryPolicy } from "../data-access/workspaceQueryPolicies";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";
import { workspaceModuleCatalog } from "./moduleCatalog";

export type WorkspaceModuleActionPreflightCode =
  | "module_not_found"
  | "action_not_supported"
  | "access_denied"
  | "missing_data_route_contract"
  | "database_action_not_registered"
  | "missing_persistence_contract"
  | "patch_contract_invalid"
  | "query_policy_missing"
  | "query_required"
  | "query_rejected"
  | "export_plan_missing"
  | "export_query_rejected";

export type WorkspaceModuleActionPreflightFailure = {
  code: WorkspaceModuleActionPreflightCode;
  message: string;
  field?: string;
};

export type WorkspaceModuleActionPreflightInput = {
  moduleId: string;
  action: WorkspaceModuleAccessAction;
  access: EffectiveAccessDecision;
  query?: ServerPageQuery;
  requireQuery?: boolean;
};

export type WorkspaceModuleActionPreflightResult = {
  ok: true;
  moduleItem: WorkspaceModuleCatalogItem;
  persistenceContract: ModulePersistenceContract;
  dataRouteContract: ModuleDataRouteContract;
  databaseEndpoint: ModuleDataRouteContract["endpoint"];
  databaseResource: ModuleDataRouteContract["resource"];
  databaseAction: string;
} | {
  ok: false;
  moduleItem?: WorkspaceModuleCatalogItem;
  failures: WorkspaceModuleActionPreflightFailure[];
};

const queryActions: WorkspaceModuleAccessAction[] = ["list", "export"];
const writeActions: WorkspaceModuleAccessAction[] = ["create", "edit", "approve", "delete", "admin"];
const patchWriteModes: Array<ModulePersistenceContract["writeMode"]> = [
  "versioned-patch",
  "workflow-patch",
];

function shouldRequireQuery(
  input: WorkspaceModuleActionPreflightInput,
  module?: WorkspaceModuleCatalogItem,
) {
  if (input.requireQuery !== undefined) return input.requireQuery;
  return Boolean(module && queryActions.includes(input.action) && module.tableStrategy !== "none");
}

function isPatchContractInvalid(
  action: WorkspaceModuleAccessAction,
  contract: ModulePersistenceContract,
) {
  return writeActions.includes(action)
    && patchWriteModes.includes(contract.writeMode)
    && (!contract.versioned || !contract.patchOnly || !contract.writesChangeHistory);
}

export function preflightWorkspaceModuleAction(
  input: WorkspaceModuleActionPreflightInput,
): WorkspaceModuleActionPreflightResult {
  const moduleItem = workspaceModuleCatalog.find((item) => item.id === input.moduleId);
  const failures: WorkspaceModuleActionPreflightFailure[] = [];

  if (!moduleItem) {
    return {
      ok: false,
      failures: [{
        code: "module_not_found",
        message: "Workspace module is not registered in the module catalog.",
        field: "moduleId",
      }],
    };
  }

  const requiredCapability = getModuleActionRequiredCapability(input.moduleId, input.action);
  if (!requiredCapability) {
    failures.push({
      code: "action_not_supported",
      message: "Workspace module action is not allowed by the module access policy.",
      field: "action",
    });
  } else if (!hasAccessCapability(input.access, requiredCapability)) {
    failures.push({
      code: "access_denied",
      message: "Current effective access does not include the required capability.",
      field: requiredCapability,
    });
  }

  const persistenceContract = getModulePersistenceContract(input.moduleId);
  const dataRouteContract = getModuleDataRouteContract(input.moduleId);
  const databaseAction = getModuleDataRouteAction(input.moduleId, input.action);

  if (!dataRouteContract) {
    failures.push({
      code: "missing_data_route_contract",
      message: "Workspace module has no shared database route contract.",
      field: "moduleId",
    });
  } else if (requiredCapability && !databaseAction) {
    failures.push({
      code: "database_action_not_registered",
      message: "Workspace module action has no registered shared database action.",
      field: "action",
    });
  }

  if (!persistenceContract) {
    failures.push({
      code: "missing_persistence_contract",
      message: "Workspace module has no persistence contract.",
      field: "moduleId",
    });
  } else if (isPatchContractInvalid(input.action, persistenceContract)) {
    failures.push({
      code: "patch_contract_invalid",
      message: "Patch/workflow action requires versioned, patch-only persistence with change history.",
      field: "persistenceContract",
    });
  }

  if (shouldRequireQuery(input, moduleItem)) {
    const queryPolicy = getWorkspaceModuleQueryPolicy(input.moduleId);
    if (!queryPolicy) {
      failures.push({
        code: "query_policy_missing",
        message: "Server-backed action requires a bounded query policy.",
        field: "queryPolicy",
      });
    } else if (!input.query) {
      failures.push({
        code: "query_required",
        message: "Server-backed action requires a normalized bounded query.",
        field: "query",
      });
    } else {
      const queryIssues = validateServerPageQueryPolicy(input.query, queryPolicy.policy);
      failures.push(...queryIssues.map((issue) => ({
        code: "query_rejected" as const,
        message: issue.message,
        field: issue.field,
      })));
    }
  }

  if (input.action === "export") {
    const exportPlan = getModuleExportPlan(input.moduleId);
    if (!exportPlan) {
      failures.push({
        code: "export_plan_missing",
        message: "Workspace module export action has no bounded export plan.",
        field: "moduleId",
      });
    } else if (input.query) {
      failures.push(...validateModuleExportQuery(exportPlan, input.query).map((issue) => ({
        code: "export_query_rejected" as const,
        message: issue.message,
        field: issue.field,
      })));
    }
  }

  if (failures.length > 0 || !persistenceContract || !dataRouteContract || !databaseAction) {
    return { ok: false, moduleItem, failures };
  }

  return {
    ok: true,
    moduleItem,
    persistenceContract,
    dataRouteContract,
    databaseEndpoint: dataRouteContract.endpoint,
    databaseResource: dataRouteContract.resource,
    databaseAction,
  };
}
