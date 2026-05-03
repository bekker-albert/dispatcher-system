import { isPtoDateTableKey, type PtoDateTableKey } from "./date-table";

export const ptoMatrixTableKeys = ["buckets", "cycle", "bodies", "performance"] as const;

export type PtoMatrixTableKey = (typeof ptoMatrixTableKeys)[number];
export type PtoDataTableKey = PtoDateTableKey | PtoMatrixTableKey;

export type PtoMatrixTableMeta = {
  sectionLabel: string;
  valueLabel: string;
  excelFileName: string;
};

export const ptoMatrixTableMeta: Record<PtoMatrixTableKey, PtoMatrixTableMeta> = {
  buckets: {
    sectionLabel: "\u041f\u0422\u041e: \u041a\u043e\u0432\u0448\u0438",
    valueLabel: "\u043a\u043e\u0432\u0448",
    excelFileName: "pto-kovshi.xlsx",
  },
  cycle: {
    sectionLabel: "\u041f\u0422\u041e: \u0426\u0438\u043a\u043b",
    valueLabel: "\u0446\u0438\u043a\u043b",
    excelFileName: "pto-cycle.xlsx",
  },
  bodies: {
    sectionLabel: "\u041f\u0422\u041e: \u041a\u0443\u0437\u043e\u0432\u0430",
    valueLabel: "\u043a\u0443\u0437\u043e\u0432",
    excelFileName: "pto-kuzova.xlsx",
  },
  performance: {
    sectionLabel: "\u041f\u0422\u041e: \u041f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u044c",
    valueLabel: "\u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u044c",
    excelFileName: "pto-proizvoditelnost.xlsx",
  },
};

export function isPtoMatrixTableKey(value: string): value is PtoMatrixTableKey {
  return (ptoMatrixTableKeys as readonly string[]).includes(value);
}

export function isPtoDataTableKey(value: string): value is PtoDataTableKey {
  return isPtoDateTableKey(value) || isPtoMatrixTableKey(value);
}

export function ptoTabNeedsDatabase(value: string) {
  return isPtoDataTableKey(value);
}

export function ptoTabIncludesBucketState(value: string) {
  return isPtoMatrixTableKey(value);
}

export function ptoMatrixTableMetaFor(value: string): PtoMatrixTableMeta {
  return isPtoMatrixTableKey(value) ? ptoMatrixTableMeta[value] : ptoMatrixTableMeta.buckets;
}
