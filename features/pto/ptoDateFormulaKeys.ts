import type { PtoFormulaCellIdentity, PtoFormulaTemplateIdentity } from "@/features/pto/ptoDateFormulaTypes";

export function ptoFormulaCellKey(cell: PtoFormulaCellIdentity) {
  return `${cell.rowId}:${cell.kind}:${cell.month ?? cell.day ?? ""}`;
}

export function ptoFormulaTemplateKey(cell: PtoFormulaTemplateIdentity) {
  return `${cell.kind}:${cell.month ?? cell.day ?? ""}`;
}
