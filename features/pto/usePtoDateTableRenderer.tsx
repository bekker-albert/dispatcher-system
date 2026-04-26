"use client";

import type { ComponentProps, Dispatch, SetStateAction } from "react";
import { PtoDateTableContainer } from "@/features/pto/PtoDateTableContainer";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

type PtoDateTableContainerProps = ComponentProps<typeof PtoDateTableContainer>;
type PtoDateTableRendererOptions = Omit<PtoDateTableContainerProps, "rows" | "setRows" | "options">;

export function usePtoDateTableRenderer(rendererOptions: PtoDateTableRendererOptions) {
  return function renderPtoDateTable(
    rows: PtoPlanRow[],
    setRows: Dispatch<SetStateAction<PtoPlanRow[]>>,
    options: { showLocation?: boolean; editableMonthTotal?: boolean } = {},
  ) {
    return (
      <PtoDateTableContainer
        rows={rows}
        setRows={setRows}
        options={options}
        {...rendererOptions}
      />
    );
  };
}
