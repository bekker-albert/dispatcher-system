import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { PtoYearOptionSource } from "@/lib/domain/pto/date-table-years";

export type PtoDateLookupSource = PtoYearOptionSource & {
  area: string;
  location: string;
  structure: string;
};

export type PtoAreaLookupSource = {
  area: string;
};

export type PtoBucketRowLookupSource = {
  area: string;
  structure: string;
};

type LookupSourceBundle<T> = {
  sources: T[];
  signature: string;
};

type PtoAreaAndBucketRowLookupSourceBundle = {
  areaSources: PtoAreaLookupSource[];
  areaSignature: string;
  bucketRowSources: PtoBucketRowLookupSource[];
  bucketRowSignature: string;
  rowGroupsSignature: string;
};

function validYearFromDateKey(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.slice(0, 4) : "";
}

function sortedKeys(value: Record<string, unknown> | undefined) {
  return Object.keys(value ?? {}).sort();
}

function sortedValues(values: readonly string[] | undefined) {
  return [...(values ?? [])].sort();
}

export function createPtoDateLookupSources(rows: readonly PtoPlanRow[]): PtoDateLookupSource[] {
  return createPtoDateLookupSourceBundle(rows).sources;
}

function createPtoDateLookupSource(row: PtoPlanRow) {
  const years = sortedValues(row.years);
  const source = {
    area: row.area,
    location: row.location,
    structure: row.structure,
    years,
    carryoverYears: sortedKeys(row.carryovers),
    carryoverManualYears: sortedValues(row.carryoverManualYears),
    legacyDailyPlanYears: years.length === 0
      ? sortedValues(Object.keys(row.dailyPlans).map(validYearFromDateKey).filter(Boolean))
      : [],
  };
  const signature = [
    source.area,
    source.location,
    source.structure,
    source.years.join(","),
    source.carryoverYears.join(","),
    source.carryoverManualYears.join(","),
    source.legacyDailyPlanYears.join(","),
  ].join("\u001f");

  return { source, signature };
}

export function createPtoDateLookupSourceBundle(rows: readonly PtoPlanRow[]): LookupSourceBundle<PtoDateLookupSource> {
  const signatureParts: string[] = [];
  const sources = rows.map((row) => {
    const { source, signature } = createPtoDateLookupSource(row);
    signatureParts.push(signature);

    return source;
  });

  return {
    sources,
    signature: signatureParts.join("\u001e"),
  };
}

export function createPtoAreaLookupSources(rows: readonly PtoPlanRow[]): PtoAreaLookupSource[] {
  return createPtoAreaLookupSourceBundle(rows).sources;
}

export function createPtoAreaLookupSourceBundle(rows: readonly PtoPlanRow[]): LookupSourceBundle<PtoAreaLookupSource> {
  const sources = rows.map((row) => ({ area: row.area }));
  return {
    sources,
    signature: sources.map((source) => source.area).join("\u001e"),
  };
}

export function createPtoAreaAndBucketRowLookupSourceBundle(
  rowGroups: readonly (readonly Pick<PtoPlanRow, "area" | "structure">[])[],
): PtoAreaAndBucketRowLookupSourceBundle {
  const areaSources: PtoAreaLookupSource[] = [];
  const areaSignatureParts: string[] = [];
  const bucketRowSources: PtoBucketRowLookupSource[] = [];
  const bucketRowSignatureParts: string[] = [];
  const rowGroupSignatureParts: string[] = [];
  const areaKeys = new Set<string>();
  const bucketRowKeys = new Set<string>();

  rowGroups.forEach((rows) => {
    const rowSignatureParts: string[] = [];

    rows.forEach((row) => {
      if (!areaKeys.has(row.area)) {
        areaKeys.add(row.area);
        areaSources.push({ area: row.area });
        areaSignatureParts.push(row.area);
      }

      const bucketRowKey = [row.area, row.structure].join("\u001f");
      rowSignatureParts.push(bucketRowKey);

      if (!bucketRowKeys.has(bucketRowKey)) {
        bucketRowKeys.add(bucketRowKey);
        bucketRowSources.push({ area: row.area, structure: row.structure });
        bucketRowSignatureParts.push(bucketRowKey);
      }
    });

    rowGroupSignatureParts.push(rowSignatureParts.join("\u001e"));
  });

  return {
    areaSources,
    areaSignature: areaSignatureParts.join("\u001e"),
    bucketRowSources,
    bucketRowSignature: bucketRowSignatureParts.join("\u001e"),
    rowGroupsSignature: rowGroupSignatureParts.join("\u001d"),
  };
}

export function createPtoBucketRowLookupSources(rows: readonly PtoPlanRow[]): PtoBucketRowLookupSource[] {
  return createPtoBucketRowLookupSourceBundle(rows).sources;
}

export function createPtoBucketRowLookupSourceBundle(rows: readonly PtoPlanRow[]): LookupSourceBundle<PtoBucketRowLookupSource> {
  const sources = rows.map((row) => ({ area: row.area, structure: row.structure }));
  return {
    sources,
    signature: sources.map((source) => [source.area, source.structure].join("\u001f")).join("\u001e"),
  };
}

export function createPtoBucketAreaLookupSources(rows: readonly PtoBucketRow[]): PtoAreaLookupSource[] {
  return createPtoBucketAreaLookupSourceBundle(rows).sources;
}

export function createPtoBucketAreaLookupSourceBundle(rows: readonly PtoBucketRow[]): LookupSourceBundle<PtoAreaLookupSource> {
  const sources = rows.map((row) => ({ area: row.area }));
  return {
    sources,
    signature: sources.map((source) => source.area).join("\u001e"),
  };
}

export function ptoDateLookupSourcesSignature(sources: readonly PtoDateLookupSource[]) {
  return sources
    .map((source) => [
      source.area,
      source.location,
      source.structure,
      source.years.join(","),
      source.carryoverYears.join(","),
      source.carryoverManualYears.join(","),
      source.legacyDailyPlanYears.join(","),
    ].join("\u001f"))
    .join("\u001e");
}

export function ptoAreaLookupSourcesSignature(sources: readonly PtoAreaLookupSource[]) {
  return sources.map((source) => source.area).join("\u001e");
}

export function ptoBucketRowLookupSourcesSignature(sources: readonly PtoBucketRowLookupSource[]) {
  return sources.map((source) => [source.area, source.structure].join("\u001f")).join("\u001e");
}
