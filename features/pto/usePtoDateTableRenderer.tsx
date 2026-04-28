"use client";

import type { ComponentProps, Dispatch, SetStateAction } from "react";
import { PtoDateTableContainer } from "@/features/pto/PtoDateTableContainer";
import type { PtoDateTableOptions } from "@/features/pto/ptoDateTableTypes";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

type PtoDateTableContainerProps = ComponentProps<typeof PtoDateTableContainer>;
export type PtoDateTableRendererOptions = Omit<PtoDateTableContainerProps, "rows" | "setRows" | "options">;

export function usePtoDateTableRenderer(rendererOptions: PtoDateTableRendererOptions) {
  return function renderPtoDateTable(
    rows: PtoPlanRow[],
    setRows: Dispatch<SetStateAction<PtoPlanRow[]>>,
    options: PtoDateTableOptions = {},
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
