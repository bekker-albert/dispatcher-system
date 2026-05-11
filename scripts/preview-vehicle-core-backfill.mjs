import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  canTryMysql,
  getMysqlSkipReason,
  loadVehiclesFromMysql,
  loadVehiclesFromSeed,
  runVehicleCoreAnalyzer,
  trimText,
  vehicleCardFields,
} from "./analyze-vehicle-core-migration.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const root = path.resolve(scriptDir, "..");
const sectionMappingDraftPath = path.join(root, "data", "erp-section-mapping.draft.json");
const cleanupPreviewPath = path.join(root, "docs", "ERP_VEHICLE_DATA_CLEANUP_PREVIEW.json");
const defaultReportPath = path.join(root, "docs", "ERP_VEHICLE_CORE_BACKFILL_PREVIEW.md");

const productionFields = ["work", "rent", "repair", "downtime", "trips"];

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    source: "auto",
    analyzerJsonPath: "",
    cleanupJsonPath: cleanupPreviewPath,
    reportPath: defaultReportPath,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--source") {
      args.source = argv[index + 1] || args.source;
      index += 1;
      continue;
    }
    if (arg === "--analyzer-json") {
      args.analyzerJsonPath = path.resolve(root, argv[index + 1] || "");
      index += 1;
      continue;
    }
    if (arg === "--cleanup-json") {
      args.cleanupJsonPath = path.resolve(root, argv[index + 1] || "");
      index += 1;
      continue;
    }
    if (arg === "--write-report") {
      args.reportPath = path.resolve(root, argv[index + 1] || path.relative(root, defaultReportPath));
      index += 1;
    }
  }

  return args;
}

function compactKey(value) {
  return trimText(value)
    .toLocaleLowerCase("ru-RU")
    .replace(/\u0451/g, "\u0435")
    .replace(/[^a-z\u0430-\u044f0-9]+/giu, "");
}

function numberValue(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

async function readJsonIfExists(filePath) {
  if (!filePath) return null;
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return null;
    throw error;
  }
}

function buildSectionMapping(mapping) {
  const bySourceValue = new Map();
  const sections = Array.isArray(mapping?.sections) ? mapping.sections : [];
  const rawMappings = Array.isArray(mapping?.mappings) ? mapping.mappings : [];

  for (const section of sections) {
    if (!section || typeof section !== "object") continue;
    const normalizedSection = {
      section_code: trimText(section.section_code),
      section_name: trimText(section.section_name),
      short_name: trimText(section.short_name),
    };
    const values = [
      section.section_code,
      section.section_name,
      section.short_name,
      ...(Array.isArray(section.source_values) ? section.source_values : []),
    ];
    for (const value of values) {
      const key = compactKey(value);
      if (key) bySourceValue.set(key, normalizedSection);
    }
  }

  for (const item of rawMappings) {
    if (!item || typeof item !== "object") continue;
    if (item.value_type !== "section") continue;
    const normalizedSection = {
      section_code: trimText(item.normalized_section_code),
      section_name: trimText(item.normalized_section_name),
      short_name: trimText(item.normalized_section_name),
    };
    const key = compactKey(item.raw_value);
    if (key && normalizedSection.section_code) bySourceValue.set(key, normalizedSection);
  }

  return bySourceValue;
}

async function loadSourceRows(source) {
  if (source === "seed") {
    return {
      source: "seed",
      rows: await loadVehiclesFromSeed(),
      mysql: {
        status: "skipped",
        reason: "MySQL dry-run skipped because --source seed was requested.",
      },
    };
  }

  if (source === "mysql") {
    if (!canTryMysql()) {
      return {
        source: "mysql",
        rows: [],
        mysql: {
          status: "skipped",
          reason: getMysqlSkipReason(),
        },
      };
    }
    return {
      source: "mysql",
      rows: await loadVehiclesFromMysql(),
      mysql: {
        status: "loaded",
        reason: "",
      },
    };
  }

  if (canTryMysql()) {
    try {
      return {
        source: "mysql",
        rows: await loadVehiclesFromMysql(),
        mysql: {
          status: "loaded",
          reason: "",
        },
      };
    } catch (error) {
      return {
        source: "seed",
        rows: await loadVehiclesFromSeed(),
        mysql: {
          status: "skipped",
          reason: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  return {
    source: "seed",
    rows: await loadVehiclesFromSeed(),
    mysql: {
      status: "skipped",
      reason: getMysqlSkipReason(),
    },
  };
}

function hasProductionValue(row) {
  return productionFields.some((field) => numberValue(row[field]) !== 0);
}

function getCleanupDecision(cleanupByRow, rowId, field) {
  const decision = cleanupByRow.get(rowId);
  return decision?.[field]?.action || "keep";
}

function shouldPreviewNullFromCleanup(cleanupByRow, rowId, field) {
  return getCleanupDecision(cleanupByRow, rowId, field) === "normalize_to_null_candidate";
}

function buildVehicleCard(row, cleanupByRow) {
  const card = {
    legacy_vehicle_id: row.id,
    display_name: row.name,
    status: row.active === false ? "inactive" : "active",
    active: row.active !== false,
    visible: row.visible !== false,
    version: 1,
  };

  for (const field of vehicleCardFields) {
    if (field === "plateNumber" && shouldPreviewNullFromCleanup(cleanupByRow, row.id, field)) {
      card[field] = null;
      continue;
    }
    if (field === "garageNumber" && shouldPreviewNullFromCleanup(cleanupByRow, row.id, field)) {
      card[field] = null;
      continue;
    }
    if (field === "vin" && trimText(row[field]) === "") {
      card[field] = null;
      continue;
    }
    card[field] = row[field] === "" ? null : row[field];
  }

  return card;
}

function buildContractLinks(row) {
  const links = [];
  if (trimText(row.owner)) {
    links.push({
      legacy_vehicle_id: row.id,
      party_role: "owner",
      legacy_party_name: row.owner,
      requires_party_mapping: true,
    });
  }
  if (trimText(row.contractor) && trimText(row.contractor) !== trimText(row.owner)) {
    links.push({
      legacy_vehicle_id: row.id,
      party_role: "contractor",
      legacy_party_name: row.contractor,
      requires_party_mapping: true,
    });
  }
  return links;
}

function createCleanupByRow(cleanupPreview) {
  const rows = cleanupPreview?.cleanup?.rowDecisions;
  if (!Array.isArray(rows)) return new Map();
  return new Map(rows.map((row) => [row.id, row]));
}

function createPreviewStatus(rows, preview, cleanupPreview) {
  const cleanup = cleanupPreview?.cleanup;
  const blockingIssues = [];

  if (!cleanupPreview) {
    blockingIssues.push("Cleanup preview is missing.");
  }
  if (cleanup?.totals?.manualReviewRows > 0) {
    blockingIssues.push(`${cleanup.totals.manualReviewRows} rows require manual cleanup review.`);
  }
  if (preview.vehicleSectionHistory.length < rows.length) {
    blockingIssues.push("Section mapping is incomplete; many rows cannot produce vehicle_section_history.");
  }
  if (preview.warnings.length > 0) {
    blockingIssues.push(`${preview.warnings.length} preview warnings remain.`);
  }

  return {
    decision: blockingIssues.length === 0 ? "backfill allowed" : "backfill blocked",
    blockingIssues,
    manualCleanupRequired: {
      safeCleanupCandidateRows: cleanup?.totals?.safeCleanupCandidateRows ?? 0,
      manualReviewRows: cleanup?.totals?.manualReviewRows ?? rows.length,
      placeholderPlateRows: cleanup?.plateNumber?.counts?.placeholders ?? 0,
      placeholderGarageRows: cleanup?.garageNumber?.counts?.placeholders ?? 0,
      duplicatePlateGroups: cleanup?.plateNumber?.counts?.duplicateGroups ?? 0,
      duplicateGarageGroups: cleanup?.garageNumber?.counts?.duplicateGroups ?? 0,
    },
    sectionMappingRequired: {
      sourceRows: rows.length,
      sectionHistoryPreviewRows: preview.vehicleSectionHistory.length,
      missingSectionRows: rows.length - preview.vehicleSectionHistory.length,
    },
    safeToMapFields: [
      "brand",
      "model",
      "vehicleType",
      "equipmentType",
      "manufactureYear",
      "fuelNormWinter",
      "fuelNormSummer",
      "fuelCalcType",
      "active",
      "visible",
      "vin nullable",
      "plateNumber only after placeholder cleanup",
      "garageNumber only after placeholder cleanup",
    ],
    excludedFromVehicleCards: [
      "area",
      "location",
      "owner",
      "contractor",
      "workType",
      "excavator",
      ...productionFields,
    ],
  };
}

function buildPreview(rows, sectionMapping, cleanupPreview) {
  const vehicleCards = [];
  const sectionHistory = [];
  const contractLinks = [];
  const gpsLinks = [];
  const skippedRows = [];
  const warnings = [];
  const skippedFields = new Map();
  const cleanupByRow = createCleanupByRow(cleanupPreview);

  for (const row of rows) {
    const hasAnyIdentity = [
      row.brand,
      row.model,
      row.plateNumber,
      row.garageNumber,
      row.vin,
    ].some((value) => Boolean(trimText(value)));

    if (!hasAnyIdentity) {
      skippedRows.push({
        legacy_vehicle_id: row.id,
        reason: "No stable vehicle identity fields.",
      });
      continue;
    }

    vehicleCards.push(buildVehicleCard(row, cleanupByRow));

    for (const field of ["plateNumber", "garageNumber"]) {
      if (shouldPreviewNullFromCleanup(cleanupByRow, row.id, field)) {
        warnings.push({
          legacy_vehicle_id: row.id,
          field,
          reason: "Cleanup preview proposes nullable identifier before real backfill.",
        });
      }
    }

    if (!trimText(row.area)) {
      warnings.push({
        legacy_vehicle_id: row.id,
        field: "area",
        reason: "Manual section mapping required.",
      });
    } else {
      const mappedSection = sectionMapping.get(compactKey(row.area));
      if (mappedSection) {
        sectionHistory.push({
          legacy_vehicle_id: row.id,
          section_code: mappedSection.section_code,
          legacy_area: row.area,
          started_at: null,
          ended_at: null,
        });
      } else {
        warnings.push({
          legacy_vehicle_id: row.id,
          field: "area",
          reason: "Area has no draft section mapping.",
          value: row.area,
        });
      }
    }

    for (const link of buildContractLinks(row)) contractLinks.push(link);

    if (!trimText(row.owner) && !trimText(row.contractor)) {
      warnings.push({
        legacy_vehicle_id: row.id,
        field: "owner/contractor",
        reason: "Party mapping cannot be previewed without legacy party text.",
      });
    }

    if (hasProductionValue(row)) {
      for (const field of productionFields) {
        if (numberValue(row[field]) !== 0) {
          skippedFields.set(field, (skippedFields.get(field) || 0) + 1);
        }
      }
      warnings.push({
        legacy_vehicle_id: row.id,
        field: productionFields.join(", "),
        reason: "Production values belong to future report/event tables, not vehicle_cards.",
      });
    }
  }

  const preview = {
    vehicleCards,
    vehicleSectionHistory: sectionHistory,
    vehicleContractLinks: contractLinks,
    vehicleGpsLinks: gpsLinks,
    skippedRows,
    warnings,
    skippedFields: Object.fromEntries(skippedFields.entries()),
  };
  return {
    ...preview,
    status: createPreviewStatus(rows, preview, cleanupPreview),
  };
}

function sampleItems(items, limit = 10) {
  if (!items || items.length === 0) return "- none";
  return items.slice(0, limit).map((item) => `- ${JSON.stringify(item)}`).join("\n");
}

function createMarkdownReport(result) {
  const totals = result.preview;
  const status = result.preview.status;
  const analyzerSummary = result.analyzerSummary
    ? `Analyzer JSON: loaded from ${result.analyzerJsonPath}`
    : "Analyzer JSON: not provided; source vehicles were analyzed directly.";
  const cleanupSummary = result.cleanupPreview
    ? `Cleanup preview: loaded from ${result.cleanupJsonPath}`
    : "Cleanup preview: missing.";

  return `# Vehicle core backfill preview

Generated at: ${result.generatedAt}
Mode: preview-read-only
Source: ${result.source}

This preview does not change database data, runtime schema, migrations, UI behavior, PTO, reports, or Excel import/export.

${analyzerSummary}

${cleanupSummary}

## MySQL dry-run ${result.mysql.status === "loaded" ? "result" : "skipped"}

${result.mysql.status === "loaded" ? `Rows read: ${result.rowCount}` : result.mysql.reason}

## Preview totals

| Target preview bucket | Rows |
|---|---:|
| vehicle_cards | ${totals.vehicleCards.length} |
| vehicle_section_history | ${totals.vehicleSectionHistory.length} |
| vehicle_contract_links | ${totals.vehicleContractLinks.length} |
| vehicle_gps_links | ${totals.vehicleGpsLinks.length} |
| skipped_rows | ${totals.skippedRows.length} |
| warnings | ${totals.warnings.length} |

## Backfill readiness

Decision: ${status.decision}

## Blocking issues

${status.blockingIssues.length === 0 ? "- none" : status.blockingIssues.map((item) => `- ${item}`).join("\n")}

## Manual cleanup required

| Check | Rows / groups |
|---|---:|
| Safe cleanup candidate rows | ${status.manualCleanupRequired.safeCleanupCandidateRows} |
| Manual review rows | ${status.manualCleanupRequired.manualReviewRows} |
| Placeholder plate rows | ${status.manualCleanupRequired.placeholderPlateRows} |
| Placeholder garage rows | ${status.manualCleanupRequired.placeholderGarageRows} |
| Duplicate plate groups | ${status.manualCleanupRequired.duplicatePlateGroups} |
| Duplicate garage groups | ${status.manualCleanupRequired.duplicateGarageGroups} |

## Section mapping required

| Check | Rows |
|---|---:|
| Source rows | ${status.sectionMappingRequired.sourceRows} |
| vehicle_section_history preview rows | ${status.sectionMappingRequired.sectionHistoryPreviewRows} |
| Rows still missing section mapping | ${status.sectionMappingRequired.missingSectionRows} |

Empty area values still cannot become section_id.

## Safe-to-map fields

${status.safeToMapFields.map((field) => `- ${field}`).join("\n")}

## vehicle_cards fields

${vehicleCardFields.map((field) => `- ${field}`).join("\n")}

Additional preview metadata: legacy_vehicle_id, display_name, status, version.

## Fields excluded from vehicle_cards

Production fields are not part of vehicle_cards:

${Object.keys(totals.skippedFields).length === 0 ? "- none found with non-zero values" : Object.entries(totals.skippedFields).map(([field, count]) => `- ${field}: ${count} rows`).join("\n")}

Additional excluded fields:

${status.excludedFromVehicleCards.map((field) => `- ${field}`).join("\n")}

## Manual mapping required

- Empty area values cannot become section_id.
- Owner/contractor text requires a future parties/contractors directory.
- GPS links stay empty until GPS/Wialon mapping is designed.

## Sample skipped rows

${sampleItems(totals.skippedRows)}

## Sample warnings

${sampleItems(totals.warnings, 20)}

## Decision: backfill allowed / backfill blocked

Decision: ${status.decision}. Real backfill is not ready while cleanup, duplicate policy, section mapping, and MySQL dry-run are incomplete.
`;
}

async function maybeWriteFile(filePath, content) {
  if (!filePath) return;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

export async function runPreview(options = {}) {
  const generatedAt = new Date().toISOString();
  const requestedSource = options.source || "auto";
  const sourceResult = await loadSourceRows(requestedSource);
  const sectionMapping = buildSectionMapping(await readJsonIfExists(sectionMappingDraftPath));
  const cleanupPreview = await readJsonIfExists(options.cleanupJsonPath || cleanupPreviewPath);
  const analyzerSummary = options.analyzerJsonPath
    ? await readJsonIfExists(options.analyzerJsonPath)
    : await runVehicleCoreAnalyzer({ source: requestedSource });
  const preview = buildPreview(sourceResult.rows, sectionMapping, cleanupPreview);

  return {
    generatedAt,
    requestedSource,
    source: sourceResult.source,
    rowCount: sourceResult.rows.length,
    mysql: sourceResult.mysql,
    analyzerJsonPath: options.analyzerJsonPath || "",
    cleanupJsonPath: options.cleanupJsonPath || cleanupPreviewPath,
    analyzerSummary,
    cleanupPreview,
    preview,
  };
}

async function main() {
  const args = parseArgs();
  const result = await runPreview({
    source: args.source,
    analyzerJsonPath: args.analyzerJsonPath,
    cleanupJsonPath: args.cleanupJsonPath,
  });
  const markdown = createMarkdownReport(result);
  await maybeWriteFile(args.reportPath, markdown);
  console.log(markdown);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await main();
}
