import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { AdminLogEntry } from "@/lib/domain/admin/logs";
import {
  defaultPtoPlanMonth,
  distributeMonthlyTotal,
  ptoFieldLogLabel,
  ptoLinkedRowMatches,
  ptoLinkedRowSignature,
  type PtoPlanRow,
} from "@/lib/domain/pto/date-table";
import { parseDecimalValue } from "@/lib/domain/pto/formatting";
import { uniqueSorted } from "@/lib/utils/text";

type AdminLogInput = Omit<AdminLogEntry, "id" | "at" | "user">;

type PtoRowsSetter = Dispatch<SetStateAction<PtoPlanRow[]>>;

type PtoDayPatch = {
  rowId: string;
  day: string;
  value: number | null;
};

type PtoDateRowEditableField = keyof Omit<PtoPlanRow, "id" | "dailyPlans">;

type UsePtoDateRowValueEditorOptions = {
  ptoPlanRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
  ptoPlanYear: string;
  currentPtoTableLabel: () => string;
  setPtoPlanRows: PtoRowsSetter;
  setPtoOperRows: PtoRowsSetter;
  setPtoSurveyRows: PtoRowsSetter;
  saveDayPatch: (rowId: string, day: string, value: number | null) => void;
  saveDayPatches: (values: PtoDayPatch[]) => void;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function usePtoDateRowValueEditor({
  ptoPlanRows,
  ptoOperRows,
  ptoSurveyRows,
  ptoPlanYear,
  currentPtoTableLabel,
  setPtoPlanRows,
  setPtoOperRows,
  setPtoSurveyRows,
  saveDayPatch,
  saveDayPatches,
  addAdminLog,
}: UsePtoDateRowValueEditorOptions) {
  const updatePtoDateRow = useCallback((setRows: PtoRowsSetter, id: string, field: PtoDateRowEditableField, value: string) => {
    const numericFields: Array<keyof PtoPlanRow> = ["carryover"];
    const sharedFields: PtoDateRowEditableField[] = ["area", "location", "structure", "unit"];
    const updatedValue = numericFields.includes(field) ? parseDecimalValue(value) : value;
    const linkedRow = [...ptoPlanRows, ...ptoOperRows, ...ptoSurveyRows].find((row) => row.id === id);
    const linkedSignature = linkedRow ? ptoLinkedRowSignature(linkedRow) : "";

    if (field === "carryover") {
      setRows((current) =>
        current.map((row) => {
          if (row.id !== id) return row;

          return {
            ...row,
            carryover: Number(updatedValue),
            carryovers: {
              ...(row.carryovers ?? {}),
              [ptoPlanYear]: Number(updatedValue),
            },
            carryoverManualYears: uniqueSorted([...(row.carryoverManualYears ?? []), ptoPlanYear]),
            years: uniqueSorted([...(row.years ?? []), ptoPlanYear]),
          };
        }),
      );
      addAdminLog({
        action: "Редактирование",
        section: "ПТО",
        details: `Изменено поле "${ptoFieldLogLabel(field)}" в ${currentPtoTableLabel()}.`,
      });
      return;
    }

    if (sharedFields.includes(field)) {
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
      current.map((row) => {
        if (row.id !== id) return row;

        const carryovers = { ...(row.carryovers ?? {}) };
        delete carryovers[year];

        return {
          ...row,
          carryover: year === defaultPtoPlanMonth.slice(0, 4) ? 0 : row.carryover,
          carryovers,
          carryoverManualYears: (row.carryoverManualYears ?? []).filter((rowYear) => rowYear !== year),
        };
      }),
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

    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;

        const dailyPlans = { ...row.dailyPlans };
        const year = day.slice(0, 4);
        if (parsedValue === null) {
          delete dailyPlans[day];
        } else {
          dailyPlans[day] = parsedValue;
        }

        return {
          ...row,
          dailyPlans,
          years: uniqueSorted([...(row.years ?? []), year]),
        };
      }),
    );
    saveDayPatch(id, day, parsedValue);
    addAdminLog({
      action: "Редактирование",
      section: "ПТО",
      details: `Изменено значение за день ${day} в ${currentPtoTableLabel()}.`,
    });
  }, [addAdminLog, currentPtoTableLabel, saveDayPatch]);

  const updatePtoMonthTotal = useCallback((setRows: PtoRowsSetter, id: string, days: string[], value: string) => {
    const distributedValues = value.trim() ? distributeMonthlyTotal(parseDecimalValue(value), days) : {};

    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;

        const nextDailyPlans = { ...row.dailyPlans };
        days.forEach((day) => {
          delete nextDailyPlans[day];
        });

        if (value.trim()) {
          Object.assign(nextDailyPlans, distributedValues);
        }

        return {
          ...row,
          dailyPlans: nextDailyPlans,
          years: days[0] ? uniqueSorted([...(row.years ?? []), days[0].slice(0, 4)]) : row.years,
        };
      }),
    );
    saveDayPatches(days.map((day) => ({
      rowId: id,
      day,
      value: distributedValues[day] ?? null,
    })));
    addAdminLog({
      action: "Редактирование",
      section: "ПТО",
      details: `Распределен итог месяца в ${currentPtoTableLabel()}.`,
    });
  }, [addAdminLog, currentPtoTableLabel, saveDayPatches]);

  return {
    updatePtoDateRow,
    clearPtoCarryoverOverride,
    updatePtoDateDay,
    updatePtoMonthTotal,
  };
}
