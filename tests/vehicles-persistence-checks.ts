import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeVehicleRow } from "../lib/domain/vehicles/defaults";
import { createVehicleRowsSavePlan, shouldBlockVehicleRowsAutoSave } from "../lib/domain/vehicles/persistence";

const testDir = dirname(fileURLToPath(import.meta.url));
const dataVehiclesSource = readFileSync(resolve(testDir, "../lib/data/vehicles.ts"), "utf8");
const databaseVehiclesSource = readFileSync(resolve(testDir, "../lib/server/database/vehicles.ts"), "utf8");
const mysqlVehiclesSource = readFileSync(resolve(testDir, "../lib/server/mysql/vehicles.ts"), "utf8");
const supabaseVehiclesSource = readFileSync(resolve(testDir, "../lib/supabase/vehicles.ts"), "utf8");
const vehicleRowsEditorSource = readFileSync(resolve(testDir, "../features/admin/vehicles/useVehicleRowsEditor.ts"), "utf8");
const initialVehicleRowsSource = readFileSync(resolve(testDir, "../features/admin/vehicles/initialVehicleRows.ts"), "utf8");
const vehicleRowsPersistenceSource = readFileSync(resolve(testDir, "../features/admin/vehicles/useVehicleRowsPersistence.ts"), "utf8");
const vehicleRowsSaveQueueSource = readFileSync(resolve(testDir, "../features/admin/vehicles/vehicleRowsSaveQueue.ts"), "utf8");

function exportedFunctionSource(source: string, name: string) {
  const start = source.indexOf(`export async function ${name}`);
  assert.notEqual(start, -1, `${name} should exist`);

  const nextExport = source.indexOf("\nexport async function", start + 1);
  return source.slice(start, nextExport === -1 ? source.length : nextExport);
}

const mysqlSaveSource = exportedFunctionSource(mysqlVehiclesSource, "saveVehiclesToMysql");
assert.match(mysqlVehiclesSource, /dbTransaction/);
assert.match(mysqlVehiclesSource, /DatabaseConflictError/);
assert.match(mysqlSaveSource, /assertMysqlVehiclesMatchExpectedSnapshot\(options\.expectedSnapshot,\s*execute\)/);
assert.match(mysqlSaveSource, /await upsertVehiclesToMysql\(rows,\s*execute\);/);
assert.doesNotMatch(mysqlSaveSource, /deleteVehiclesMissingFromMysqlSnapshot/);
assert.match(
  mysqlVehiclesSource,
  /async function deleteVehiclesMissingFromMysqlSnapshot[\s\S]*SELECT vehicle_id FROM vehicles[\s\S]*DELETE FROM vehicles WHERE vehicle_id IN/,
);
assert.doesNotMatch(mysqlVehiclesSource, /WHERE vehicle_id NOT IN/);

const mysqlReplaceSource = exportedFunctionSource(mysqlVehiclesSource, "replaceVehiclesInMysql");
assert.match(mysqlReplaceSource, /assertMysqlVehiclesMatchExpectedSnapshot\(options\.expectedSnapshot,\s*execute\)/);
assert.match(mysqlReplaceSource, /dbTransaction/);
assert.match(mysqlReplaceSource, /assertNoUnexpectedLargeVehicleSnapshotShrink\(rows,\s*options\)/);
assert.match(mysqlReplaceSource, /upsertVehiclesToMysql\(rows,\s*execute\)/);
assert.match(mysqlReplaceSource, /deleteVehiclesMissingFromMysqlSnapshot\(rows,\s*execute\)/);
assert.match(mysqlVehiclesSource, /defaultVehicleSeedReplaceLimit/);
assert.match(mysqlVehiclesSource, /function assertNoUnexpectedLargeVehicleSnapshotShrink/);
assert.match(mysqlVehiclesSource, /if \(options\.expectedSnapshot\.length <= defaultVehicleSeedReplaceLimit\) return;/);
assert.match(mysqlVehiclesSource, /if \(rows\.length > defaultVehicleSeedReplaceLimit\) return;/);
assert.match(mysqlVehiclesSource, /vehicleSnapshotKey\(currentRows\) !== vehicleSnapshotKey\(expectedSnapshot\)/);
assert.match(mysqlVehiclesSource, /FOR UPDATE/);

const supabaseSaveSource = exportedFunctionSource(supabaseVehiclesSource, "saveVehiclesToSupabase");
assert.match(supabaseSaveSource, /assertSupabaseVehiclesMatchExpectedSnapshot\(options\.expectedSnapshot\)/);
assert.match(supabaseSaveSource, /await upsertVehiclesToSupabase\(client,\s*records\);/);
assert.doesNotMatch(supabaseSaveSource, /deleteVehiclesMissingFromSupabaseSnapshot/);
assert.equal(supabaseVehiclesSource.includes('.not("vehicle_id", "is", null)'), true);
assert.equal(supabaseVehiclesSource.includes('.not("vehicle_id", "in", `(${vehicleIds.join(",")})`)'), true);

const supabaseReplaceSource = exportedFunctionSource(supabaseVehiclesSource, "replaceVehiclesInSupabase");
assert.match(supabaseReplaceSource, /assertSupabaseVehiclesMatchExpectedSnapshot\(options\.expectedSnapshot\)/);
assert.match(
  supabaseReplaceSource,
  /await upsertVehiclesToSupabase\(client,\s*records\);[\s\S]*await deleteVehiclesMissingFromSupabaseSnapshot\(client,\s*vehicleIds\);/,
);
assert.equal(supabaseReplaceSource.includes('.gte("vehicle_id", 0)'), false);

assert.match(dataVehiclesSource, /saveVehiclesToDatabase\(rows: VehicleRow\[], options\?: VehicleSnapshotWriteOptions\)/);
assert.match(dataVehiclesSource, /replaceVehiclesInDatabase\(rows: VehicleRow\[], options\?: VehicleSnapshotReplaceOptions\)/);
assert.doesNotMatch(dataVehiclesSource, /from ["']@\/lib\/supabase\/vehicles["']/);
assert.match(dataVehiclesSource, /serverDatabaseConfigured/);
assert.match(dataVehiclesSource, /databaseRequest<DataVehiclesState \| null>\("vehicles", "load"\)/);
assert.match(dataVehiclesSource, /allowLargeSnapshotShrink\?: boolean/);
assert.match(dataVehiclesSource, /databaseRequest\("vehicles", "save", \{[\s\S]*rows,[\s\S]*expectedSnapshot: options\?\.expectedSnapshot,[\s\S]*allowLargeSnapshotShrink: options\?\.allowLargeSnapshotShrink/);
assert.match(dataVehiclesSource, /databaseRequest\("vehicles", "savePatch", \{[\s\S]*patchRows,[\s\S]*expectedSnapshot: options\?\.expectedSnapshot,[\s\S]*allowLargeSnapshotShrink: options\?\.allowLargeSnapshotShrink/);
assert.match(dataVehiclesSource, /databaseRequest\("vehicles", "replace", \{[\s\S]*rows,[\s\S]*expectedSnapshot: options\?\.expectedSnapshot,[\s\S]*allowLargeSnapshotShrink: options\?\.allowLargeSnapshotShrink/);
assert.match(dataVehiclesSource, /databaseRequest\("vehicles", "delete", \{ id \}\)/);
assert.match(dataVehiclesSource, /import\("@\/lib\/supabase\/vehicles"\)/);
assert.doesNotMatch(supabaseVehiclesSource, /databaseRequest/);
assert.doesNotMatch(supabaseVehiclesSource, /serverDatabaseConfigured/);
assert.match(databaseVehiclesSource, /function expectedVehicleSnapshotFromPayload/);
assert.match(databaseVehiclesSource, /function allowLargeSnapshotShrinkFromPayload/);
assert.equal((databaseVehiclesSource.match(/allowLargeSnapshotShrink: allowLargeSnapshotShrinkFromPayload\(record\.allowLargeSnapshotShrink\)/g) ?? []).length, 3);
assert.equal((databaseVehiclesSource.match(/expectedSnapshot: expectedVehicleSnapshotFromPayload\(record\.expectedSnapshot\)/g) ?? []).length, 3);
assert.doesNotMatch(vehicleRowsEditorSource, /deleteVehicleFromDatabase/);
assert.match(vehicleRowsPersistenceSource, /const vehicleRowsVersionRef = useRef\(0\);/);
assert.match(vehicleRowsPersistenceSource, /const snapshotVersion = vehicleRowsVersionRef\.current;/);
assert.match(vehicleRowsPersistenceSource, /const vehicleLocalSaveSnapshotRef = useRef<string \| null>\(null\);/);
assert.match(vehicleRowsPersistenceSource, /import \{ isDatabaseConflictError \} from "@\/lib\/data\/errors";/);
assert.match(vehicleRowsPersistenceSource, /const vehicleDatabaseRetryInitialDelayMs = 2000;/);
assert.match(vehicleRowsPersistenceSource, /const vehicleDatabaseRetryMaxDelayMs = 30000;/);
assert.match(vehicleRowsPersistenceSource, /const vehicleDatabaseRetryTimerRef = useRef<number \| null>\(null\);/);
assert.match(vehicleRowsPersistenceSource, /const vehicleDatabaseRetryDelayRef = useRef\(vehicleDatabaseRetryInitialDelayMs\);/);
assert.match(vehicleRowsPersistenceSource, /function saveVehicleRowsLocalBackupIfChanged/);
assert.match(vehicleRowsPersistenceSource, /const queueDatabaseVehicleSave = useCallback/);
assert.match(
  vehicleRowsPersistenceSource,
  /databaseSaveQueueRef\.current\?\.enqueue\(async \(isLatest\) => \{[\s\S]*const expectedSnapshot = parseExpectedVehicleSnapshot\(databaseSaveSnapshotRef\.current\);[\s\S]*const savePlan = createVehicleRowsSavePlan\(rowsSnapshot, expectedSnapshot\)/,
);
assert.match(
  vehicleRowsPersistenceSource,
  /databaseSaveSnapshotRef\.current = snapshot;[\s\S]*vehicleDatabaseRetryDelayRef\.current = vehicleDatabaseRetryInitialDelayMs;[\s\S]*if \(!isLatest\(\) \|\| snapshotVersion !== vehicleRowsVersionRef\.current\) return;/,
);
assert.match(vehicleRowsPersistenceSource, /saveVehicleRowsPatchToDatabase\(savePlan\.patchRows/);
assert.match(vehicleRowsPersistenceSource, /if \(isDatabaseConflictError\(error\)\) \{/);
assert.match(vehicleRowsPersistenceSource, /vehicleDatabaseRetryTimerRef\.current = window\.setTimeout/);
assert.match(vehicleRowsPersistenceSource, /queueDatabaseVehicleSave\([\s\S]*retryRowsSnapshot,[\s\S]*JSON\.stringify\(retryRowsSnapshot\),[\s\S]*vehicleRowsVersionRef\.current/);
assert.match(vehicleRowsPersistenceSource, /vehicleDatabaseRetryDelayRef\.current = Math\.min\(/);
assert.doesNotMatch(vehicleRowsPersistenceSource, /JSON\.stringify\(vehicleRowsRef\.current\)\) return;/);
assert.match(vehicleRowsPersistenceSource, /shouldBlockVehicleRowsAutoSave\(snapshot, databaseAutoSaveBlockedSnapshotRef\.current\)/);
assert.match(vehicleRowsPersistenceSource, /if \(localBackupChanged && !autoSaveBlocked\) \{\s*requestClientSnapshotSave\("vehicles-save"\);/);
assert.match(initialVehicleRowsSource, /databaseRowsCount > savedVehicles\.length/);
assert.match(initialVehicleRowsSource, /vehiclesDatabaseAutoSaveBlockedSnapshotRef\.current = JSON\.stringify\(defaultVehicleSeed\.vehicles\)/);
assert.match(initialVehicleRowsSource, /vehiclesDatabaseAutoSaveBlockedSnapshotRef\.current = JSON\.stringify\(normalizedRows\)/);
assert.match(vehicleRowsPersistenceSource, /readVehicleRowsLocalBackup\(\)/);
assert.match(vehicleRowsEditorSource, /Удаление техники будет сохранено общим списком/);
assert.match(mysqlVehiclesSource, /Список техники уже изменился в базе/);

assert.match(vehicleRowsPersistenceSource, /window\.addEventListener\("pagehide", flushVehicleRows\)/);
assert.match(vehicleRowsPersistenceSource, /queueDatabaseVehicleSave\(rowsSnapshot, snapshot, vehicleRowsVersionRef\.current\);/);
assert.match(vehicleRowsPersistenceSource, /databaseSaveQueueRef\.current\?\.flush\(\)/);
assert.match(vehicleRowsSaveQueueSource, /flush\(\) \{[\s\S]*return chain\.catch\(\(\) => undefined\);[\s\S]*\}/);

const vehicleOne = normalizeVehicleRow({ id: 1, brand: "Howo", garageNumber: "1" });
const vehicleTwo = normalizeVehicleRow({ id: 2, brand: "Shacman", garageNumber: "2" });
const editedVehicleTwo = normalizeVehicleRow({ ...vehicleTwo, model: "X3000" });
const patchPlan = createVehicleRowsSavePlan([vehicleOne, editedVehicleTwo], [vehicleOne, vehicleTwo]);

assert.equal(patchPlan.kind, "patch");
if (patchPlan.kind === "patch") {
  assert.deepEqual(patchPlan.patchRows.map(({ row, sortIndex }) => [row.id, sortIndex]), [[2, 1]]);
}

assert.equal(createVehicleRowsSavePlan([vehicleTwo, vehicleOne], [vehicleOne, vehicleTwo]).kind, "replace");
assert.equal(createVehicleRowsSavePlan([vehicleOne, vehicleTwo], null).kind, "replace");
assert.equal(createVehicleRowsSavePlan([vehicleOne, vehicleTwo], [vehicleOne, vehicleTwo]).kind, "none");
assert.equal(shouldBlockVehicleRowsAutoSave("[1,2]", "[1,2]"), true);
assert.equal(shouldBlockVehicleRowsAutoSave("[1,2]", "[1,3]"), false);
assert.equal(shouldBlockVehicleRowsAutoSave("[1,2]", ""), false);
