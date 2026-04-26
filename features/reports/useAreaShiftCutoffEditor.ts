"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { isValidAreaShiftCutoffTime, type AreaShiftCutoffMap } from "@/lib/domain/admin/area-schedule";

type AreaShiftCutoffEditorOptions = {
  setAreaShiftCutoffs: Dispatch<SetStateAction<AreaShiftCutoffMap>>;
};

export function useAreaShiftCutoffEditor({ setAreaShiftCutoffs }: AreaShiftCutoffEditorOptions) {
  const updateAreaShiftCutoff = useCallback((area: string, value: string) => {
    if (!isValidAreaShiftCutoffTime(value)) return;

    setAreaShiftCutoffs((current) => ({
      ...current,
      [area]: value,
    }));
  }, [setAreaShiftCutoffs]);

  return {
    updateAreaShiftCutoff,
  };
}
