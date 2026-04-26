"use client";

import type { Dispatch, KeyboardEvent, SetStateAction } from "react";
import {
  emptyPtoDraftRowFields,
  normalizePtoCustomerCode,
  normalizePtoUnit,
  type PtoDraftRowFields,
  type PtoPlanRow,
} from "@/lib/domain/pto/date-table";

type PtoDraftRowControllerOptions = {
  editing: boolean;
  areaFilter: string;
  showCustomerCode: boolean;
  draftFields: PtoDraftRowFields;
  setDraftFields: Dispatch<SetStateAction<PtoDraftRowFields>>;
  addLinkedRow: (overrides?: Partial<PtoPlanRow>, insertAfterRow?: PtoPlanRow) => string;
  setPendingFieldFocus: Dispatch<SetStateAction<{ rowId: string; field: string } | null>>;
};

export function usePtoDraftRowController({
  editing,
  areaFilter,
  showCustomerCode,
  draftFields,
  setDraftFields,
  addLinkedRow,
  setPendingFieldFocus,
}: PtoDraftRowControllerOptions) {
  const draftHasValue = Object.values(draftFields).some((value) => value.trim());

  const updateDraftField = (field: "area" | "location" | "customerCode" | "structure" | "unit", value: string) => {
    setDraftFields((current) => ({ ...current, [field]: value }));
  };

  const clearDraftRow = () => setDraftFields({ ...emptyPtoDraftRowFields });

  const commitDraftRow = (focusField: "area" | "location" | "structure" = "structure") => {
    if (!editing || !draftHasValue) return null;

    const nextRowId = addLinkedRow({
      area: draftFields.area.trim(),
      location: draftFields.location.trim(),
      customerCode: showCustomerCode ? normalizePtoCustomerCode(draftFields.customerCode) : "",
      structure: draftFields.structure.trim(),
      unit: normalizePtoUnit(draftFields.unit),
    });
    clearDraftRow();
    setPendingFieldFocus({ rowId: nextRowId, field: focusField });

    return nextRowId;
  };

  const handleDraftKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    focusField: "area" | "location" | "structure" = "structure",
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitDraftRow(focusField);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clearDraftRow();
    }
  };

  const addRowAfter = (row: PtoPlanRow) => {
    if (!editing) return;

    const nextRowId = addLinkedRow({
      area: row.area,
      location: row.location,
      customerCode: showCustomerCode ? row.customerCode : "",
      unit: row.unit,
    }, row);
    setPendingFieldFocus({ rowId: nextRowId, field: "structure" });
  };

  const addRowFromDraft = () => {
    if (!editing) return;
    if (commitDraftRow(areaFilter === "Все участки" ? "area" : "structure")) return;

    const nextRowId = addLinkedRow();
    setPendingFieldFocus({ rowId: nextRowId, field: areaFilter === "Все участки" ? "area" : "structure" });
  };

  return {
    draftHasValue,
    updateDraftField,
    handleDraftKeyDown,
    addRowAfter,
    addRowFromDraft,
  };
}
