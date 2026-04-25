import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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

loadDotEnvLocal();
process.env.NEXT_PUBLIC_DATA_PROVIDER = "";

async function optionalStep<T>(label: string, action: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`${label}: skipped (${message})`);
    return fallback;
  }
}

async function run() {
  const [
    vehiclesSupabase,
    ptoSupabase,
    settingsSupabase,
    appStateSupabase,
    vehiclesMysql,
    ptoMysql,
    settingsMysql,
    appStateMysql,
  ] = await Promise.all([
    import("../lib/supabase/vehicles"),
    import("../lib/supabase/pto"),
    import("../lib/supabase/settings"),
    import("../lib/supabase/app-state"),
    import("../lib/server/mysql/vehicles"),
    import("../lib/server/mysql/pto"),
    import("../lib/server/mysql/settings"),
    import("../lib/server/mysql/app-state"),
  ]);

  const vehicles = await optionalStep("vehicles", () => vehiclesSupabase.loadVehiclesFromSupabase(), null);
  if (vehicles?.rows.length) {
    await vehiclesMysql.replaceVehiclesInMysql(vehicles.rows);
  }

  const pto = await optionalStep("pto", () => ptoSupabase.loadPtoStateFromSupabase(), null);
  if (pto) {
    await ptoMysql.savePtoStateToMysql(pto);
  }

  const settingKeys = [
    "reportCustomers",
    "reportAreaOrder",
    "reportWorkOrder",
    "reportHeaderLabels",
    "reportColumnWidths",
    "reportReasons",
    "areaShiftCutoffs",
    "customTabs",
    "topTabs",
    "subTabs",
  ];
  const settings = await optionalStep("settings", () => settingsSupabase.loadAppSettingsFromSupabase(settingKeys), []);
  if (settings.length) {
    await settingsMysql.saveAppSettingsToMysql(
      Object.fromEntries(settings.map((setting) => [setting.key, setting.value])),
    );
  }

  const appState = await optionalStep("app_state", () => appStateSupabase.loadAppStateFromSupabase(), null);
  if (appState) {
    await appStateMysql.saveAppStateToMysql(appState.storage);
  }

  const snapshots = await optionalStep("client_snapshots", () => appStateSupabase.loadClientAppSnapshotsFromSupabase(), []);
  for (const snapshot of snapshots) {
    await appStateMysql.saveClientAppSnapshotToMysql(snapshot.clientId, snapshot.storage, snapshot.meta);
  }

  console.log(JSON.stringify({
    vehicles: vehicles?.rows.length ?? 0,
    ptoRows: (pto?.planRows.length ?? 0) + (pto?.operRows.length ?? 0) + (pto?.surveyRows.length ?? 0),
    settings: settings.length,
    snapshots: snapshots.length,
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
