import { ptoBucketRowKey, type PtoBucketRow } from "../../lib/domain/pto/buckets";
import { parseDecimalInput } from "../../lib/utils/numbers";
import { cleanAreaName } from "../../lib/utils/text";
import { allAreasLabel } from "./ptoBucketsConfig";

export type PtoBucketValueUpdate = {
  values: Record<string, number>;
  value: number | null;
};

export function normalizePtoBucketDraftValue(draft: string) {
  const parsed = parseDecimalInput(draft);
  return parsed === null ? null : Math.round(parsed * 100) / 100;
}

export function applyPtoBucketValueDraft(
  currentValues: Record<string, number>,
  cellKey: string,
  draft: string,
): PtoBucketValueUpdate {
  const value = normalizePtoBucketDraftValue(draft);
  const values = { ...currentValues };

  if (value === null) {
    delete values[cellKey];
  } else {
    values[cellKey] = value;
  }

  return { values, value };
}

export function clearPtoBucketValueKeys(currentValues: Record<string, number>, cellKeys: string[]) {
  const values = { ...currentValues };
  cellKeys.forEach((key) => {
    delete values[key];
  });
  return values;
}

export function createPtoBucketManualRowDraft(
  areaValue: string,
  structureValue: string,
  areaFilter: string,
  existingRows: PtoBucketRow[],
) {
  const fallbackArea = areaFilter === allAreasLabel ? "" : areaFilter;
  const area = cleanAreaName(areaValue.trim() || fallbackArea).trim();
  const structure = structureValue.trim();

  if (!area || !structure) return null;

  const key = ptoBucketRowKey(area, structure);
  if (existingRows.some((row) => row.key === key)) return null;

  return { key, area, structure, source: "manual" as const };
}

export function removePtoBucketManualRowValues(currentValues: Record<string, number>, rowKey: string) {
  const values = { ...currentValues };
  Object.keys(values).forEach((key) => {
    if (key.startsWith(`${rowKey}::`)) delete values[key];
  });
  return values;
}
