import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { DispatchWorkspaceId } from "../lib/domain/workspaces/workspaces";
import {
  getModuleReadModelSchemaRequirement,
  getModuleReadModelTableMismatchIssues,
  listModuleReadModelSchemaRequirements,
} from "../lib/domain/data-access/moduleReadModelSchemaReadiness";
import { dispatchServiceWorkspaces, getWorkspaceById } from "../lib/domain/workspaces/workspaces";
import {
  reviewMysqlReadModelSchemaReadiness,
  reviewMysqlReadModelSchemaReadinessForModule,
} from "../lib/server/mysql/read-model-schema-readiness";

type CliOptions = {
  dryRun: boolean;
  help: boolean;
  moduleId?: string;
  workspaceId?: DispatchWorkspaceId;
};

function printUsage() {
  console.log([
    "Usage: npm run check:read-model-schema -- [--workspace <workspace-id>]",
    "",
    "Checks MySQL information_schema against the planned read-model list/detail contracts.",
    "This command is read-only and is intended before activating a live read-model handler.",
    "",
    "Options:",
    "  --workspace <id>  Limit the check to one workspace.",
    "  --module <id>     Limit the check to one read-model module.",
    "  --dry-run         Print planned schema requirements without connecting to MySQL.",
    "  --help            Show this message.",
    "",
    `Workspace ids: ${dispatchServiceWorkspaces.map((workspace) => workspace.id).join(", ")}`,
  ].join("\n"));
}

function parseCliOptions(argv: string[]): CliOptions {
  const workspaceFlagIndex = argv.indexOf("--workspace");
  const workspaceValue = workspaceFlagIndex >= 0 ? argv[workspaceFlagIndex + 1] : undefined;
  const workspaceId = workspaceValue && getWorkspaceById(workspaceValue as DispatchWorkspaceId)
    ? workspaceValue as DispatchWorkspaceId
    : undefined;
  const moduleFlagIndex = argv.indexOf("--module");
  const moduleId = moduleFlagIndex >= 0 ? argv[moduleFlagIndex + 1]?.trim() : undefined;
  const moduleRequirement = moduleId ? getModuleReadModelSchemaRequirement(moduleId) : undefined;

  if (workspaceFlagIndex >= 0 && !workspaceId) {
    console.error(`Unknown workspace id: ${workspaceValue ?? ""}`);
    printUsage();
    process.exit(1);
  }

  if (moduleFlagIndex >= 0 && !moduleRequirement) {
    console.error(`Unknown read-model module id: ${moduleId ?? ""}`);
    printUsage();
    process.exit(1);
  }

  if (workspaceId && moduleRequirement && moduleRequirement.workspaceId !== workspaceId) {
    console.error(`Module ${moduleRequirement.moduleId} belongs to workspace ${moduleRequirement.workspaceId}, not ${workspaceId}`);
    printUsage();
    process.exit(1);
  }

  return {
    dryRun: argv.includes("--dry-run"),
    help: argv.includes("--help") || argv.includes("-h"),
    moduleId,
    workspaceId,
  };
}

function loadDotEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (!(key in process.env)) process.env[key] = value;
  }
}

function sanitizedErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const name = error.name?.trim();
    const message = error.message?.trim() || "Unknown error";
    return name ? `${name}: ${message}` : message;
  }

  if (typeof error === "string") return error;
  return "Unknown error";
}

async function closeConnections() {
  const { closeMysqlPool } = await import("../lib/server/mysql/connection");
  await closeMysqlPool();
}

async function run() {
  const options = parseCliOptions(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  if (options.dryRun) {
    const requirements = getSchemaRequirements(options);
    const contractIssues = getContractIssues(options);
    const payload = {
      moduleId: options.moduleId ?? "all",
      workspaceId: options.workspaceId ?? "all",
      mode: "dry-run",
      schemaChecked: false,
      ready: false,
      requirements: requirements.map((requirement) => ({
        moduleId: requirement.moduleId,
        workspaceId: requirement.workspaceId,
        tableName: requirement.tableName,
        requiredColumns: requirement.requiredColumns,
        listAction: requirement.listAction,
        detailAction: requirement.detailAction,
      })),
      issues: contractIssues,
      nextCommand: options.moduleId
        ? `npm run check:read-model-schema -- --module ${options.moduleId}`
        : options.workspaceId
        ? `npm run check:read-model-schema -- --workspace ${options.workspaceId}`
        : "npm run check:read-model-schema",
    };

    console.log(JSON.stringify(payload, null, 2));
    if (contractIssues.length > 0) process.exitCode = 1;
    return;
  }

  loadDotEnvLocal();
  const result = options.moduleId
    ? await reviewMysqlReadModelSchemaReadinessForModule(options.moduleId)
    : await reviewMysqlReadModelSchemaReadiness(options.workspaceId);
  const payload = {
    moduleId: options.moduleId ?? "all",
    workspaceId: result.workspaceId ?? "all",
    ready: result.ready,
    requirements: result.requirements.map((requirement) => ({
      moduleId: requirement.moduleId,
      workspaceId: requirement.workspaceId,
      tableName: requirement.tableName,
      requiredColumns: requirement.requiredColumns,
      listAction: requirement.listAction,
      detailAction: requirement.detailAction,
    })),
    issues: result.issues,
  };

  console.log(JSON.stringify(payload, null, 2));

  if (!result.ready) {
    process.exitCode = 1;
  }
}

function getSchemaRequirements(options: Pick<CliOptions, "moduleId" | "workspaceId">) {
  if (!options.moduleId) return listModuleReadModelSchemaRequirements(options.workspaceId);

  const requirement = getModuleReadModelSchemaRequirement(options.moduleId);
  return requirement ? [requirement] : [];
}

function getContractIssues(options: Pick<CliOptions, "moduleId" | "workspaceId">) {
  const issues = getModuleReadModelTableMismatchIssues(options.workspaceId);
  return options.moduleId
    ? issues.filter((issue) => issue.moduleId === options.moduleId)
    : issues;
}

run()
  .then(closeConnections)
  .catch(async (error) => {
    console.error(sanitizedErrorMessage(error));
    await closeConnections().catch(() => undefined);
    process.exit(1);
  });
