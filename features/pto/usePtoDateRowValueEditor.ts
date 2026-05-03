import { useCallback } from "react";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import {
  distributeMonthlyTotal,
  ptoFieldLogLabel,
  ptoLinkedRowMatches,
  ptoLinkedRowSignature,
  type PtoPlanRow,
} from "@/lib/domain/pto/date-table";
import {
  clearPtoCarryoverForYear,
  parsePtoEditableFieldValue,
  ptoSharedEditableFields,
  updatePtoCarryoverForYear,
  updatePtoDayValue,
  updatePtoMonthValues,
  type PtoDateRowEditableField,
} from "@/lib/domain/pto/date-row-edits";
import { parseDecimalValue } from "@/lib/domain/pto/formatting";
import type { PtoDayPatch, PtoRowsSetter } from "@/features/pto/ptoDateTableTypes";

type UsePtoDateRowValueEditorOptions = {
  ptoPlanRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
  currentPtoRows: PtoPlanRow[];
  ptoPlanYear: string;
  currentPtoTableLabel: () => string;
  setPtoPlanRows: PtoRowsSetter;
  setPtoOperRows: PtoRowsSetter;
  setPtoSurveyRows: PtoRowsSetter;
  saveDayPatch: (row: PtoPlanRow, day: string, value: number | null, onError?: () => void) => boolean;
  saveDayPatches: (row: PtoPlanRow, values: PtoDayPatch[], onError?: () => void) => boolean;
  requestSave: () => void;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function usePtoDateRowValueEditor({
  ptoPlanRows,
  ptoOperRows,
  ptoSurveyRows,
  currentPtoRows,
  ptoPlanYear,
  currentPtoTableLabel,
  setPtoPlanRows,
  setPtoOperRows,
  setPtoSurveyRows,
  saveDayPatch,
  saveDayPatches,
  requestSave,
  addAdminLog,
}: UsePtoDateRowValueEditorOptions) {
  const updatePtoDateRow = useCallback((setRows: PtoRowsSetter, id: string, field: PtoDateRowEditableField, value: string) => {
    const updatedValue = parsePtoEditableFieldValue(field, value);
    const linkedRow = [...ptoPlanRows, ...ptoOperRows, ...ptoSurveyRows].find((row) => row.id === id);
    const linkedSignature = linkedRow ? ptoLinkedRowSignature(linkedRow) : "";

    if (field === "carryover") {
      setRows((current) =>
        current.map((row) => (row.id === id ? updatePtoCarryoverForYear(row, ptoPlanYear, Number(updatedValue)) : row)),
      );
      addAdminLog({
        action: "Редактирование",
        section: "ПТО",
        details: `Изменено поле "${ptoFieldLogLabel(field)}" в ${currentPtoTableLabel()}.`,
      });
      return;
    }

    if (ptoSharedEditableFields.includes(field)) {
      const updateLinkedRows = (current: PtoPlanRow[]) =>
        current.map((row) =>
          ptoLinkedRowMatches(row, id, linkedSignature)
            ? { ...row, [field]: updatedValue }
            : row,
        );

      setPtoPlanRows(updateLinkedRows);
      setPtoOperRows(updateLinkedRows);
      setPtoSurveyRows(updateLinkedRows);
      addAdminLog({
        action: "Редактирование",
        section: "ПТО",
        details: `Изменено поле "${ptoFieldLogLabel(field)}" в связанных строках ПТО.`,
      });
      return;
    }

    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: updatedValue } : row)),
    );
    addAdminLog({
      action: "Редактирование",
      section: "ПТО",
      details: `Изменено поле "${ptoFieldLogLabel(field)}" в ${currentPtoTableLabel()}.`,
    });
  }, [addAdminLog, currentPtoTableLabel, ptoOperRows, ptoPlanRows, ptoPlanYear, ptoSurveyRows, setPtoOperRows, setPtoPlanRows, setPtoSurveyRows]);

  const clearPtoCarryoverOverride = useCallback((setRows: PtoRowsSetter, id: string, year: string) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? clearPtoCarryoverForYear(row, year) : row)),
    );
    addAdminLog({
      action: "Редактирование",
      section: "ПТО",
      details: `Очищены остатки за ${year} год в ${currentPtoTableLabel()}.`,
    });
  }, [addAdminLog, currentPtoTableLabel]);

  const updatePtoDateDay = useCallback((setRows: PtoRowsSetter, id: string, day: string, value: string) => {
    const trimmedValue = value.trim();
    const parsedValue = trimmedValue === "" ? null : parseDecimalValue(value);
    const currentRow = currentPtoRows.find((row) => row.id === id);
    let rowToSave: PtoPlanRow | null = null;

    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;

        const updatedRow = updatePtoDayValue(row, day, parsedValue);
        rowToSave = updatedRow;
        return updatedRow;
      }),
    );
    if (!rowToSave && currentRow) {
      rowToSave = updatePtoDayValue(currentRow, day, parsedValue);
    }
    const inlineSaveQueued = rowToSave ? saveDayPatch(rowToSave, day, parsedValue, requestSave) : false;
    if (!inlineSaveQueued) requestSave();
    addAdminLog({
      action: "Редактирование",
      section: "ПТО",
      details: `Изменено значение за день ${day} в ${currentPtoTableLabel()}.`,
    });
  }, [addAdminLog, currentPtoRows, currentPtoTableLabel, requestSave, saveDayPatch]);

  const updatePtoMonthTotal = useCallback((setRows: PtoRowsSetter, id: string, days: string[], value: string) => {
    const distributedValues = value.trim() ? distributeMonthlyTotal(parseDecimalValue(value), days) : {};
    const currentRow = currentPtoRows.find((row) => row.id === id);
    let rowToSave: PtoPlanRow | null = null;

    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;

        const updatedRow = updatePtoMonthValues(row, days, distributedValues);
        rowToSave = updatedRow;
        return updatedRow;
      }),
    );
    const patches = days.map((day) => ({
      rowId: id,
      day,
      value: distributedValues[day] ?? null,
    }));
    if (!rowToSave && currentRow) {
      rowToSave = updatePtoMonthValues(currentRow, days, distributedValues);
    }
    const inlineSaveQueued = rowToSave ? saveDayPatches(rowToSave, patches, requestSave) : false;
    if (!inlineSaveQueued) requestSave();
    addAdminLog({
      action: "Редактирование",
      section: "ПТО",
      details: `Распределен итог месяца в ${currentPtoTableLabel()}.`,
    });
  }, [addAdminLog, currentPtoRows, currentPtoTableLabel, requestSave, saveDayPatches]);

  return {
    updatePtoDateRow,
    clearPtoCarryoverOverride,
    updatePtoDateDay,
    updatePtoMonthTotal,
  };
}
