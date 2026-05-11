import type { DispatchWorkspaceId } from "../lib/domain/workspaces/workspaces";
import { getModuleReadModelSchemaRequirement } from "../lib/domain/data-access/moduleReadModelSchemaReadiness";
import { createReadModelSchemaReviewPlan } from "../lib/domain/data-access/readModelSchemaPlan";
import { dispatchServiceWorkspaces, getWorkspaceById } from "../lib/domain/workspaces/workspaces";

type CliOptions = {
  format: "json" | "sql";
  help: boolean;
  moduleId?: string;
  workspaceId?: DispatchWorkspaceId;
};

function printUsage() {
  console.log([
    "Usage: npm run plan:read-model-schema -- [--workspace <workspace-id>] [--module <module-id>] [--sql]",
    "",
    "Prints a review-only MySQL schema plan from read-model contracts.",
    "This command is non-mutating: it does not connect to MySQL, apply migrations, or activate live handlers.",
    "",
    "Options:",
    "  --workspace <id>  Limit the plan to one workspace.",
    "  --module <id>     Limit the plan to one read-model module.",
    "  --sql             Print SQL statements instead of JSON.",
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
    format: argv.includes("--sql") ? "sql" : "json",
    help: argv.includes("--help") || argv.includes("-h"),
    moduleId,
    workspaceId,
  };
}

function printSqlPlan(plan: ReturnType<typeof createReadModelSchemaReviewPlan>) {
  console.log([
    "-- Review-only read-model schema plan.",
    "-- Non-mutating: review before applying manually; this command does not connect to MySQL.",
    "-- Keep live handlers planned-only until schema and activation preflight pass.",
    "",
    ...plan.plans.flatMap((modulePlan) => [
      `-- Module: ${modulePlan.moduleId}; workspace: ${modulePlan.workspaceId}; table: ${modulePlan.tableName}`,
      modulePlan.createTableStatement,
      ...modulePlan.indexStatements,
      "",
    ]),
  ].join("\n"));
}

function run() {
  const options = parseCliOptions(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const plan = createReadModelSchemaReviewPlan({
    moduleId: options.moduleId,
    workspaceId: options.workspaceId,
  });

  if (options.format === "sql") {
    printSqlPlan(plan);
  } else {
    console.log(JSON.stringify(plan, null, 2));
  }

  if (plan.issues.length > 0) process.exitCode = 1;
}

run();
