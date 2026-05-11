import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  canTryMysql,
  canonicalText,
  getMysqlSkipReason,
  loadVehiclesFromMysql,
  loadVehiclesFromSeed,
  trimText,
} from "./analyze-vehicle-core-migration.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const root = path.resolve(scriptDir, "..");
const defaultMarkdownPath = path.join(root, "docs", "ERP_VEHICLE_DATA_CLEANUP_PREVIEW.md");
const defaultJsonPath = path.join(root, "docs", "ERP_VEHICLE_DATA_CLEANUP_PREVIEW.json");

const canNullifyPlaceholderKeys = new Set([
  "",
  "-",
  "\u0431/\u043d",
  "\u0431\\\u043d",
  "\u0431.\u043d.",
  "\u0431\u0435\u0437 \u043d\u043e\u043c\u0435\u0440\u0430",
  "\u043d\u0435\u0442",
  "n/a",
  "na",
  "n\\a",
  "none",
  "unknown",
].map(canonicalText));

const reviewPlaceholderKeys = new Set([
  "\u0437\u0430\u043a\u0430\u0437\u0447\u0438\u043a",
  "customer",
  "client",
].map(canonicalText));

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    source: "auto",
    markdownPath: defaultMarkdownPath,
    jsonPath: defaultJsonPath,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--source") {
      args.source = argv[index + 1] || args.source;
      index += 1;
      continue;
    }
    if (arg === "--write-report") {
      args.markdownPath = path.resolve(root, argv[index + 1] || path.relative(root, defaultMarkdownPath));
      index += 1;
      continue;
    }
    if (arg === "--write-json") {
      args.jsonPath = path.resolve(root, argv[index + 1] || path.relative(root, defaultJsonPath));
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

function identifierKey(value) {
  const key = canonicalText(value);
  if (!key || canNullifyPlaceholderKeys.has(key) || reviewPlaceholderKeys.has(key)) return "";
  return key;
}

function isCanNullifyPlaceholder(value) {
  return canNullifyPlaceholderKeys.has(canonicalText(value));
}

function isReviewPlaceholder(value) {
  return reviewPlaceholderKeys.has(canonicalText(value));
}

function normalizePartyName(value) {
  return canonicalText(value)
    .replace(/^(too|llp|ao|ip|ooo)+/, "")
    .replace(/(too|llp|ao|ip|ooo)+$/, "")
    .replace(/^(тоо|ао|ип|ооо)+/u, "")
    .replace(/(тоо|ао|ип|ооо)+$/u, "");
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

function createValueList(items, limit = 30) {
  return items.slice(0, limit).map((item) => ({
    value: item.value,
    count: item.count,
    rowIds: item.rowIds.slice(0, 30),
  }));
}

function summarizeRowsByValue(rows) {
  const groups = new Map();
  for (const row of rows) {
    const value = row.value || "(empty)";
    const group = groups.get(value) || { value, count: 0, rowIds: [] };
    group.count += 1;
    group.rowIds.push(row.id);
    groups.set(value, group);
  }
  return Array.from(groups.values())
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value))
    .map((group) => ({
      value: group.value,
      count: group.count,
      rowIds: group.rowIds.slice(0, 30),
    }));
}

function groupValues(rows, field, keyFactory = compactKey) {
  const groups = new Map();
  for (const row of rows) {
    const raw = trimText(row[field]);
    if (!raw) continue;
    const key = keyFactory(raw);
    if (!key) continue;
    const group = groups.get(key) || { key, value: raw, count: 0, rowIds: [], rawValues: new Map() };
    group.count += 1;
    group.rowIds.push(row.id);
    group.rawValues.set(raw, (group.rawValues.get(raw) || 0) + 1);
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .map((group) => ({
      key: group.key,
      value: group.value,
      count: group.count,
      rowIds: group.rowIds,
      rawValues: Array.from(group.rawValues.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value)),
    }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
}

function collectIdentifierCleanup(rows, field) {
  const placeholderRows = [];
  const canNullifyRows = [];
  const reviewRows = [];
  const duplicateGroups = groupValues(rows, field, identifierKey)
    .filter((group) => group.rowIds.length > 1);

  for (const row of rows) {
    const raw = trimText(row[field]);
    if (!raw || isCanNullifyPlaceholder(raw) || isReviewPlaceholder(raw)) {
      placeholderRows.push({
        id: row.id,
        value: raw,
        reason: raw ? "placeholder" : "empty",
      });
    }
    if (raw && isCanNullifyPlaceholder(raw)) {
      canNullifyRows.push({
        id: row.id,
        value: raw,
      });
    }
    if (raw && isReviewPlaceholder(raw)) {
      reviewRows.push({
        id: row.id,
        value: raw,
        reason: "placeholder requires manual review",
      });
    }
  }

  const duplicateRowIds = new Set(duplicateGroups.flatMap((group) => group.rowIds));
  for (const rowId of duplicateRowIds) {
    if (!reviewRows.some((item) => item.id === rowId)) {
      reviewRows.push({
        id: rowId,
        value: "",
        reason: "duplicate identifier",
      });
    }
  }

  return {
    field,
    placeholderRows,
    placeholderValues: summarizeRowsByValue(placeholderRows),
    canNullifyRows,
    canNullifyValues: summarizeRowsByValue(canNullifyRows),
    reviewRows,
    reviewValues: summarizeRowsByValue(reviewRows),
    duplicateGroups: createValueList(duplicateGroups),
    counts: {
      placeholders: placeholderRows.length,
      canNullify: canNullifyRows.length,
      manualReview: reviewRows.length,
      duplicateGroups: duplicateGroups.length,
      duplicateRows: duplicateRowIds.size,
    },
  };
}

function collectVariantSuggestions(rows, field, keyFactory = compactKey) {
  return groupValues(rows, field, keyFactory)
    .filter((group) => group.rawValues.length > 1)
    .map((group) => ({
      normalizedCandidate: group.rawValues[0]?.value || group.value,
      canonicalKey: group.key,
      values: group.rawValues,
      rowIds: group.rowIds.slice(0, 50),
      requiresManualReview: true,
    }));
}

function uniqueRowIds(...collections) {
  return new Set(collections.flatMap((items) => items.map((item) => item.id ?? item)));
}

function buildCleanupPreview(rows) {
  const plateNumber = collectIdentifierCleanup(rows, "plateNumber");
  const garageNumber = collectIdentifierCleanup(rows, "garageNumber");
  const vinEmptyRows = rows.filter((row) => !trimText(row.vin)).map((row) => row.id);
  const ownerVariants = collectVariantSuggestions(rows, "owner", normalizePartyName);
  const contractorVariants = collectVariantSuggestions(rows, "contractor", normalizePartyName);
  const vehicleTypeVariants = collectVariantSuggestions(rows, "vehicleType");
  const equipmentTypeVariants = collectVariantSuggestions(rows, "equipmentType");
  const rowsWithoutSection = rows.filter((row) => !trimText(row.area)).map((row) => row.id);
  const safeCandidateRows = uniqueRowIds(plateNumber.canNullifyRows, garageNumber.canNullifyRows);
  const manualRows = new Set([
    ...plateNumber.reviewRows.map((row) => row.id),
    ...garageNumber.reviewRows.map((row) => row.id),
    ...rowsWithoutSection,
    ...ownerVariants.flatMap((group) => group.rowIds),
    ...contractorVariants.flatMap((group) => group.rowIds),
    ...vehicleTypeVariants.flatMap((group) => group.rowIds),
    ...equipmentTypeVariants.flatMap((group) => group.rowIds),
  ]);

  return {
    totals: {
      rows: rows.length,
      safeCleanupCandidateRows: safeCandidateRows.size,
      manualReviewRows: manualRows.size,
      rowsWithoutSection: rowsWithoutSection.length,
    },
    plateNumber,
    garageNumber,
    vin: {
      nullable: true,
      uniqueConstraintRecommended: false,
      emptyRows: vinEmptyRows.length,
      nonEmptyRows: rows.length - vinEmptyRows.length,
      note: "VIN stays nullable; no unique constraint is recommended at this stage.",
    },
    ownership: {
      ownerVariants,
      contractorVariants,
      normalizedDirectoryAutoCreateAllowed: false,
    },
    vehicleTypes: {
      vehicleTypeVariants,
      equipmentTypeVariants,
      autoChangeAllowed: false,
    },
    rowDecisions: rows.map((row) => ({
      id: row.id,
      plateNumber: {
        raw: trimText(row.plateNumber),
        action: trimText(row.plateNumber) && isCanNullifyPlaceholder(row.plateNumber)
          ? "normalize_to_null_candidate"
          : isReviewPlaceholder(row.plateNumber)
            ? "manual_review"
            : "keep",
      },
      garageNumber: {
        raw: trimText(row.garageNumber),
        action: trimText(row.garageNumber) && isCanNullifyPlaceholder(row.garageNumber)
          ? "normalize_to_null_candidate"
          : isReviewPlaceholder(row.garageNumber)
            ? "manual_review"
            : "keep",
      },
      requiresManualReview: manualRows.has(row.id),
    })),
  };
}

function listDuplicateGroups(groups, limit = 10) {
  if (!groups.length) return "- none";
  return groups.slice(0, limit).map((group) => (
    `- ${group.value}: ${group.count} rows (${group.rowIds.slice(0, 12).join(", ")})`
  )).join("\n");
}

function listValueCounts(values, limit = 10) {
  if (!values.length) return "- none";
  return values.slice(0, limit).map((item) => (
    `- ${item.value}: ${item.count} rows (${item.rowIds.slice(0, 12).join(", ")})`
  )).join("\n");
}

function listVariants(groups, limit = 10) {
  if (!groups.length) return "- none";
  return groups.slice(0, limit).map((group) => (
    `- ${group.normalizedCandidate}: ${group.values.map((item) => `${item.value} (${item.count})`).join("; ")}`
  )).join("\n");
}

function createMarkdown(result) {
  const cleanup = result.cleanup;
  const mysqlText = result.mysql.status === "loaded"
    ? `Rows read from MySQL: ${result.cleanup.totals.rows}`
    : result.mysql.reason;

  return `# Vehicle data cleanup preview

Generated at: ${result.generatedAt}
Mode: cleanup-preview-read-only
Source: ${result.source}

This report is write-free. It prepares cleanup proposals for future ERP backfill and does not change database data, runtime schema, vehicles, PTO, reports, Excel import/export, or auth.

## MySQL dry-run ${result.mysql.status === "loaded" ? "result" : "skipped"}

${mysqlText}

## Summary

| Metric | Rows |
|---|---:|
| Total rows | ${cleanup.totals.rows} |
| Rows with safe cleanup candidates | ${cleanup.totals.safeCleanupCandidateRows} |
| Rows requiring manual review | ${cleanup.totals.manualReviewRows} |
| Rows without section | ${cleanup.totals.rowsWithoutSection} |

## plateNumber

| Check | Rows |
|---|---:|
| Placeholder or empty values | ${cleanup.plateNumber.counts.placeholders} |
| Can be proposed as null | ${cleanup.plateNumber.counts.canNullify} |
| Manual review | ${cleanup.plateNumber.counts.manualReview} |
| Duplicate groups | ${cleanup.plateNumber.counts.duplicateGroups} |

### plateNumber duplicates

${listDuplicateGroups(cleanup.plateNumber.duplicateGroups)}

### plateNumber placeholder values found

${listValueCounts(cleanup.plateNumber.placeholderValues)}

### plateNumber values proposed as null

${listValueCounts(cleanup.plateNumber.canNullifyValues)}

## garageNumber

| Check | Rows |
|---|---:|
| Placeholder or empty values | ${cleanup.garageNumber.counts.placeholders} |
| Can be proposed as null | ${cleanup.garageNumber.counts.canNullify} |
| Manual review | ${cleanup.garageNumber.counts.manualReview} |
| Duplicate groups | ${cleanup.garageNumber.counts.duplicateGroups} |

### garageNumber duplicates

${listDuplicateGroups(cleanup.garageNumber.duplicateGroups)}

### garageNumber placeholder values found

${listValueCounts(cleanup.garageNumber.placeholderValues)}

### garageNumber values proposed as null

${listValueCounts(cleanup.garageNumber.canNullifyValues)}

## VIN

- VIN nullable: ${cleanup.vin.nullable ? "yes" : "no"}
- Non-empty VIN rows: ${cleanup.vin.nonEmptyRows}
- Empty VIN rows: ${cleanup.vin.emptyRows}
- Unique constraint recommended now: ${cleanup.vin.uniqueConstraintRecommended ? "yes" : "no"}

## owner / contractor

No contractor directory is created automatically.

### owner spelling variants

${listVariants(cleanup.ownership.ownerVariants)}

### contractor spelling variants

${listVariants(cleanup.ownership.contractorVariants)}

## vehicle type / category

No vehicle type or category text is changed automatically.

### vehicleType variants

${listVariants(cleanup.vehicleTypes.vehicleTypeVariants)}

### equipmentType variants

${listVariants(cleanup.vehicleTypes.equipmentTypeVariants)}

## Values that must not be touched automatically

- duplicate plate or garage numbers;
- rows without section;
- owner/contractor spelling variants;
- vehicle type/category spelling variants;
- any value that looks like a real identifier but conflicts with another row.

## Decision

Staging backfill dry-run may be prepared only after MySQL dry-run is available and manual review closes section mapping, duplicate policy, and placeholder cleanup rules. Real backfill remains blocked.
`;
}

async function writeFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

export async function runCleanupPreview(options = {}) {
  const generatedAt = new Date().toISOString();
  const sourceResult = await loadSourceRows(options.source || "auto");
  const cleanup = buildCleanupPreview(sourceResult.rows);
  return {
    generatedAt,
    mode: "cleanup-preview-read-only",
    requestedSource: options.source || "auto",
    source: sourceResult.source,
    mysql: sourceResult.mysql,
    cleanup,
  };
}

async function main() {
  const args = parseArgs();
  const result = await runCleanupPreview({ source: args.source });
  const markdown = createMarkdown(result);
  await writeFile(args.markdownPath, markdown);
  await writeFile(args.jsonPath, JSON.stringify(result, null, 2));
  console.log(markdown);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await main();
}
