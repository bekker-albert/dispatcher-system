import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const root = path.resolve(scriptDir, "..");
const seedPath = path.join(root, "data", "default-vehicles.json");
const ptoDefaultsPath = path.join(root, "lib", "domain", "pto", "defaults.ts");
const reportsDefaultsPath = path.join(root, "lib", "domain", "reports", "defaults.ts");
const referenceDefaultsPath = path.join(root, "lib", "domain", "reference", "defaults.ts");
const sectionMappingDraftPath = path.join(root, "data", "erp-section-mapping.draft.json");
export const defaultVehicleDryRunReportPath = path.join(root, "docs", "ERP_VEHICLE_CORE_MIGRATION_DRY_RUN.md");

export const productionFields = ["work", "rent", "repair", "downtime", "trips"];
export const keyFields = ["brand", "model", "plateNumber", "garageNumber", "vin"];
export const vehicleCardFields = [
  "id",
  "brand",
  "model",
  "plateNumber",
  "garageNumber",
  "vehicleType",
  "equipmentType",
  "manufactureYear",
  "vin",
  "fuelNormWinter",
  "fuelNormSummer",
  "fuelCalcType",
  "active",
  "visible",
];

const placeholderIdentifierValues = [
  "",
  "-",
  "\u0431/\u043d",
  "\u0431\\\u043d",
  "\u0431.\u043d.",
  "\u0431\u0435\u0437 \u043d\u043e\u043c\u0435\u0440\u0430",
  "\u0437\u0430\u043a\u0430\u0437\u0447\u0438\u043a",
  "\u043d\u0435\u0442",
  "n/a",
  "na",
  "n\\a",
  "none",
  "unknown",
];
const placeholderIdentifierKeys = new Set(placeholderIdentifierValues.map(canonicalText));
const suspiciousPartyKeys = new Set([
  ...placeholderIdentifierKeys,
  canonicalText("\u0437\u0430\u043a\u0430\u0437\u0447\u0438\u043a"),
  canonicalText("\u043a\u043b\u0438\u0435\u043d\u0442"),
  "customer",
  "client",
]);

export function parseAnalyzerArgs(argv = process.argv.slice(2)) {
  const args = {
    source: "auto",
    output: "markdown",
    reportPath: undefined,
    jsonPath: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      args.output = "json";
      continue;
    }
    if (arg === "--source") {
      args.source = argv[index + 1] || args.source;
      index += 1;
      continue;
    }
    if (arg === "--output") {
      args.output = argv[index + 1] || args.output;
      index += 1;
      continue;
    }
    if (arg === "--write-report") {
      args.reportPath = path.resolve(root, argv[index + 1] || path.relative(root, defaultVehicleDryRunReportPath));
      index += 1;
      continue;
    }
    if (arg === "--write-json") {
      args.jsonPath = path.resolve(root, argv[index + 1] || "docs/ERP_VEHICLE_CORE_MIGRATION_DRY_RUN.json");
      index += 1;
    }
  }

  if (!["auto", "seed", "mysql"].includes(args.source)) args.source = "auto";
  if (!["markdown", "json"].includes(args.output)) args.output = "markdown";

  return args;
}

export function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function canonicalText(value) {
  return trimText(value)
    .toLowerCase()
    .replace(/\u0451/g, "\u0435")
    .replace(/[“”«»"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactKey(value) {
  return canonicalText(value)
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
}

function canonicalPartyName(value) {
  return compactKey(value)
    .replace(/^(too|llp|ao|ip|ooo|too|тоо|ао|ип|ооо)+/iu, "")
    .replace(/(too|llp|ao|ip|ooo|тоо|ао|ип|ооо)+$/iu, "");
}

function normalizeJson(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value !== "string") return {};

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function isPlaceholderIdentifier(value) {
  return placeholderIdentifierKeys.has(canonicalText(value));
}

function isNormalIdentifier(value) {
  return Boolean(trimText(value)) && !isPlaceholderIdentifier(value);
}

function isSuspiciousPartyValue(value) {
  const text = canonicalText(value);
  return !text || suspiciousPartyKeys.has(text) || text.length <= 1 || /\?{2,}/.test(text);
}

function buildVehicleDisplayName(vehicle) {
  const base = [vehicle.brand, vehicle.model].map(trimText).filter(Boolean).join(" ");
  const number = trimText(vehicle.garageNumber || vehicle.plateNumber);
  if (base && number) return `${base} ${number}`;
  return base || number || `vehicle-${vehicle.id}`;
}

export function normalizeVehicleRow(value, index = 0) {
  const row = value && typeof value === "object" ? value : {};
  const id = Number(row.id ?? row.vehicle_id ?? index + 1);
  const vehicle = {
    id: Number.isFinite(id) && id > 0 ? id : index + 1,
    name: trimText(row.name),
    brand: trimText(row.brand),
    model: trimText(row.model),
    plateNumber: trimText(row.plateNumber ?? row.plate_number),
    garageNumber: trimText(row.garageNumber ?? row.garage_number),
    vehicleType: trimText(row.vehicleType ?? row.category),
    equipmentType: trimText(row.equipmentType ?? row.equipment_type ?? row.vehicleType ?? row.category),
    manufactureYear: trimText(row.manufactureYear ?? row.manufacture_year),
    fuelNormWinter: numberValue(row.fuelNormWinter),
    fuelNormSummer: numberValue(row.fuelNormSummer),
    fuelCalcType: trimText(row.fuelCalcType || "moto-hours"),
    vin: trimText(row.vin),
    owner: trimText(row.owner),
    area: trimText(row.area),
    location: trimText(row.location),
    workType: trimText(row.workType),
    excavator: trimText(row.excavator),
    contractor: trimText(row.contractor ?? row.owner),
    work: numberValue(row.work),
    rent: numberValue(row.rent),
    repair: numberValue(row.repair),
    downtime: numberValue(row.downtime),
    trips: numberValue(row.trips),
    active: row.active !== false && row.active !== 0,
    visible: row.visible !== false && row.visible !== 0,
  };

  return {
    ...vehicle,
    name: vehicle.name || buildVehicleDisplayName(vehicle),
  };
}

function normalizeMysqlRecord(record, index) {
  const data = normalizeJson(record.data);
  return normalizeVehicleRow({
    ...data,
    id: record.vehicle_id,
    visible: record.visible,
    vehicleType: record.category ?? data.vehicleType,
    equipmentType: record.equipment_type ?? data.equipmentType,
    brand: record.brand ?? data.brand,
    model: record.model ?? data.model,
    plateNumber: record.plate_number ?? data.plateNumber,
    garageNumber: record.garage_number ?? data.garageNumber,
    owner: record.owner ?? data.owner,
  }, index);
}

export function canTryMysql(env = process.env) {
  return Boolean(env.DB_NAME && env.DB_USER && env.DB_PASSWORD);
}

export function getMysqlSkipReason(env = process.env) {
  const missing = ["DB_NAME", "DB_USER", "DB_PASSWORD"].filter((key) => !env[key]);
  return missing.length > 0
    ? `MySQL mode skipped: missing ${missing.join(", ")}.`
    : "";
}

export async function loadVehiclesFromMysql(env = process.env) {
  const mysql = await import("mysql2/promise");
  const connection = await mysql.createConnection({
    host: env.DB_HOST || "localhost",
    port: Number(env.DB_PORT || 3306),
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  });

  try {
    const [records] = await connection.query(
      `SELECT
        vehicle_id,
        sort_index,
        visible,
        category,
        equipment_type,
        brand,
        model,
        plate_number,
        garage_number,
        owner,
        data,
        updated_at
      FROM vehicles
      ORDER BY sort_index ASC, vehicle_id ASC`,
    );

    return records.map(normalizeMysqlRecord);
  } finally {
    await connection.end();
  }
}

export async function loadVehiclesFromSeed() {
  const seed = JSON.parse(await fs.readFile(seedPath, "utf8"));
  if (!Array.isArray(seed)) return [];
  return seed.map((row, index) => normalizeVehicleRow({
    ...row,
    id: index + 1,
    vehicleType: row.category,
    contractor: row.owner,
    active: true,
    visible: true,
  }, index));
}

async function readTextIfExists(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return "";
    throw error;
  }
}

async function readJsonIfExists(filePath) {
  const text = await readTextIfExists(filePath);
  if (!text) return null;
  return JSON.parse(text);
}

function extractQuotedPropertyValues(text, property) {
  const values = [];
  const pattern = new RegExp(`${property}\\s*:\\s*"([^"]*)"`, "g");
  let match = pattern.exec(text);
  while (match) {
    values.push(match[1]);
    match = pattern.exec(text);
  }
  return values;
}

function createCandidateCollector() {
  const byKey = new Map();

  return {
    add(value, kind, source, context = "", requiresManualReview = false) {
      const raw = trimText(value);
      if (!raw) return;
      const normalized = compactKey(raw);
      if (!normalized) return;
      const key = `${kind}:${normalized}`;
      const candidate = byKey.get(key) || {
        value: raw,
        normalized,
        kind,
        sources: [],
        contexts: [],
        count: 0,
        requiresManualReview: false,
      };
      candidate.count += 1;
      candidate.requiresManualReview = candidate.requiresManualReview || requiresManualReview;
      if (source && !candidate.sources.includes(source)) candidate.sources.push(source);
      if (context && !candidate.contexts.includes(context)) candidate.contexts.push(context);
      byKey.set(key, candidate);
    },
    values(kind) {
      return Array.from(byKey.values())
        .filter((candidate) => !kind || candidate.kind === kind)
        .sort((left, right) => (
          right.count - left.count
          || left.kind.localeCompare(right.kind)
          || left.value.localeCompare(right.value)
        ));
    },
  };
}

function shouldReviewSectionCandidate(value) {
  const text = trimText(value);
  if (!text) return false;
  return text.includes("_") || /^\u0443\u0447/i.test(text);
}

function collectManualMappingSections(mapping) {
  const sections = [];
  if (!mapping || typeof mapping !== "object") return sections;
  const sourceSections = Array.isArray(mapping.sections) ? mapping.sections : [];

  for (const section of sourceSections) {
    if (!section || typeof section !== "object") continue;
    for (const field of ["section_name", "short_name", "section_code"]) {
      if (trimText(section[field])) {
        sections.push({
          value: section[field],
          context: field,
        });
      }
    }
    if (Array.isArray(section.source_values)) {
      for (const value of section.source_values) {
        sections.push({
          value,
          context: "source_values",
        });
      }
    }
  }

  return sections;
}

function summarizeCandidates(candidates) {
  return candidates.map((candidate) => ({
    value: candidate.value,
    count: candidate.count,
    sources: candidate.sources,
    contexts: candidate.contexts,
    requiresManualReview: candidate.requiresManualReview,
  }));
}

export async function collectSectionCandidates(options = {}) {
  const seedRows = options.seedRows || [];
  const mysqlRows = options.mysqlRows || [];
  const collector = createCandidateCollector();

  for (const row of seedRows) {
    collector.add(row.area, "section", "vehicles.area:seed", `vehicle:${row.id}`, false);
  }

  for (const row of mysqlRows) {
    collector.add(row.area, "section", "vehicles.area:mysql", `vehicle:${row.id}`, false);
  }

  const ptoDefaults = await readTextIfExists(ptoDefaultsPath);
  const ptoAreas = extractQuotedPropertyValues(ptoDefaults, "area");
  const ptoLocations = extractQuotedPropertyValues(ptoDefaults, "location");
  const ptoStructures = extractQuotedPropertyValues(ptoDefaults, "structure");

  for (const value of ptoAreas) {
    collector.add(value, "section", "PTO plan rows", "area", shouldReviewSectionCandidate(value));
  }
  for (const value of ptoLocations) {
    collector.add(value, "location", "PTO plan rows", "location", false);
  }
  for (const value of ptoStructures) {
    collector.add(value, "work_structure", "PTO plan rows", "structure", false);
  }

  const reportDefaults = await readTextIfExists(reportsDefaultsPath);
  const reportAreas = extractQuotedPropertyValues(reportDefaults, "area");
  const reportStructures = extractQuotedPropertyValues(reportDefaults, "name");
  for (const value of reportAreas) {
    collector.add(value, "section", "report rows", "area", shouldReviewSectionCandidate(value));
  }
  for (const value of reportStructures) {
    collector.add(value, "work_structure", "report rows", "name", false);
  }

  const referenceDefaults = await readTextIfExists(referenceDefaultsPath);
  const referenceAreas = [
    ...extractQuotedPropertyValues(referenceDefaults, "area"),
    ...extractQuotedPropertyValues(referenceDefaults, "section"),
    ...extractQuotedPropertyValues(referenceDefaults, "sectionName"),
  ];
  for (const value of referenceAreas) {
    collector.add(value, "section", "reference/default data", "reference", shouldReviewSectionCandidate(value));
  }

  const manualMapping = await readJsonIfExists(sectionMappingDraftPath);
  for (const item of collectManualMappingSections(manualMapping)) {
    collector.add(item.value, "section", "manual draft mapping file", item.context, false);
  }

  const sections = collector.values("section");
  const locations = collector.values("location");
  const workStructures = collector.values("work_structure");
  const ptoSections = sections.filter((candidate) => candidate.sources.includes("PTO plan rows"));
  const valuesRequiringReview = ptoSections.filter((candidate) => candidate.requiresManualReview);

  return {
    status: "ok",
    sources: {
      vehiclesAreaSeedRows: seedRows.length,
      vehiclesAreaMysqlRows: mysqlRows.length,
      ptoDefaultsPath: path.relative(root, ptoDefaultsPath).replace(/\\/g, "/"),
      reportsDefaultsPath: path.relative(root, reportsDefaultsPath).replace(/\\/g, "/"),
      referenceDefaultsPath: path.relative(root, referenceDefaultsPath).replace(/\\/g, "/"),
      manualDraftMappingPath: path.relative(root, sectionMappingDraftPath).replace(/\\/g, "/"),
      manualDraftMappingLoaded: Boolean(manualMapping),
    },
    sections: summarizeCandidates(sections),
    locations: summarizeCandidates(locations),
    workStructures: summarizeCandidates(workStructures),
    pto: {
      sectionsFound: summarizeCandidates(ptoSections),
      locationsFound: summarizeCandidates(locations.filter((candidate) => candidate.sources.includes("PTO plan rows"))),
      structuresFound: summarizeCandidates(workStructures.filter((candidate) => candidate.sources.includes("PTO plan rows"))),
      valuesRequiringManualReview: summarizeCandidates(valuesRequiringReview),
      nonSectionValues: summarizeCandidates([
        ...locations.filter((candidate) => candidate.sources.includes("PTO plan rows")),
        ...workStructures.filter((candidate) => candidate.sources.includes("PTO plan rows")),
      ]),
    },
  };
}

function createIdList(rows, limit = 50) {
  return rows.map((row) => row.id).slice(0, limit);
}

function collectEmptyFieldIds(rows, field) {
  return rows
    .filter((row) => !trimText(row[field]))
    .map((row) => row.id);
}

function collectPlaceholderFieldRows(rows, field) {
  const matched = rows.filter((row) => isPlaceholderIdentifier(row[field]));
  const values = new Map();
  for (const row of matched) {
    const value = trimText(row[field]) || "(empty)";
    const current = values.get(value) || { value, count: 0, rowIds: [] };
    current.count += 1;
    if (current.rowIds.length < 25) current.rowIds.push(row.id);
    values.set(value, current);
  }

  return {
    count: matched.length,
    rowIds: createIdList(matched),
    values: Array.from(values.values()).sort((left, right) => right.count - left.count || left.value.localeCompare(right.value)),
  };
}

function collectDuplicateGroups(rows, field) {
  const byValue = new Map();
  for (const row of rows) {
    const key = normalizedIdentifierKey(row[field]);
    if (!key) continue;
    const group = byValue.get(key) || { value: trimText(row[field]), rowIds: [], names: [] };
    group.rowIds.push(row.id);
    if (group.names.length < 20) group.names.push(row.name);
    byValue.set(key, group);
  }

  return Array.from(byValue.values())
    .filter((group) => group.rowIds.length > 1)
    .sort((left, right) => right.rowIds.length - left.rowIds.length || left.value.localeCompare(right.value));
}

function normalizedIdentifierKey(value) {
  return isNormalIdentifier(value) ? canonicalText(value) : "";
}

function collectDuplicateGroupsByFields(rows, fields) {
  const groups = new Map();
  for (const row of rows) {
    if (!fields.every((field) => isNormalIdentifier(row[field]))) continue;
    const key = fields.map((field) => normalizedIdentifierKey(row[field])).join("|");
    const value = fields.map((field) => trimText(row[field])).join(" + ");
    const group = groups.get(key) || { value, rowIds: [], names: [] };
    group.rowIds.push(row.id);
    if (group.names.length < 20) group.names.push(row.name);
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .filter((group) => group.rowIds.length > 1)
    .sort((left, right) => right.rowIds.length - left.rowIds.length || left.value.localeCompare(right.value));
}

function collectRowsByPredicate(rows, predicate) {
  return rows.filter(predicate).map((row) => row.id);
}

function hasProductionData(row) {
  return productionFields.some((field) => numberValue(row[field]) !== 0);
}

function uniqueCount(values) {
  return new Set(values).size;
}

function collectVariantGroups(rows, field, canonicalize = compactKey) {
  const groups = new Map();
  for (const row of rows) {
    const raw = trimText(row[field]);
    if (!raw) continue;
    const key = canonicalize(raw);
    if (!key) continue;
    const group = groups.get(key) || { canonical: key, rawValues: new Map(), rowIds: [] };
    group.rawValues.set(raw, (group.rawValues.get(raw) || 0) + 1);
    if (group.rowIds.length < 40) group.rowIds.push(row.id);
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .map((group) => ({
      canonical: group.canonical,
      values: Array.from(group.rawValues.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value)),
      rowIds: group.rowIds,
    }))
    .filter((group) => group.values.length > 1)
    .sort((left, right) => right.values.length - left.values.length || left.canonical.localeCompare(right.canonical));
}

function collectSuspiciousPartyRows(rows, field) {
  const matched = rows.filter((row) => isSuspiciousPartyValue(row[field]));
  return {
    count: matched.length,
    rowIds: createIdList(matched),
  };
}

function collectProductionRows(rows) {
  return rows
    .filter(hasProductionData)
    .map((row) => ({
      id: row.id,
      name: row.name,
      values: Object.fromEntries(productionFields.map((field) => [field, numberValue(row[field])])),
    }));
}

export function createMigrationAnalysis(rows, sourceInfo) {
  const emptyFields = Object.fromEntries(
    keyFields.map((field) => [field, collectEmptyFieldIds(rows, field)]),
  );
  const placeholderPlateNumbers = collectPlaceholderFieldRows(rows, "plateNumber");
  const placeholderGarageNumbers = collectPlaceholderFieldRows(rows, "garageNumber");
  const duplicatePlateNumbers = collectDuplicateGroups(rows, "plateNumber");
  const duplicateGarageNumbers = collectDuplicateGroups(rows, "garageNumber");
  const duplicateVins = collectDuplicateGroups(rows, "vin");
  const rowsWithoutSection = rows.filter((row) => !trimText(row.area)).map((row) => row.id);
  const rowsWithoutOwner = rows.filter((row) => !trimText(row.owner)).map((row) => row.id);
  const rowsWithoutContractor = rows.filter((row) => !trimText(row.contractor)).map((row) => row.id);
  const rowsWithoutOwnerOrContractor = rows
    .filter((row) => !trimText(row.owner) || !trimText(row.contractor))
    .map((row) => row.id);
  const rowsWithProductionFields = collectProductionRows(rows);
  const potentialDuplicates = {
    brandModelPlateNumber: collectDuplicateGroupsByFields(rows, ["brand", "model", "plateNumber"]),
    brandModelGarageNumber: collectDuplicateGroupsByFields(rows, ["brand", "model", "garageNumber"]),
    plateNumberGarageNumber: collectDuplicateGroupsByFields(rows, ["plateNumber", "garageNumber"]),
    garageNumberWithoutPlateNumber: collectRowsByPredicate(rows, (row) => (
      isNormalIdentifier(row.garageNumber) && !isNormalIdentifier(row.plateNumber)
    )),
    plateNumberWithoutGarageNumber: collectRowsByPredicate(rows, (row) => (
      isNormalIdentifier(row.plateNumber) && !isNormalIdentifier(row.garageNumber)
    )),
  };
  const suspiciousParties = {
    owner: collectSuspiciousPartyRows(rows, "owner"),
    contractor: collectSuspiciousPartyRows(rows, "contractor"),
  };
  const variants = {
    owners: collectVariantGroups(rows, "owner", canonicalPartyName),
    contractors: collectVariantGroups(rows, "contractor", canonicalPartyName),
    vehicleTypes: collectVariantGroups(rows, "vehicleType"),
    equipmentTypes: collectVariantGroups(rows, "equipmentType"),
    brands: collectVariantGroups(rows, "brand"),
    models: collectVariantGroups(rows, "model"),
  };
  const duplicateProblemIds = [
    ...duplicatePlateNumbers.flatMap((group) => group.rowIds),
    ...duplicateGarageNumbers.flatMap((group) => group.rowIds),
    ...duplicateVins.flatMap((group) => group.rowIds),
    ...potentialDuplicates.brandModelPlateNumber.flatMap((group) => group.rowIds),
    ...potentialDuplicates.brandModelGarageNumber.flatMap((group) => group.rowIds),
    ...potentialDuplicates.plateNumberGarageNumber.flatMap((group) => group.rowIds),
  ];
  const problemRowIds = new Set([
    ...Object.values(emptyFields).flat(),
    ...placeholderPlateNumbers.rowIds,
    ...placeholderGarageNumbers.rowIds,
    ...rowsWithoutSection,
    ...rowsWithoutOwnerOrContractor,
    ...rowsWithProductionFields.map((row) => row.id),
    ...duplicateProblemIds,
    ...potentialDuplicates.garageNumberWithoutPlateNumber,
    ...potentialDuplicates.plateNumberWithoutGarageNumber,
    ...suspiciousParties.owner.rowIds,
    ...suspiciousParties.contractor.rowIds,
  ]);

  return {
    status: "ok",
    mode: "dry-run-read-only",
    source: sourceInfo.source,
    fallbackReason: sourceInfo.fallbackReason || "",
    generatedAt: sourceInfo.generatedAt,
    totals: {
      rows: rows.length,
      active: rows.filter((row) => row.active !== false).length,
      visible: rows.filter((row) => row.visible !== false).length,
      activeAndVisible: rows.filter((row) => row.active !== false && row.visible !== false).length,
      problemRows: problemRowIds.size,
    },
    emptyFields: Object.fromEntries(
      Object.entries(emptyFields).map(([field, ids]) => [field, { count: ids.length, rowIds: ids.slice(0, 50) }]),
    ),
    placeholders: {
      plateNumber: placeholderPlateNumbers,
      garageNumber: placeholderGarageNumbers,
    },
    duplicates: {
      plateNumber: duplicatePlateNumbers,
      garageNumber: duplicateGarageNumbers,
      vin: duplicateVins,
    },
    potentialDuplicates,
    suspiciousParties,
    variants,
    section: {
      rowsWithoutSection: {
        count: rowsWithoutSection.length,
        rowIds: rowsWithoutSection.slice(0, 50),
      },
      uniqueSections: uniqueCount(rows.map((row) => compactKey(row.area)).filter(Boolean)),
    },
    ownership: {
      rowsWithoutOwner: {
        count: rowsWithoutOwner.length,
        rowIds: rowsWithoutOwner.slice(0, 50),
      },
      rowsWithoutContractor: {
        count: rowsWithoutContractor.length,
        rowIds: rowsWithoutContractor.slice(0, 50),
      },
      rowsWithoutOwnerOrContractor: {
        count: rowsWithoutOwnerOrContractor.length,
        rowIds: rowsWithoutOwnerOrContractor.slice(0, 50),
      },
      uniqueOwners: uniqueCount(rows.map((row) => compactKey(row.owner)).filter(Boolean)),
      uniqueContractors: uniqueCount(rows.map((row) => compactKey(row.contractor)).filter(Boolean)),
    },
    productionFields: {
      rowsWithValues: rowsWithProductionFields.slice(0, 100),
      count: rowsWithProductionFields.length,
      fieldCounts: Object.fromEntries(
        productionFields.map((field) => [field, rows.filter((row) => numberValue(row[field]) !== 0).length]),
      ),
    },
    targetMapping: {
      vehicleCards: vehicleCardFields,
      sectionHistory: ["area", "location"],
      contractLinks: ["owner", "contractor"],
      futureShiftReports: ["workType", "excavator", "work", "rent", "trips"],
      statusHistory: ["repair", "downtime", "active"],
      gpsLinks: [],
      legacyOnlyUntilCompatibilityReadModel: ["name"],
    },
  };
}

export async function runVehicleCoreAnalyzer(options = {}) {
  const source = options.source || "auto";
  const generatedAt = new Date().toISOString();
  let seedRows = [];
  let mysqlRows = [];
  const result = {
    mode: "dry-run-read-only",
    generatedAt,
    requestedSource: source,
    seed: { status: "skipped", skipReason: "Seed mode not requested." },
    mysql: { status: "skipped", skipReason: "" },
    sectionCandidates: { status: "skipped", skipReason: "Section candidate scan has not run." },
  };

  if (source !== "mysql") {
    seedRows = await loadVehiclesFromSeed();
    result.seed = createMigrationAnalysis(seedRows, {
      source: "seed",
      fallbackReason: "",
      generatedAt,
    });
  }

  if (source !== "seed") {
    if (!canTryMysql()) {
      result.mysql = {
        status: "skipped",
        source: "mysql",
        skipReason: getMysqlSkipReason(),
        generatedAt,
      };
    } else {
      try {
        mysqlRows = await loadVehiclesFromMysql();
        result.mysql = createMigrationAnalysis(mysqlRows, {
          source: "mysql",
          fallbackReason: "",
          generatedAt,
        });
      } catch (error) {
        result.mysql = {
          status: "skipped",
          source: "mysql",
          skipReason: error instanceof Error ? error.message : String(error),
          generatedAt,
        };
      }
    }
  } else {
    result.mysql = {
      status: "skipped",
      source: "mysql",
      skipReason: "MySQL mode skipped because --source seed was requested.",
      generatedAt,
    };
  }

  result.sectionCandidates = await collectSectionCandidates({
    seedRows,
    mysqlRows,
    generatedAt,
  });

  return result;
}

function listDuplicateSummary(groups, limit = 20) {
  if (!groups || groups.length === 0) return "- none";
  return groups
    .slice(0, limit)
    .map((group) => `- ${group.value}: ${group.rowIds.length} rows (${group.rowIds.slice(0, 12).join(", ")})`)
    .join("\n");
}

function listIdSummary(ids, limit = 30) {
  if (!ids || ids.length === 0) return "- none";
  return `- ${ids.length} rows (${ids.slice(0, limit).join(", ")}${ids.length > limit ? ", ..." : ""})`;
}

function listVariantSummary(groups, limit = 10) {
  if (!groups || groups.length === 0) return "- none";
  return groups.slice(0, limit).map((group) => (
    `- ${group.canonical}: ${group.values.map((item) => `${item.value} (${item.count})`).join("; ")}`
  )).join("\n");
}

function listCandidateSummary(candidates, limit = 30) {
  if (!candidates || candidates.length === 0) return "- none";
  return candidates.slice(0, limit).map((candidate) => {
    const sources = candidate.sources?.length ? candidate.sources.join(", ") : "unknown";
    const review = candidate.requiresManualReview ? "; manual review" : "";
    return `- ${candidate.value}: ${candidate.count} hits; sources: ${sources}${review}`;
  }).join("\n");
}

function createSectionCandidateSection(sectionCandidates) {
  if (!sectionCandidates || sectionCandidates.status !== "ok") {
    return `## Section candidates from PTO plans\n\n${sectionCandidates?.skipReason || "Section candidate scan skipped."}\n`;
  }

  return `## Section candidates from PTO plans

This section is a read-only candidate scan. PTO text values can seed a manual mapping, but they must not create production sections without administrator confirmation.

### Sections found in PTO

${listCandidateSummary(sectionCandidates.pto.sectionsFound)}

### Locations found in PTO

${listCandidateSummary(sectionCandidates.pto.locationsFound)}

### Work structures found in PTO

${listCandidateSummary(sectionCandidates.pto.structuresFound)}

### Values that look like sections but need manual review

${listCandidateSummary(sectionCandidates.pto.valuesRequiringManualReview)}

### PTO values that are not sections

${listCandidateSummary(sectionCandidates.pto.nonSectionValues)}

### Combined section candidates

${listCandidateSummary(sectionCandidates.sections)}
`;
}

function createAnalysisSection(title, analysis) {
  if (!analysis || analysis.status !== "ok") {
    return `## ${title} skipped\n\n${analysis?.skipReason || "Skipped."}\n`;
  }

  return `## ${title} result

Source: ${analysis.source}

| Metric | Value |
|---|---:|
| Rows | ${analysis.totals.rows} |
| Active | ${analysis.totals.active} |
| Visible | ${analysis.totals.visible} |
| Active and visible | ${analysis.totals.activeAndVisible} |
| Rows with at least one migration issue | ${analysis.totals.problemRows} |

### Empty key fields

| Field | Empty rows |
|---|---:|
${Object.entries(analysis.emptyFields).map(([field, info]) => `| ${field} | ${info.count} |`).join("\n")}

### Placeholder identifiers

| Field | Placeholder rows |
|---|---:|
| plateNumber | ${analysis.placeholders.plateNumber.count} |
| garageNumber | ${analysis.placeholders.garageNumber.count} |

### Duplicate identifiers

#### plateNumber
${listDuplicateSummary(analysis.duplicates.plateNumber)}

#### garageNumber
${listDuplicateSummary(analysis.duplicates.garageNumber)}

#### vin
${listDuplicateSummary(analysis.duplicates.vin)}

### Potential duplicate combinations

#### brand + model + plateNumber
${listDuplicateSummary(analysis.potentialDuplicates.brandModelPlateNumber)}

#### brand + model + garageNumber
${listDuplicateSummary(analysis.potentialDuplicates.brandModelGarageNumber)}

#### plateNumber + garageNumber
${listDuplicateSummary(analysis.potentialDuplicates.plateNumberGarageNumber)}

#### garageNumber without plateNumber
${listIdSummary(analysis.potentialDuplicates.garageNumberWithoutPlateNumber)}

#### plateNumber without garageNumber
${listIdSummary(analysis.potentialDuplicates.plateNumberWithoutGarageNumber)}

### Section and ownership

| Check | Rows |
|---|---:|
| Rows without section | ${analysis.section.rowsWithoutSection.count} |
| Rows without owner | ${analysis.ownership.rowsWithoutOwner.count} |
| Rows without contractor | ${analysis.ownership.rowsWithoutContractor.count} |
| Suspicious owner values | ${analysis.suspiciousParties.owner.count} |
| Suspicious contractor values | ${analysis.suspiciousParties.contractor.count} |

### Value spelling variants

#### owners
${listVariantSummary(analysis.variants.owners)}

#### contractors
${listVariantSummary(analysis.variants.contractors)}

#### vehicle types / categories
${listVariantSummary(analysis.variants.vehicleTypes)}

#### equipment types
${listVariantSummary(analysis.variants.equipmentTypes)}

#### brands
${listVariantSummary(analysis.variants.brands)}

#### models
${listVariantSummary(analysis.variants.models)}

### Production fields inside vehicle cards

| Field | Rows with value |
|---|---:|
${Object.entries(analysis.productionFields.fieldCounts).map(([field, count]) => `| ${field} | ${count} |`).join("\n")}

### Target mapping

- vehicle_cards: ${analysis.targetMapping.vehicleCards.join(", ")}
- vehicle_section_history: ${analysis.targetMapping.sectionHistory.join(", ")}
- vehicle_contract_links: ${analysis.targetMapping.contractLinks.join(", ")}
- future shift reports: ${analysis.targetMapping.futureShiftReports.join(", ")}
- vehicle_status_history: ${analysis.targetMapping.statusHistory.join(", ")}
- legacy-only until compatibility read model: ${analysis.targetMapping.legacyOnlyUntilCompatibilityReadModel.join(", ")}
`;
}

export function createMarkdownReport(result) {
  const mysqlSectionTitle = result.mysql?.status === "ok" ? "MySQL dry-run" : "MySQL dry-run";

  return `# Vehicle core migration dry-run

Generated at: ${result.generatedAt}
Mode: ${result.mode}
Requested source: ${result.requestedSource}

This report is read-only. It analyzes existing vehicle data quality for a future ERP core migration and does not change database data, runtime schema, or UI behavior.

${createAnalysisSection("Seed dry-run", result.seed)}

${createAnalysisSection(mysqlSectionTitle, result.mysql)}

${createSectionCandidateSection(result.sectionCandidates)}

## Backfill readiness

Real write-backfill is not ready. A preview-only backfill can be prepared, but production write-backfill needs:

- staging MySQL dry-run;
- manual section mapping;
- cleanup rules for placeholder plate and garage numbers;
- accepted duplicate policy;
- nullable VIN policy;
- rollback and audit batch plan.
`;
}

async function maybeWriteFile(filePath, content) {
  if (!filePath) return;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

async function main() {
  const args = parseAnalyzerArgs();
  const result = await runVehicleCoreAnalyzer({ source: args.source });
  const markdown = createMarkdownReport(result);
  const json = JSON.stringify(result, null, 2);

  await maybeWriteFile(args.reportPath, markdown);
  await maybeWriteFile(args.jsonPath, json);

  if (args.output === "json") {
    console.log(json);
  } else {
    console.log(markdown);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await main();
}
