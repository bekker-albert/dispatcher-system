import { cleanAreaName, normalizeLookupValue } from "../../utils/text";
import type { PtoDropPosition, PtoPlanRow } from "./date-table-types";
import { normalizePtoCustomerCode } from "./date-table-normalization";

export function ptoLinkedRowSignature(row: PtoPlanRow) {
  const signature = [
    cleanAreaName(row.area),
    row.structure,
    row.unit,
  ].map(normalizeLookupValue).join(":");

  return signature === "::" ? "" : signature;
}

export function ptoCustomerPlanRowSignature(row: PtoPlanRow) {
  const baseSignature = ptoLinkedRowSignature(row);
  const customerCode = normalizePtoCustomerCode(row.customerCode);

  return customerCode ? `${baseSignature}:${normalizeLookupValue(customerCode)}` : baseSignature;
}

export function ptoAreaMatches(rowArea: string, filterArea: string) {
  return filterArea === "\u0412\u0441\u0435 \u0443\u0447\u0430\u0441\u0442\u043a\u0438" || normalizeLookupValue(rowArea) === normalizeLookupValue(filterArea);
}

export function ptoLinkedRowMatches(row: PtoPlanRow, id: string, signature: string) {
  return row.id === id || (signature !== "" && ptoLinkedRowSignature(row) === signature);
}

export function reorderPtoRows(
  rows: PtoPlanRow[],
  sourceId: string,
  sourceSignature: string,
  targetId: string,
  targetSignature: string,
  position: PtoDropPosition,
) {
  const sourceIndex = rows.findIndex((row) => ptoLinkedRowMatches(row, sourceId, sourceSignature));
  const targetIndex = rows.findIndex((row) => ptoLinkedRowMatches(row, targetId, targetSignature));

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return rows;

  const nextRows = [...rows];
  const [movedRow] = nextRows.splice(sourceIndex, 1);
  const nextTargetIndex = nextRows.findIndex((row) => ptoLinkedRowMatches(row, targetId, targetSignature));
  if (nextTargetIndex < 0) return rows;

  nextRows.splice(position === "after" ? nextTargetIndex + 1 : nextTargetIndex, 0, movedRow);

  return nextRows;
}
