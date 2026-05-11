import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { listConfiguredLiveModuleHandlerKeys } from "../lib/domain/data-access/moduleLiveHandlerRegistry";
import { listLiveModuleDatabaseHandlerRegistrations } from "../lib/server/database/module-live-handlers";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");

function readSource(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function walkRouteFiles(startPath: string): string[] {
  const stats = statSync(startPath);
  if (stats.isFile()) return basename(startPath) === "route.ts" ? [startPath] : [];
  if (!stats.isDirectory()) return [];

  return readdirSync(startPath).flatMap((entryName) => walkRouteFiles(join(startPath, entryName)));
}

function walkFiles(startPath: string): string[] {
  const stats = statSync(startPath);
  if (stats.isFile()) return [startPath];
  if (!stats.isDirectory()) return [];

  return readdirSync(startPath).flatMap((entryName) => walkFiles(join(startPath, entryName)));
}

function toRepoPath(path: string) {
  return relative(root, path).replace(/\\/g, "/");
}

const useAppStateBundleSource = readSource("features/app/useAppStateBundle.ts");
const appApiRoot = resolve(root, "app", "api");
const schemaDefinitionsSource = readSource("lib/server/mysql/schema-definitions.ts");
const vehiclesDatabaseHandlerSource = readSource("lib/server/database/vehicles.ts");
const adminNavigationSource = readSource("lib/domain/admin/navigation.ts");
const analyzerSource = readSource("scripts/analyze-vehicle-core-migration.mjs");
const previewBackfillSource = readSource("scripts/preview-vehicle-core-backfill.mjs");
const cleanupPreviewSource = readSource("scripts/preview-vehicle-data-cleanup.mjs");
const draftMigrationsDoc = readSource("docs/ERP_CORE_DRAFT_MIGRATIONS.md");
const compatibilityDoc = readSource("docs/ERP_VEHICLE_COMPATIBILITY_READ_MODEL.md");
const accessPlanDoc = readSource("docs/ERP_ACCESS_MATRIX_SERVER_PLAN.md");
const sectionMappingDoc = readSource("docs/ERP_SECTION_MAPPING_DRAFT.md");
const sectionMappingDraft = readSource("data/erp-section-mapping.draft.json");
const sectionsSeedDraft = readSource("data/erp-sections.seed.draft.json");
const normalizationRulesDoc = readSource("docs/ERP_VEHICLE_DATA_NORMALIZATION_RULES.md");
const minimalAccessMatrixDoc = readSource("docs/ERP_MINIMAL_ACCESS_MATRIX_DRAFT.md");
const mysqlDryRunChecklistDoc = readSource("docs/ERP_MYSQL_DRY_RUN_CHECKLIST.md");
const runtimeSourceFiles = ["app", "components", "features", "lib", "shared"]
  .flatMap((folder) => {
    const folderPath = resolve(root, folder);
    return existsSync(folderPath) ? walkFiles(folderPath) : [];
  })
  .filter((filePath) => /\.[cm]?[jt]sx?$/.test(filePath));
const runtimeSource = runtimeSourceFiles.map((filePath) => readFileSync(filePath, "utf8")).join("\n");

const forbiddenBundleStateNames = [
  "vehicleCards",
  "vehicleStatusHistory",
  "vehicleSectionHistory",
  "vehicleDocuments",
  "vehicleContractLinks",
  "vehicleGpsLinks",
  "sections",
  "sectionSchedules",
  "sectionManagers",
  "erpRoles",
  "erpRolePermissions",
  "erpUserPermissions",
  "erpUserSectionScope",
] as const;

for (const stateName of forbiddenBundleStateNames) {
  assert.doesNotMatch(
    useAppStateBundleSource,
    new RegExp(`\\b${stateName}\\b`),
    "ERP core arrays must not be added to useAppStateBundle.",
  );
}

const allowedTopLevelApiFolders = new Set(["auth", "database"]);
const topLevelApiFolders = readdirSync(appApiRoot)
  .filter((entryName) => statSync(join(appApiRoot, entryName)).isDirectory())
  .sort();
assert.deepEqual(
  topLevelApiFolders.filter((entryName) => !allowedTopLevelApiFolders.has(entryName)),
  [],
  "ERP core prep must not create app/api/<module> routes.",
);

const routeFiles = walkRouteFiles(appApiRoot).map(toRepoPath).sort();
assert.deepEqual(
  routeFiles.filter((routePath) => !routePath.startsWith("app/api/auth/") && routePath !== "app/api/database/route.ts"),
  [],
  "Only auth routes and the shared app/api/database/route.ts are allowed.",
);

assert.match(schemaDefinitionsSource, /CREATE TABLE IF NOT EXISTS vehicles/);
assert.match(schemaDefinitionsSource, /data JSON NOT NULL/);
assert.match(vehiclesDatabaseHandlerSource, /handleVehiclesDatabaseAction/);
assert.match(vehiclesDatabaseHandlerSource, /action === "load"/);
assert.match(vehiclesDatabaseHandlerSource, /action === "savePatch"/);
assert.doesNotMatch(schemaDefinitionsSource, /CREATE TABLE IF NOT EXISTS vehicle_cards/);
assert.doesNotMatch(schemaDefinitionsSource, /CREATE TABLE IF NOT EXISTS erp_roles/);

for (const tableName of [
  "sections",
  "section_schedules",
  "section_managers",
  "section_user_scope",
  "vehicle_cards",
  "vehicle_status_history",
  "vehicle_section_history",
  "vehicle_documents",
  "vehicle_contract_links",
  "vehicle_gps_links",
  "erp_roles",
  "erp_user_roles",
  "erp_role_permissions",
  "erp_user_permissions",
  "erp_user_section_scope",
  "erp_access_audit",
  "vehicle_import_batches",
]) {
  assert.match(draftMigrationsDoc, new RegExp(`CREATE TABLE IF NOT EXISTS ${tableName}\\b`));
}

assert.match(draftMigrationsDoc, /Do not run automatically/);
assert.match(draftMigrationsDoc, /Rollback draft ERP core tables only/);
assert.doesNotMatch(draftMigrationsDoc, /DROP TABLE IF EXISTS vehicles\b/i);
assert.doesNotMatch(schemaDefinitionsSource, /ERP core draft migration/);

assert.match(adminNavigationSource, /value: "database"/);

assert.ok(existsSync(resolve(root, "scripts/analyze-vehicle-core-migration.mjs")));
assert.match(analyzerSource, /SELECT[\s\S]*FROM vehicles/i);
assert.match(analyzerSource, /data\/default-vehicles\.json|default-vehicles\.json/);
assert.doesNotMatch(analyzerSource, /\bINSERT\s+INTO\b/i);
assert.doesNotMatch(analyzerSource, /\bUPDATE\s+[a-z_]/i);
assert.doesNotMatch(analyzerSource, /\bDELETE\s+FROM\b/i);
assert.doesNotMatch(analyzerSource, /\bALTER\s+TABLE\b/i);
assert.doesNotMatch(analyzerSource, /\bDROP\s+TABLE\b/i);
assert.doesNotMatch(analyzerSource, /\bTRUNCATE\s+TABLE\b/i);
assert.doesNotMatch(analyzerSource, /\.execute\s*\(/);
assert.match(analyzerSource, /collectSectionCandidates/);
assert.match(analyzerSource, /PTO plan rows/);
assert.match(analyzerSource, /report rows/);
assert.match(analyzerSource, /erp-section-mapping\.draft\.json/);

assert.ok(existsSync(resolve(root, "scripts/preview-vehicle-core-backfill.mjs")));
assert.doesNotMatch(previewBackfillSource, /\bINSERT\b/i);
assert.doesNotMatch(previewBackfillSource, /\bUPDATE\b/i);
assert.doesNotMatch(previewBackfillSource, /\bDELETE\b/i);
assert.doesNotMatch(previewBackfillSource, /\bALTER\b/i);
assert.doesNotMatch(previewBackfillSource, /\bDROP\b/i);
assert.doesNotMatch(previewBackfillSource, /\bTRUNCATE\b/i);
assert.doesNotMatch(previewBackfillSource, /\.execute\s*\(/);
assert.match(previewBackfillSource, /loadVehiclesFromSeed/);
assert.match(previewBackfillSource, /loadVehiclesFromMysql/);
assert.match(previewBackfillSource, /ERP_VEHICLE_CORE_BACKFILL_PREVIEW\.md/);
assert.match(previewBackfillSource, /ERP_VEHICLE_DATA_CLEANUP_PREVIEW\.json/);
assert.match(previewBackfillSource, /backfill blocked/);

assert.ok(existsSync(resolve(root, "scripts/preview-vehicle-data-cleanup.mjs")));
assert.doesNotMatch(cleanupPreviewSource, /\bINSERT\b/i);
assert.doesNotMatch(cleanupPreviewSource, /\bUPDATE\b/i);
assert.doesNotMatch(cleanupPreviewSource, /\bDELETE\b/i);
assert.doesNotMatch(cleanupPreviewSource, /\bALTER\b/i);
assert.doesNotMatch(cleanupPreviewSource, /\bDROP\b/i);
assert.doesNotMatch(cleanupPreviewSource, /\bTRUNCATE\b/i);
assert.doesNotMatch(cleanupPreviewSource, /\.execute\s*\(/);
assert.match(cleanupPreviewSource, /loadVehiclesFromSeed/);
assert.match(cleanupPreviewSource, /loadVehiclesFromMysql/);
assert.match(cleanupPreviewSource, /ERP_VEHICLE_DATA_CLEANUP_PREVIEW\.json/);
assert.doesNotMatch(cleanupPreviewSource, /console\.(log|warn|error)\([^)]*DB_PASSWORD/);

const mysqlDryRunSources = [
  analyzerSource,
  cleanupPreviewSource,
  previewBackfillSource,
  mysqlDryRunChecklistDoc,
].join("\n");
assert.doesNotMatch(mysqlDryRunSources, /console\.(log|warn|error)\([^)]*(password|DB_PASSWORD)/i);

assert.match(sectionMappingDoc, /Candidate sections from PTO/);
assert.match(sectionMappingDoc, /PTO plan rows/);
assert.match(sectionMappingDoc, /Production rule/);
assert.match(sectionMappingDraft, /"runtimeUsage": false/);
assert.match(sectionMappingDraft, /"raw_value"/);
assert.match(sectionMappingDraft, /"value_type"/);
assert.match(sectionMappingDraft, /"section_code"/);
assert.match(sectionsSeedDraft, /"runtimeUsage": false/);
assert.match(sectionsSeedDraft, /"source": "pto_candidate"/);
assert.match(sectionsSeedDraft, /"requires_manual_review": true/);
assert.match(normalizationRulesDoc, /Do not require VIN/);
assert.match(normalizationRulesDoc, /Do not create a unique constraint immediately/);
assert.match(minimalAccessMatrixDoc, /draft only/i);
assert.match(minimalAccessMatrixDoc, /dispatch-chief/);
assert.match(minimalAccessMatrixDoc, /server-side/i);
assert.match(mysqlDryRunChecklistDoc, /DB_NAME/);
assert.match(mysqlDryRunChecklistDoc, /DB_USER/);
assert.match(mysqlDryRunChecklistDoc, /DB_PASSWORD/);
assert.match(mysqlDryRunChecklistDoc, /Do not paste passwords/);
assert.doesNotMatch(runtimeSource, /erp-section-mapping\.draft\.json/);
assert.doesNotMatch(runtimeSource, /erp-sections\.seed\.draft\.json/);
assert.doesNotMatch(runtimeSource, /ERP_MINIMAL_ACCESS_MATRIX_DRAFT/);
assert.doesNotMatch(runtimeSource, /vehicle_cards\s*\(/i);

assert.match(compatibilityDoc, /dual-read/i);
assert.match(compatibilityDoc, /legacy `vehicles`/);
assert.match(compatibilityDoc, /Rollback/);

assert.match(accessPlanDoc, /session cookie/);
assert.match(accessPlanDoc, /tab permissions/);
assert.match(accessPlanDoc, /role\/user\/section\/module\/action|module[\s\S]*action[\s\S]*section_id/);
assert.match(accessPlanDoc, /access policy/);
assert.match(accessPlanDoc, /query policy/);
assert.match(accessPlanDoc, /audit policy/);

assert.deepEqual(listLiveModuleDatabaseHandlerRegistrations(), []);
assert.deepEqual(listConfiguredLiveModuleHandlerKeys(), []);

console.log("ERP core prep guardrails checks passed");
