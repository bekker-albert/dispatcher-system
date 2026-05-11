import { mysqlReadModelRowsClient } from "../mysql/read-model-rows";
import {
  createGuardedLiveModuleDetailHandler,
  createGuardedLiveModuleListHandler,
} from "./module-handler-factories";
import type { LiveModuleDatabaseHandler } from "./module-live-handlers";
import {
  createLiveReadModelJsonResponse,
  executeLiveModuleDetailReadModelWithRowsClient,
  executeLiveModuleListReadModelWithRowsClient,
} from "./read-model-executor";

export function createMysqlLiveModuleListReadModelHandler(): LiveModuleDatabaseHandler {
  return createGuardedLiveModuleListHandler(async ({ context, execution }) => {
    const result = await executeLiveModuleListReadModelWithRowsClient(
      execution,
      mysqlReadModelRowsClient,
    );

    return createLiveReadModelJsonResponse(result, context.json);
  });
}

export function createMysqlLiveModuleDetailReadModelHandler(): LiveModuleDatabaseHandler {
  return createGuardedLiveModuleDetailHandler(async ({ context, execution }) => {
    const result = await executeLiveModuleDetailReadModelWithRowsClient(
      execution,
      mysqlReadModelRowsClient,
    );

    return createLiveReadModelJsonResponse(result, context.json);
  });
}
