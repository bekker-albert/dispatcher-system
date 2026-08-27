import { handleAppStateDatabaseAction } from "./app-state";
import { handleDispatchDatabaseAction } from "./dispatch";
import { handlePtoDatabaseAction } from "./pto";
import { handleSettingsDatabaseAction } from "./settings";
import type { DatabaseResourceHandler } from "./types";
import { handleVehiclesDatabaseAction } from "./vehicles";

export const databaseResourceHandlers: Record<string, DatabaseResourceHandler> = {
  "app-state": handleAppStateDatabaseAction,
  dispatch: handleDispatchDatabaseAction,
  pto: handlePtoDatabaseAction,
  settings: handleSettingsDatabaseAction,
  vehicles: handleVehiclesDatabaseAction,
};
