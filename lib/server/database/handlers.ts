import { handleAppStateDatabaseAction } from "./app-state";
import { handlePtoDatabaseAction } from "./pto";
import { handleSettingsDatabaseAction } from "./settings";
import type { DatabaseResourceHandler } from "./types";
import { handleVehiclesDatabaseAction } from "./vehicles";

export const databaseResourceHandlers: Record<string, DatabaseResourceHandler> = {
  "app-state": handleAppStateDatabaseAction,
  pto: handlePtoDatabaseAction,
  settings: handleSettingsDatabaseAction,
  vehicles: handleVehiclesDatabaseAction,
};
