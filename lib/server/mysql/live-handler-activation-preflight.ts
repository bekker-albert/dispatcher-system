import {
  reviewModuleHandlerActivation,
  type ModuleHandlerActivationCommand,
  type ModuleHandlerActivationReview,
} from "../../domain/data-access/moduleHandlerActivation";
import {
  reviewMysqlReadModelSchemaReadinessForModule,
  type MysqlReadModelSchemaPreflightResult,
} from "./read-model-schema-readiness";
import {
  reviewMysqlReadModelLiveHandlerRegistrationCandidate,
  type MysqlReadModelLiveHandlerRegistrationCandidateReview,
} from "../database/live-handler-registration-review";

export type MysqlLiveHandlerActivationPreflightIssue = {
  source: "activation" | "schema";
  code: string;
};

export type MysqlLiveHandlerActivationPreflightResult = {
  mode: "mysql" | "contract-only";
  ready: boolean;
  liveActivationReady: boolean;
  appliesChanges: false;
  schemaChecked: boolean;
  liveRegistryMutation: false;
  handlerRegistrationMutation: false;
  noLiveRegistrationFromPreflight: true;
  liveActivationGate: {
    ready: boolean;
    activationReady: boolean;
    schemaChecked: boolean;
    schemaReady: boolean;
    registrationCandidateReady: boolean;
    noLiveRegistrationFromPreflight: true;
  };
  activation: ModuleHandlerActivationReview;
  schema?: MysqlReadModelSchemaPreflightResult;
  registrationCandidate?: Omit<MysqlReadModelLiveHandlerRegistrationCandidateReview, "registration">;
  issues: MysqlLiveHandlerActivationPreflightIssue[];
  nextActions: string[];
};

function createNextActions(result: {
  activation: ModuleHandlerActivationReview;
  schema?: MysqlReadModelSchemaPreflightResult;
}) {
  if (result.activation.status !== "ready-to-register") {
    return [
      "Fix activation review blockers before touching the live handler registry.",
    ];
  }

  if (result.schema && !result.schema.ready) {
    return [
      "Apply the missing read-model schema migration or correct the read-model contract.",
    ];
  }

  return [
    "Add exactly one live registry key.",
    "Add the matching guarded server registration.",
    "Run npm run verify.",
    "Smoke the activated action and one planned-only action.",
  ];
}

function omitRegistrationHandler(
  review: MysqlReadModelLiveHandlerRegistrationCandidateReview | undefined,
): Omit<MysqlReadModelLiveHandlerRegistrationCandidateReview, "registration"> | undefined {
  if (!review) return undefined;

  return {
    resource: review.resource,
    databaseAction: review.databaseAction,
    ready: review.ready,
    moduleId: review.moduleId,
    workspaceId: review.workspaceId,
    contractKind: review.contractKind,
    phase: review.phase,
    factoryKind: review.factoryKind,
    implementationPath: review.implementationPath,
    issues: review.issues,
    registrationSummary: review.registrationSummary,
  };
}

export function reviewLiveHandlerActivationContractOnlyPreflight(
  command: ModuleHandlerActivationCommand,
): MysqlLiveHandlerActivationPreflightResult {
  const activation = reviewModuleHandlerActivation(command);
  const registrationCandidate = activation.phase === "read-model"
    ? reviewMysqlReadModelLiveHandlerRegistrationCandidate({
        resource: command.resource,
        databaseAction: command.databaseAction,
        implementationPath: command.implementationPath,
      })
    : undefined;
  const issues: MysqlLiveHandlerActivationPreflightIssue[] = [
    ...activation.issues.map((code) => ({ source: "activation" as const, code })),
    ...(registrationCandidate?.issues.map((code) => ({ source: "activation" as const, code: `registration_${code}` })) ?? []),
    { source: "schema" as const, code: "mysql_schema_not_checked" },
  ];
  const registrationCandidateSummary = omitRegistrationHandler(registrationCandidate);

  return {
    mode: "contract-only",
    ready: false,
    liveActivationReady: false,
    appliesChanges: false,
    schemaChecked: false,
    liveRegistryMutation: false,
    handlerRegistrationMutation: false,
    noLiveRegistrationFromPreflight: true,
    liveActivationGate: {
      ready: false,
      activationReady: activation.status === "ready-to-register",
      schemaChecked: false,
      schemaReady: false,
      registrationCandidateReady: registrationCandidate?.ready ?? false,
      noLiveRegistrationFromPreflight: true,
    },
    activation,
    ...(registrationCandidateSummary ? { registrationCandidate: registrationCandidateSummary } : {}),
    issues,
    nextActions: [
      "Configure DB_NAME, DB_USER and DB_PASSWORD for the target MySQL schema.",
      "Run npm run check:read-model-schema for the target workspace.",
      "Run the full npm run review:live-handler command without --contract-only.",
      "Register nothing from contract-only output.",
    ],
  };
}

export async function reviewMysqlLiveHandlerActivationPreflight(
  command: ModuleHandlerActivationCommand,
): Promise<MysqlLiveHandlerActivationPreflightResult> {
  const activation = reviewModuleHandlerActivation(command);
  const schema = activation.moduleId && activation.phase === "read-model"
    ? await reviewMysqlReadModelSchemaReadinessForModule(activation.moduleId)
    : undefined;
  const registrationCandidate = activation.phase === "read-model"
    ? reviewMysqlReadModelLiveHandlerRegistrationCandidate({
        resource: command.resource,
        databaseAction: command.databaseAction,
        implementationPath: command.implementationPath,
      })
    : undefined;
  const issues: MysqlLiveHandlerActivationPreflightIssue[] = [
    ...activation.issues.map((code) => ({ source: "activation" as const, code })),
    ...(schema?.issues.map((issue) => ({ source: "schema" as const, code: issue.code })) ?? []),
    ...(schema && schema.requirements.length === 0
      ? [{ source: "schema" as const, code: "missing_read_model_schema_requirement" }]
      : []),
    ...(registrationCandidate?.issues.map((code) => ({ source: "activation" as const, code: `registration_${code}` })) ?? []),
  ];
  const ready = activation.status === "ready-to-register"
    && (!schema || schema.ready)
    && (!registrationCandidate || registrationCandidate.ready);
  const registrationCandidateSummary = omitRegistrationHandler(registrationCandidate);

  return {
    mode: "mysql",
    ready,
    liveActivationReady: ready,
    appliesChanges: false,
    schemaChecked: Boolean(schema),
    liveRegistryMutation: false,
    handlerRegistrationMutation: false,
    noLiveRegistrationFromPreflight: true,
    liveActivationGate: {
      ready,
      activationReady: activation.status === "ready-to-register",
      schemaChecked: Boolean(schema),
      schemaReady: schema?.ready ?? false,
      registrationCandidateReady: registrationCandidate?.ready ?? false,
      noLiveRegistrationFromPreflight: true,
    },
    activation,
    schema,
    ...(registrationCandidateSummary ? { registrationCandidate: registrationCandidateSummary } : {}),
    issues,
    nextActions: createNextActions({ activation, schema }),
  };
}
