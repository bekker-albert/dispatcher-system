import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const dataVehiclesSource = readFileSync(resolve(testDir, "../lib/data/vehicles.ts"), "utf8");
const databaseVehiclesSource = readFileSync(resolve(testDir, "../lib/server/database/vehicles.ts"), "utf8");
const mysqlVehiclesSource = readFileSync(resolve(testDir, "../lib/server/mysql/vehicles.ts"), "utf8");
const supabaseVehiclesSource = readFileSync(resolve(testDir, "../lib/supabase/vehicles.ts"), "utf8");
const vehicleRowsEditorSource = readFileSync(resolve(testDir, "../features/admin/vehicles/useVehicleRowsEditor.ts"), "utf8");
const vehicleRowsPersistenceSource = readFileSync(resolve(testDir, "../features/admin/vehicles/useVehicleRowsPersistence.ts"), "utf8");

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
  /async function deleteVehiclesMissingFromMysqlSnapshot[\s\S]*if \(vehicleIds\.length === 0\) \{[\s\S]*DELETE FROM vehicles[\s\S]*WHERE vehicle_id NOT IN/,
);

const mysqlReplaceSource = exportedFunctionSource(mysqlVehiclesSource, "replaceVehiclesInMysql");
assert.match(mysqlReplaceSource, /assertMysqlVehiclesMatchExpectedSnapshot\(options\.expectedSnapshot,\s*execute\)/);
assert.match(mysqlReplaceSource, /dbTransaction/);
assert.match(mysqlReplaceSource, /upsertVehiclesToMysql\(rows,\s*execute\)/);
assert.match(mysqlReplaceSource, /deleteVehiclesMissingFromMysqlSnapshot\(rows,\s*execute\)/);
assert.match(mysqlVehiclesSource, /vehicleSnapshotKey\(currentRows\) !== vehicleSnapshotKey\(expectedSnapshot\)/);
assert.match(mysqlVehiclesSource, /FOR UPDATE/);

const supabaseSaveSource = exportedFunctionSource(supabaseVehiclesSource, "saveVehiclesToSupabase");
assert.match(supabaseSaveSource, /expectedSnapshot: options\.expectedSnapshot/);
assert.match(supabaseSaveSource, /assertSupabaseVehiclesMatchExpectedSnapshot\(options\.expectedSnapshot\)/);
assert.match(supabaseSaveSource, /await upsertVehiclesToSupabase\(client,\s*records\);/);
assert.doesNotMatch(supabaseSaveSource, /deleteVehiclesMissingFromSupabaseSnapshot/);
assert.equal(supabaseVehiclesSource.includes('.not("vehicle_id", "is", null)'), true);
assert.equal(supabaseVehiclesSource.includes('.not("vehicle_id", "in", `(${vehicleIds.join(",")})`)'), true);

const supabaseReplaceSource = exportedFunctionSource(supabaseVehiclesSource, "replaceVehiclesInSupabase");
assert.match(supabaseReplaceSource, /expectedSnapshot: options\.expectedSnapshot/);
assert.match(supabaseReplaceSource, /assertSupabaseVehiclesMatchExpectedSnapshot\(options\.expectedSnapshot\)/);
assert.match(
  supabaseReplaceSource,
  /await upsertVehiclesToSupabase\(client,\s*records\);[\s\S]*await deleteVehiclesMissingFromSupabaseSnapshot\(client,\s*vehicleIds\);/,
);
assert.equal(supabaseReplaceSource.includes('.gte("vehicle_id", 0)'), false);

assert.match(dataVehiclesSource, /saveVehiclesToDatabase\(rows: VehicleRow\[], options\?: VehicleSnapshotWriteOptions\)/);
assert.match(dataVehiclesSource, /replaceVehiclesInDatabase\(rows: VehicleRow\[], options\?: VehicleSnapshotReplaceOptions\)/);
assert.match(databaseVehiclesSource, /function expectedVehicleSnapshotFromPayload/);
assert.equal((databaseVehiclesSource.match(/expectedSnapshot: expectedVehicleSnapshotFromPayload\(record\.expectedSnapshot\)/g) ?? []).length, 2);
assert.doesNotMatch(vehicleRowsEditorSource, /deleteVehicleFromDatabase/);
assert.match(vehicleRowsPersistenceSource, /const vehicleRowsVersionRef = useRef\(0\);/);
assert.match(vehicleRowsPersistenceSource, /const snapshotVersion = vehicleRowsVersionRef\.current;/);
assert.doesNotMatch(vehicleRowsPersistenceSource, /JSON\.stringify\(vehicleRowsRef\.current\)\) return;/);
assert.match(vehicleRowsEditorSource, /Удаление техники будет сохранено общим списком/);
