import type {
  LiveModuleDatabaseHandler,
  LiveModuleDatabaseHandlerContext,
} from "./module-live-handlers";
import {
  createLiveModuleDetailExecutionContext,
  createLiveModuleListExecutionContext,
  type LiveModuleDetailExecutionContext,
  type LiveModuleListExecutionContext,
} from "./module-handler-execution";
import {
  createLiveModuleCreateWriteExecutionContext,
  createLiveModulePatchWriteExecutionContext,
  type LiveModuleCreateWriteExecutionContext,
  type LiveModulePatchWriteExecutionContext,
} from "./module-write-execution";
import {
  createLiveModuleExportExecutionContext,
  createLiveModuleImportBatchExecutionContext,
  createLiveModuleImportValidationExecutionContext,
  type LiveModuleExportExecutionContext,
  type LiveModuleImportBatchExecutionContext,
  type LiveModuleImportValidationExecutionContext,
} from "./module-file-execution";

export const guardedLiveModuleHandlerFactoryNames = [
  "list",
  "detail",
  "create",
  "patch",
  "export",
  "import-batch",
  "import-validation",
] as const;

const guardedLiveModuleHandlerFactoryKindProperty = "__guardedLiveModuleHandlerFactoryKind";

type GuardedLiveModuleDatabaseHandler = LiveModuleDatabaseHandler & {
  readonly [guardedLiveModuleHandlerFactoryKindProperty]?: typeof guardedLiveModuleHandlerFactoryNames[number];
};

export type GuardedLiveModuleHandler<ExecutionContext> = (
  input: {
    context: LiveModuleDatabaseHandlerContext;
    execution: ExecutionContext;
  }
) => ReturnType<LiveModuleDatabaseHandler>;

function tagGuardedLiveModuleHandler(
  factoryKind: typeof guardedLiveModuleHandlerFactoryNames[number],
  handler: LiveModuleDatabaseHandler,
): LiveModuleDatabaseHandler {
  return Object.assign(handler, {
    [guardedLiveModuleHandlerFactoryKindProperty]: factoryKind,
  });
}

export function getGuardedLiveModuleHandlerFactoryKind(
  handler: LiveModuleDatabaseHandler,
) {
  return (handler as GuardedLiveModuleDatabaseHandler)[guardedLiveModuleHandlerFactoryKindProperty];
}

export function createGuardedLiveModuleListHandler(
  handler: GuardedLiveModuleHandler<LiveModuleListExecutionContext>,
): LiveModuleDatabaseHandler {
  return tagGuardedLiveModuleHandler("list", (context) => handler({
    context,
    execution: createLiveModuleListExecutionContext(context),
  }));
}

export function createGuardedLiveModuleDetailHandler(
  handler: GuardedLiveModuleHandler<LiveModuleDetailExecutionContext>,
): LiveModuleDatabaseHandler {
  return tagGuardedLiveModuleHandler("detail", (context) => handler({
    context,
    execution: createLiveModuleDetailExecutionContext(context),
  }));
}

export function createGuardedLiveModuleCreateHandler(
  handler: GuardedLiveModuleHandler<LiveModuleCreateWriteExecutionContext>,
): LiveModuleDatabaseHandler {
  return tagGuardedLiveModuleHandler("create", (context) => handler({
    context,
    execution: createLiveModuleCreateWriteExecutionContext(context),
  }));
}

export function createGuardedLiveModulePatchHandler(
  handler: GuardedLiveModuleHandler<LiveModulePatchWriteExecutionContext>,
): LiveModuleDatabaseHandler {
  return tagGuardedLiveModuleHandler("patch", (context) => handler({
    context,
    execution: createLiveModulePatchWriteExecutionContext(context),
  }));
}

export function createGuardedLiveModuleExportHandler(
  handler: GuardedLiveModuleHandler<LiveModuleExportExecutionContext>,
): LiveModuleDatabaseHandler {
  return tagGuardedLiveModuleHandler("export", (context) => handler({
    context,
    execution: createLiveModuleExportExecutionContext(context),
  }));
}

export function createGuardedLiveModuleImportBatchHandler(
  handler: GuardedLiveModuleHandler<LiveModuleImportBatchExecutionContext>,
): LiveModuleDatabaseHandler {
  return tagGuardedLiveModuleHandler("import-batch", (context) => handler({
    context,
    execution: createLiveModuleImportBatchExecutionContext(context),
  }));
}

export function createGuardedLiveModuleImportValidationHandler(
  handler: GuardedLiveModuleHandler<LiveModuleImportValidationExecutionContext>,
): LiveModuleDatabaseHandler {
  return tagGuardedLiveModuleHandler("import-validation", (context) => handler({
    context,
    execution: createLiveModuleImportValidationExecutionContext(context),
  }));
}
