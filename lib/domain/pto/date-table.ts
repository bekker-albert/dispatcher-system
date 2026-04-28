import { ptoDateTableKeys, type PtoDateTableKey } from "./date-table-types";

export type {
  PtoDateTableKey,
  PtoDraftRowFields,
  PtoDropPosition,
  PtoPlanRow,
  PtoStatus,
} from "./date-table-types";

export {
  defaultPtoPlanMonth,
  emptyPtoDraftRowFields,
  ptoColumnDefaults,
  ptoCustomerCodeOptions,
  ptoUnitOptions,
} from "./date-table-types";
export { ptoDateTableKeys };

export {
  dateRange,
  distributeMonthlyTotal,
  distributeTotal,
  monthDays,
  nextDate,
  yearMonths,
} from "./date-table-calendar";

export {
  normalizePtoYearValue,
  normalizeStoredPtoYears,
  ptoRowHasYear,
  ptoYearOptions,
  ptoYearOptionsFromSources,
  previousPtoYearLabel,
  removeYearFromPtoRows,
  type PtoYearOptionSource,
} from "./date-table-years";

export {
  ptoMonthTotal,
  ptoYearTotal,
} from "./date-table-totals";

export {
  normalizePtoCustomerCode,
  normalizePtoPlanRow,
  normalizePtoUnit,
  ptoCustomerCodeLabel,
} from "./date-table-normalization";

export {
  ptoAutomatedStatus,
  ptoStatusRowBackground,
} from "./date-table-status";

export {
  ptoAreaMatches,
  ptoCustomerPlanRowSignature,
  ptoLinkedRowMatches,
  ptoLinkedRowSignature,
  reorderPtoRows,
} from "./date-table-signatures";

export {
  createEmptyPtoDateRow,
  insertPtoRowAfter,
  ptoFieldLogLabel,
  ptoRowFieldDomKey,
} from "./date-table-rows";

export {
  ptoAutoCarryover,
  ptoCarryoverIsManual,
  ptoEffectiveCarryover,
  ptoStoredCarryover,
  ptoYearTotalWithCarryover,
} from "./date-table-carryover";

export function isPtoDateTableKey(value: string): value is PtoDateTableKey {
  return (ptoDateTableKeys as readonly string[]).includes(value);
}

export function ptoDateTableKeyFromTab(value: string): PtoDateTableKey | null {
  return isPtoDateTableKey(value) ? value : null;
}
