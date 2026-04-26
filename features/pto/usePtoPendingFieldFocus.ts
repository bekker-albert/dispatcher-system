"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { ptoRowFieldDomKey, type PtoPlanRow } from "@/lib/domain/pto/date-table";

type PtoPendingFieldFocus = {
  rowId: string;
  field: string;
} | null;

type PtoPendingFieldFocusOptions = {
  pendingFieldFocus: PtoPendingFieldFocus;
  setPendingFieldFocus: Dispatch<SetStateAction<PtoPendingFieldFocus>>;
  ptoPlanRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
};

export function usePtoPendingFieldFocus({
  pendingFieldFocus,
  setPendingFieldFocus,
  ptoPlanRows,
  ptoOperRows,
  ptoSurveyRows,
}: PtoPendingFieldFocusOptions) {
  useEffect(() => {
    if (!pendingFieldFocus) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const element = document.querySelector<HTMLInputElement | HTMLSelectElement>(
        `[data-pto-row-field="${ptoRowFieldDomKey(pendingFieldFocus.rowId, pendingFieldFocus.field)}"]`,
      );

      if (!element) return;
      element.focus();
      if (element instanceof HTMLInputElement) {
        const valueLength = element.value.length;
        element.setSelectionRange(valueLength, valueLength);
      }
      setPendingFieldFocus(null);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pendingFieldFocus, ptoOperRows, ptoPlanRows, ptoSurveyRows, setPendingFieldFocus]);
}
