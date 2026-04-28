import type { PtoBucketRow } from "../../domain/pto/buckets";
import { isPtoDateTableKey, type PtoPlanRow } from "../../domain/pto/date-table";
import type { MysqlPtoState } from "../mysql/pto";
import { payloadRecord } from "./payload";
import type { DatabaseResourceHandler } from "./types";
import {
  DatabasePayloadError,
  optionalPayloadNumberOrNull,
  requirePayloadArray,
  requirePayloadNumber,
  requirePayloadRecord,
  requirePayloadString,
} from "./validation";

function unknownPtoDateTable(table: string): never {
  throw new DatabasePayloadError(`Некорректный запрос: неизвестная таблица ПТО "${table}".`);
}

function requirePtoDateTableKey(value: unknown) {
  const table = requirePayloadString(value, "table");
  if (isPtoDateTableKey(table)) return table;
  return unknownPtoDateTable(table);
}

function requirePtoDayPatch(value: unknown) {
  const record = requirePayloadRecord(value, "values[]");
  return {
    rowId: requirePayloadString(record.rowId, "rowId"),
    day: requirePayloadString(record.day, "day"),
    value: optionalPayloadNumberOrNull(record.value, "value"),
  };
}

function optionalExpectedUpdatedAt(record: Record<string, unknown>) {
  return typeof record.expectedUpdatedAt === "string" || record.expectedUpdatedAt === null
    ? record.expectedUpdatedAt
    : undefined;
}

export const handlePtoDatabaseAction: DatabaseResourceHandler = async ({
  action,
  payload,
  json,
}) => {
  const pto = await import("../mysql/pto");
  const record = payloadRecord(payload);

  if (action === "load") return json(await pto.loadPtoStateFromMysql());
  if (action === "load-year") {
    return json(await pto.loadPtoStateFromMysqlForYear(requirePayloadString(record.year, "year"), {
      includeBuckets: record.includeBuckets === true,
    }));
  }
  if (action === "load-buckets") return json(await pto.loadPtoBucketsFromMysql());
  if (action === "load-updated-at") return json(await pto.loadPtoUpdatedAtFromMysql());
  if (action === "save") {
    const result = await pto.savePtoStateToMysql(requirePayloadRecord(record.state, "state") as MysqlPtoState, {
      expectedUpdatedAt: typeof record.expectedUpdatedAt === "string" || record.expectedUpdatedAt === null
        ? record.expectedUpdatedAt
        : undefined,
      yearScope: typeof record.yearScope === "string" || record.yearScope === null
        ? record.yearScope
        : undefined,
    });
    return json({ ok: true, ...result });
  }
  if (action === "save-day") {
    const result = await pto.savePtoDayValueToMysql(
      requirePtoDateTableKey(record.table),
      requirePayloadString(record.rowId, "rowId"),
      requirePayloadString(record.day, "day"),
      optionalPayloadNumberOrNull(record.value, "value"),
      { expectedUpdatedAt: optionalExpectedUpdatedAt(record) },
    );
    return json({ ok: true, ...result });
  }
  if (action === "save-day-with-row") {
    const result = await pto.savePtoDayValueWithRowToMysql(
      requirePtoDateTableKey(record.table),
      requirePayloadRecord(record.row, "row") as PtoPlanRow,
      requirePayloadString(record.day, "day"),
      optionalPayloadNumberOrNull(record.value, "value"),
      { expectedUpdatedAt: optionalExpectedUpdatedAt(record) },
    );
    return json({ ok: true, ...result });
  }
  if (action === "save-days") {
    const result = await pto.savePtoDayValuesToMysql(
      requirePtoDateTableKey(record.table),
      requirePayloadArray(record.values, "values").map(requirePtoDayPatch),
      { expectedUpdatedAt: optionalExpectedUpdatedAt(record) },
    );
    return json({ ok: true, ...result });
  }
  if (action === "save-days-with-row") {
    const result = await pto.savePtoDayValuesWithRowToMysql(
      requirePtoDateTableKey(record.table),
      requirePayloadRecord(record.row, "row") as PtoPlanRow,
      requirePayloadArray(record.values, "values").map(requirePtoDayPatch),
      { expectedUpdatedAt: optionalExpectedUpdatedAt(record) },
    );
    return json({ ok: true, ...result });
  }
  if (action === "delete-year") {
    const result = await pto.deletePtoYearFromMysql(requirePayloadString(record.year, "year"), {
      expectedUpdatedAt: optionalExpectedUpdatedAt(record),
    });
    return json({ ok: true, ...result });
  }
  if (action === "delete") {
    const result = await pto.deletePtoRowsFromMysql(
      requirePtoDateTableKey(record.table),
      requirePayloadArray(record.rowIds, "rowIds").map((rowId) => requirePayloadString(rowId, "rowIds[]")),
      { expectedUpdatedAt: optionalExpectedUpdatedAt(record) },
    );
    return json({ ok: true, ...result });
  }
  if (action === "save-bucket-row") {
    const result = await pto.savePtoBucketRowToMysql(
      requirePayloadRecord(record.row, "row") as PtoBucketRow,
      requirePayloadNumber(record.sortIndex, "sortIndex"),
      { expectedUpdatedAt: optionalExpectedUpdatedAt(record) },
    );
    return json({ ok: true, ...result });
  }
  if (action === "delete-bucket-row") {
    const result = await pto.deletePtoBucketRowFromMysql(requirePayloadString(record.rowKey, "rowKey"), {
      expectedUpdatedAt: optionalExpectedUpdatedAt(record),
    });
    return json({ ok: true, ...result });
  }
  if (action === "save-bucket-value") {
    const result = await pto.savePtoBucketValueToMysql(
      requirePayloadString(record.cellKey, "cellKey"),
      optionalPayloadNumberOrNull(record.value, "value"),
      { expectedUpdatedAt: optionalExpectedUpdatedAt(record) },
    );
    return json({ ok: true, ...result });
  }
  if (action === "delete-bucket-values") {
    const result = await pto.deletePtoBucketValuesFromMysql(
      requirePayloadArray(record.cellKeys, "cellKeys").map((cellKey) => requirePayloadString(cellKey, "cellKeys[]")),
      { expectedUpdatedAt: optionalExpectedUpdatedAt(record) },
    );
    return json({ ok: true, ...result });
  }

  return undefined;
};
