import { databaseRequest } from "@/lib/database/rpc";
import { loadAppStateFromDatabase, type DataAppState } from "@/lib/data/app-state";
import { serverDatabaseConfigured } from "@/lib/data/config";
import { loadAppSettingsFromDatabase, type DataSettingRecord } from "@/lib/data/settings";

export type DataInitialAppBootstrap = {
  appState: DataAppState | null;
  appStateError?: string;
  settings: DataSettingRecord[];
  settingsError?: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function loadInitialAppBootstrapFromDatabase(keys: string[]): Promise<DataInitialAppBootstrap> {
  if (serverDatabaseConfigured) {
    return await databaseRequest<DataInitialAppBootstrap>("app-state", "load-bootstrap", { keys });
  }

  const [appStateResult, settingsResult] = await Promise.allSettled([
    loadAppStateFromDatabase(),
    loadAppSettingsFromDatabase(keys),
  ]);

  return {
    appState: appStateResult.status === "fulfilled" ? appStateResult.value : null,
    appStateError: appStateResult.status === "rejected" ? errorMessage(appStateResult.reason) : undefined,
    settings: settingsResult.status === "fulfilled" ? settingsResult.value : [],
    settingsError: settingsResult.status === "rejected" ? errorMessage(settingsResult.reason) : undefined,
  };
}
