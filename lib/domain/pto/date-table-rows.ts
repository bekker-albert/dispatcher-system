import { createId } from "../../utils/id";
import { uniqueSorted } from "../../utils/text";
import type { PtoPlanRow, PtoStatus } from "./date-table-types";
import { normalizePtoCustomerCode, normalizePtoUnit } from "./date-table-normalization";
import { ptoLinkedRowMatches, ptoLinkedRowSignature } from "./date-table-signatures";

export function createEmptyPtoDateRow(
  status: PtoStatus,
  selectedArea: string,
  selectedYear: string,
  id = createId(),
  overrides: Partial<PtoPlanRow> = {},
): PtoPlanRow {
  const resolvedArea = overrides.area ?? (selectedArea === "\u0412\u0441\u0435 \u0443\u0447\u0430\u0441\u0442\u043a\u0438" ? "" : `\u0423\u0447_${selectedArea}`);

  return {
    id,
    area: resolvedArea,
    location: overrides.location ?? "",
    structure: overrides.structure ?? "",
    customerCode: normalizePtoCustomerCode(overrides.customerCode),
    unit: normalizePtoUnit(overrides.unit),
    status,
    carryover: Number(overrides.carryover ?? 0),
    carryovers: overrides.carryovers,
    carryoverManualYears: overrides.carryoverManualYears,
    dailyPlans: overrides.dailyPlans ?? {},
    years: uniqueSorted([...(overrides.years ?? []), selectedYear]),
  };
}

export function insertPtoRowAfter(current: PtoPlanRow[], targetRow: PtoPlanRow | undefined, nextRow: PtoPlanRow) {
  if (!targetRow) return [...current, nextRow];

  const targetSignature = ptoLinkedRowSignature(targetRow);
  const targetIndex = current.findIndex((row) => ptoLinkedRowMatches(row, targetRow.id, targetSignature));
  if (targetIndex < 0) return [...current, nextRow];

  return [
    ...current.slice(0, targetIndex + 1),
    nextRow,
    ...current.slice(targetIndex + 1),
  ];
}

export function ptoFieldLogLabel(field: string) {
  const labels: Record<string, string> = {
    area: "\u0423\u0447\u0430\u0441\u0442\u043e\u043a",
    location: "\u041c\u0435\u0441\u0442\u043e\u043d\u0430\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u0435",
    structure: "\u0421\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0430",
    customerCode: "\u0417\u0430\u043a\u0430\u0437\u0447\u0438\u043a",
    unit: "\u0415\u0434.",
    carryover: "\u041e\u0441\u0442\u0430\u0442\u043a\u0438",
  };

  return labels[field] ?? field;
}

export function ptoRowFieldDomKey(rowId: string, field: string) {
  return `${rowId}:${field}`;
}
