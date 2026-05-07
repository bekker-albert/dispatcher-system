import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { getMysqlConfig, type MysqlConfig } from "../lib/server/mysql/config";

type CliOptions = {
  allowProduction: boolean;
  confirm: boolean;
  help: boolean;
};

function parseCliOptions(argv: string[]): CliOptions {
  return {
    allowProduction: argv.includes("--allow-production"),
    confirm: argv.includes("--confirm"),
    help: argv.includes("--help") || argv.includes("-h"),
  };
}

function printUsage() {
  console.log([
    "Usage: npm run migrate:supabase-to-mysql -- --confirm [--allow-production]",
    "",
    "Required flags:",
    "  --confirm           Acknowledge that this script writes into MySQL.",
    "",
    "Optional flags:",
    "  --allow-production  Permit running against production or other non-local MySQL targets.",
    "  --help              Show this message.",
  ].join("\n"));
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

function isProductionEnvironment() {
  return [
    process.env.NODE_ENV,
    process.env.APP_ENV,
    process.env.ENVIRONMENT,
    process.env.VERCEL_ENV,
  ].some((value) => value?.toLowerCase() === "production");
}

function normalizeMysqlHost(host: string) {
  return host.trim().toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

function isLocalMysqlHost(host: string) {
  const normalizedHost = normalizeMysqlHost(host);
  return (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "::1" ||
    normalizedHost === "0.0.0.0"
  );
}

function targetRequiresProductionFlag(config: MysqlConfig) {
  return isProductionEnvironment() || !isLocalMysqlHost(config.host);
}

function enforceSafetyGuards(options: CliOptions) {
  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (!options.confirm) {
    console.error("Refusing to run without --confirm. This script writes Supabase data into MySQL.");
    printUsage();
    process.exit(1);
  }

  const mysqlConfig = getMysqlConfig();

  if (targetRequiresProductionFlag(mysqlConfig) && !options.allowProduction) {
    console.error(
      `Refusing to run against MySQL target ${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database} without --allow-production.`,
    );
    printUsage();
    process.exit(1);
  }
}

const cliOptions = parseCliOptions(process.argv.slice(2));
loadDotEnvLocal();
enforceSafetyGuards(cliOptions);
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

async function closeConnections() {
  const { closeMysqlPool } = await import("../lib/server/mysql/connection");
  await closeMysqlPool();
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

run()
  .then(closeConnections)
  .catch(async (error) => {
    console.error(sanitizedErrorMessage(error));
    await closeConnections().catch(() => undefined);
    process.exit(1);
  });
